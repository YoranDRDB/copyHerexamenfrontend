// __tests__/rest/users.spec.ts
import type supertest from "supertest";
import { prisma } from "../../src/data";
import withServer from "../helpers/withServer";
import { login, loginAdmin } from "../helpers/login";
import testAuthHeader from "../helpers/testAuthHeader";
import { hashPassword } from "../../src/core/password";
import Role from "../../src/core/roles";

describe("Users", () => {
  let request: supertest.Agent;
  let authHeader: string;
  let adminAuthHeader: string;

  withServer((r) => (request = r));

  beforeAll(async () => {
    authHeader = await login(request);
    adminAuthHeader = await loginAdmin(request);
  });

  afterAll(async () => {
    // Clean up
    await prisma.user.deleteMany({ where: { id: { in: [1, 2] } } });
  });

  const url = "/api/users";

  describe("POST /api/users", () => {
    const createdUserIds: number[] = [];

    afterAll(async () => {
      if (createdUserIds.length > 0) {
        await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
      }
    });

    it("should 200 and return a token after registering", async () => {
      const response = await request.post(url).send({
        username: "NewUser",
        email: "newuser@example.com",
        password: "ThisIsASecretPassword123",
      });

      expect(response.status).toBe(200);
      expect(response.body.token).toBeTruthy();

      // Haal nieuwe user op uit DB om ID te saven
      const newUser = await prisma.user.findUnique({
        where: { email: "newuser@example.com" },
      });
      expect(newUser).toBeTruthy();
      if (newUser) createdUserIds.push(newUser.id);
    });

    it("should 400 when missing username", async () => {
      const response = await request.post(url).send({
        email: "fail@example.com",
        password: "SomePassword123",
      });
      expect(response.status).toBe(400);
      expect(response.body.code).toBe("VALIDATION_FAILED");
    });
    it("should 409 when email already exists", async () => {
      const response = await request.post(url).send({
        username: "DuplicateUser",
        email: "test.user@hogent.be",
        password: "SomePassword123",
      });

      expect(response.status).toBe(409);
      expect(response.body.code).toBe("CONFLICT");
    });

    testAuthHeader(() => request.post(url));
  });

  describe("GET /api/users", () => {
    it("should 200 and return all users for admin", async () => {
      const response = await request
        .get(url)
        .set("Authorization", adminAuthHeader);
      expect(response.status).toBe(200);
      expect(response.body.items.length).toBeGreaterThanOrEqual(2); // Gecreëerde users
      expect(response.body.items).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ email: "test.user@hogent.be" }),
          expect.objectContaining({ email: "admin.user@hogent.be" }),
        ])
      );
    });

    it("should 403 for regular user", async () => {
      const response = await request.get(url).set("Authorization", authHeader);
      expect(response.status).toBe(403);
      expect(response.body.code).toBe("FORBIDDEN");
    });

    testAuthHeader(() => request.get(url));
  });

  describe("GET /api/users/:id", () => {
    it("should 200 and return the requested user if admin", async () => {
      const response = await request
        .get(`${url}/1`)
        .set("Authorization", adminAuthHeader);
      expect(response.status).toBe(200);
      expect(response.body.email).toBe("test.user@hogent.be");
    });

    it("should 200 if regular user requests their own data via /:id", async () => {
      const response = await request
        .get(`${url}/1`)
        .set("Authorization", authHeader);
      expect(response.status).toBe(200);
      expect(response.body.email).toBe("test.user@hogent.be");
    });

    it("should 403 if regular user requests another user’s data", async () => {
      const response = await request
        .get(`${url}/2`)
        .set("Authorization", authHeader);
      expect(response.status).toBe(403);
      expect(response.body.code).toBe("FORBIDDEN");
    });

    it("should 404 if user does not exist", async () => {
      const response = await request
        .get(`${url}/9999`)
        .set("Authorization", adminAuthHeader);
      expect(response.status).toBe(404);
      expect(response.body.code).toBe("NOT_FOUND");
    });

    it("should 400 with invalid user id", async () => {
      const response = await request
        .get(`${url}/invalid`)
        .set("Authorization", adminAuthHeader);
      expect(response.status).toBe(400);
      expect(response.body.code).toBe("VALIDATION_FAILED");
    });

    testAuthHeader(() => request.get(`${url}/1`));
  });

  describe("PUT /api/users/:id", () => {
    it("should 200 and update user if admin", async () => {
      const response = await request
        .put(`${url}/1`)
        .set("Authorization", adminAuthHeader)
        .send({ username: "RegularUserUpdated" });

      expect(response.status).toBe(200);
      expect(response.body.username).toBe("RegularUserUpdated");
    });

    it("should allow user to update their own data", async () => {
      const response = await request
        .put(`${url}/1`)
        .set("Authorization", authHeader)
        .send({ username: "RegularUserSelfUpdate" });

      expect(response.status).toBe(200);
      expect(response.body.username).toBe("RegularUserSelfUpdate");
    });

    it("should 403 if user tries to update someone else’s data", async () => {
      const response = await request
        .put(`${url}/2`)
        .set("Authorization", authHeader)
        .send({ username: "HackerUser" });

      expect(response.status).toBe(403);
      expect(response.body.code).toBe("FORBIDDEN");
    });

    it("should 404 if user does not exist", async () => {
      const response = await request
        .put(`${url}/9999`)
        .set("Authorization", adminAuthHeader)
        .send({ username: "NoOne" });

      expect(response.status).toBe(404);
      expect(response.body.code).toBe("NOT_FOUND");
    });

    it("should 400 if invalid fields", async () => {
      const response = await request
        .put(`${url}/1`)
        .set("Authorization", adminAuthHeader)
        .send({ email: "not-an-email" });

      expect(response.status).toBe(400);
      expect(response.body.code).toBe("VALIDATION_FAILED");
    });

    testAuthHeader(() => request.put(`${url}/1`));
  });

  describe("DELETE /api/users/:id", () => {
    let tempUserId: number | null = null;

    beforeAll(async () => {
      const tempUser = await prisma.user.create({
        data: {
          username: "DeleteMe",
          email: "deleteme@example.com",
          passwordHash: await hashPassword("12345678"),
          role: Role.USER,
        },
      });
      tempUserId = tempUser.id;
    });

    afterAll(async () => {
      if (tempUserId) {
        await prisma.user.delete({ where: { id: tempUserId } }).catch(() => {});
      }
    });

    it("should 204 if admin deletes a user", async () => {
      const response = await request
        .delete(`${url}/${tempUserId}`)
        .set("Authorization", adminAuthHeader);
      expect(response.status).toBe(204);
    });

    it("should allow user to delete their own account", async () => {
      const selfUser = await prisma.user.create({
        data: {
          username: "SelfDelete",
          email: "selfdelete@example.com",
          passwordHash: await hashPassword("12345678"),
          role: Role.USER,
        },
      });

      const selfAuth = await login(request);
      const response = await request
        .delete(`${url}/${selfUser.id}`)
        .set("Authorization", selfAuth);
      expect(response.status).toBe(204);
    });

    it("should 403 if user tries to delete someone else’s account", async () => {
      const response = await request
        .delete(`${url}/2`)
        .set("Authorization", authHeader);
      expect(response.status).toBe(403);
      expect(response.body.code).toBe("FORBIDDEN");
    });

    it("should 404 if user does not exist", async () => {
      const response = await request
        .delete(`${url}/9999`)
        .set("Authorization", adminAuthHeader);
      expect(response.status).toBe(404);
      expect(response.body.code).toBe("NOT_FOUND");
    });

    it("should 400 with invalid user id", async () => {
      const response = await request
        .delete(`${url}/invalid`)
        .set("Authorization", authHeader);
      expect(response.status).toBe(400);
      expect(response.body.code).toBe("VALIDATION_FAILED");
    });

    testAuthHeader(() => request.delete(`${url}/1`));
    describe("Admin-specific Actions", () => {
      it("should 200 and allow admin to assign admin role to a user", async () => {
        // Eerst maak een nieuwe gebruiker aan
        const newUserResponse = await request.post(url).send({
          username: "UserToPromote",
          email: "promote.user@example.com",
          password: "PromotePassword123",
        });

        expect(newUserResponse.status).toBe(200);
        expect(newUserResponse.body.token).toBeTruthy();

        // Haal de nieuwe gebruiker op uit de database
        const newUser = await prisma.user.findUnique({
          where: { email: "promote.user@example.com" },
        });
        expect(newUser).toBeTruthy();
        if (!newUser) {
          throw new Error("Nieuwe gebruiker kon niet worden gevonden");
        }

        // Admin wijzigt de rol van de nieuwe gebruiker naar admin
        const promoteResponse = await request
          .put(`${url}/${newUser.id}`)
          .set("Authorization", adminAuthHeader)
          .send({ role: "admin" });

        expect(promoteResponse.status).toBe(200);
        expect(promoteResponse.body.role).toBe("admin");

        // Optioneel: Controleer of de rol daadwerkelijk is gewijzigd in de database
        const updatedUser = await prisma.user.findUnique({
          where: { id: newUser.id },
        });
        expect(updatedUser).toBeTruthy();
        expect(updatedUser?.role).toBe("admin");
      });
    });
  });
});
