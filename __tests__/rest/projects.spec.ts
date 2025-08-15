import type supertest from "supertest";
import { prisma } from "../../src/data";
import withServer from "../helpers/withServer";
import { login, loginAdmin } from "../helpers/login";
import testAuthHeader from "../helpers/testAuthHeader";
import { hashPassword } from "../../src/core/password";
import { generateTestId } from "../helpers/testIds";
import { createProject } from "../helpers/createProject";

describe("Projects", () => {
  let request: supertest.Agent;
  let authHeader: string;
  let adminAuthHeader: string;
  let testUser: { id: number };

  withServer((r) => (request = r));

  beforeAll(async () => {
    // Log in als gewone gebruiker en admin gebruiker
    authHeader = await login(request);
    adminAuthHeader = await loginAdmin(request);
    testUser = await prisma.user.findUniqueOrThrow({
      where: { email: "test.user@hogent.be" },
      select: { id: true },
    });
  });

  const url = "/api/projects";

  describe("GET /api/projects", () => {
    it("should 200 and return all projects owned by the user", async () => {
      const response = await request.get(url).set("Authorization", authHeader);
      expect(response.status).toBe(200);
      expect(response.body.items).toHaveLength(4); // Aantal centrale projecten
    });

    it("should 200 and return empty array if user has no projects", async () => {
      const otherUserEmail = "noprojects@example.com";
      // Maak een nieuwe gebruiker aan zonder projecten
      await prisma.user.create({
        data: {
          id: generateTestId(),
          username: "NoProjectsUser",
          email: otherUserEmail,
          passwordHash: await hashPassword("12345678"),
          role: "user",
        },
      });

      const otherAuth = await login(request);
      const response = await request.get(url).set("Authorization", otherAuth);
      expect(response.status).toBe(200);
      expect(response.body.items).toHaveLength(0);

      // Opruimen
      await prisma.user.delete({ where: { email: otherUserEmail } });
    });

    testAuthHeader(() => request.get(url));
  });

  describe("POST /api/projects", () => {
    let createdProjectIds: number[] = [];

    afterAll(async () => {
      if (createdProjectIds.length > 0) {
        await prisma.project.deleteMany({
          where: { id: { in: createdProjectIds } },
        });
      }
    });

    it("should 201 and create a new project for the user", async () => {
      const response = await request
        .post(url)
        .set("Authorization", authHeader)
        .send({
          name: "New Marketing Campaign",
          description: "Launch a new campaign",
        });

      expect(response.status).toBe(201);
      expect(response.body.id).toBeTruthy();
      expect(response.body.name).toBe("New Marketing Campaign");
      createdProjectIds.push(response.body.id);
    });
    it("should trim description and store null for empty strings", async () => {
      const respTrim = await request
        .post(url)
        .set("Authorization", authHeader)
        .send({
          name: "Trim Project",
          description: "  trimmed description  ",
        });

      expect(respTrim.status).toBe(201);
      expect(respTrim.body.description).toBe("trimmed description");
      createdProjectIds.push(respTrim.body.id);

      const respNull = await request
        .post(url)
        .set("Authorization", authHeader)
        .send({ name: "Null Project", description: "   " });

      expect(respNull.status).toBe(201);
      expect(respNull.body.description).toBeNull();
      createdProjectIds.push(respNull.body.id);
    });

    it("should 400 when missing name", async () => {
      const response = await request
        .post(url)
        .set("Authorization", authHeader)
        .send({ description: "Missing name" });
      expect(response.status).toBe(400);
      expect(response.body.code).toBe("VALIDATION_FAILED");
    });

    testAuthHeader(() => request.post(url));
  });

  describe("GET /api/projects/:id", () => {
    let projectId: number;

    beforeAll(async () => {
      const project = await createProject(testUser.id, {
        name: "Central Project 1",
      });
      projectId = project.id;
    });

    afterAll(async () => {
      await prisma.project.delete({ where: { id: projectId } });
    });

    it("should 200 and return the project if user owns it", async () => {
      const response = await request
        .get(`${url}/${projectId}`) // Centrale project eigendom van Test User
        .set("Authorization", authHeader);
      expect(response.status).toBe(200);
      expect(response.body.name).toBe("Central Project 1");
    });

    it("should 403 if user does not own the project", async () => {
      // Admin probeert project eigendom van Test User te bekijken
      const response = await request
        .get(`${url}/${projectId}`)
        .set("Authorization", adminAuthHeader);
      expect(response.status).toBe(403);
    });

    it("should 404 if project does not exist", async () => {
      const response = await request
        .get(`${url}/${generateTestId()}`)
        .set("Authorization", authHeader);
      expect(response.status).toBe(404);
    });

    it("should 400 with invalid id", async () => {
      const response = await request
        .get(`${url}/${projectId}`)
        .set("Authorization", authHeader);
      expect(response.status).toBe(400);
      expect(response.body.code).toBe("VALIDATION_FAILED");
    });

    testAuthHeader(() => request.get(`${url}/100`));
  });

  describe("PUT /api/projects/:id", () => {
    let projectId: number;

    beforeAll(async () => {
      const project = await createProject(testUser.id, {
        name: "Central Project 1",
      });
      projectId = project.id;
    });

    afterAll(async () => {
      await prisma.project.delete({ where: { id: projectId } }).catch(() => {});
    });

    it("should 200 and update project if user owns it", async () => {
      const response = await request
        .put(`${url}/${projectId}`)
        .set("Authorization", authHeader)
        .send({ name: "Updated Central Project 1" });

      expect(response.status).toBe(200);
      expect(response.body.name).toBe("Updated Central Project 1");
    });

    it("should 403 if another user tries to update the project", async () => {
      const otherUserEmail = "outsider@example.com";
      // Maak een nieuwe gebruiker aan
      await prisma.user.create({
        data: {
          id: generateTestId(),
          username: "Outsider",
          email: otherUserEmail,
          passwordHash: await hashPassword("12345678"),
          role: "user",
        },
      });

      const otherAuth = await login(request);
      const response = await request
        .put(`${url}/${projectId}`)
        .set("Authorization", otherAuth)
        .send({ name: "Nope" });

      expect(response.status).toBe(403);

      // Opruimen
      await prisma.user.delete({ where: { email: otherUserEmail } });
    });

    it("should 404 if project does not exist", async () => {
      const response = await request
        .put(`${url}/${generateTestId()}`)
        .set("Authorization", authHeader)
        .send({ name: "NoProject" });
      expect(response.status).toBe(404);
    });

    it("should 400 if invalid fields", async () => {
      const response = await request
        .put(`${url}${projectId}`)
        .set("Authorization", authHeader)
        .send({ name: 12345 });
      expect(response.status).toBe(400);
      expect(response.body.code).toBe("VALIDATION_FAILED");
    });

    testAuthHeader(() => request.put(`${url}/100`));
  });

  describe("DELETE /api/projects/:id", () => {
    let tempProjectId: number | null = null;

    beforeAll(async () => {
      const project = await createProject(testUser.id, {
        name: "DeleteMeProject",
        description: null,
      });
      tempProjectId = project.id;
    });

    afterAll(async () => {
      if (tempProjectId) {
        await prisma.project
          .delete({ where: { id: tempProjectId } })
          .catch(() => {});
      }
    });

    it("should 204 if owner deletes project", async () => {
      const response = await request
        .delete(`${url}/${tempProjectId}`)
        .set("Authorization", authHeader);
      expect(response.status).toBe(204);
    });

    it("should 403 if another user tries to delete project", async () => {
      const project = await createProject(testUser.id, {
        name: "NonDeletable",
        description: null,
      });

      const otherUserEmail = "nonowner@example.com";
      await prisma.user.create({
        data: {
          id: generateTestId(),
          username: "NonOwner",
          email: otherUserEmail,
          passwordHash: await hashPassword("12345678"),
          role: "user",
        },
      });

      const otherAuth = await login(request);

      const response = await request
        .delete(`${url}/${project.id}`)
        .set("Authorization", otherAuth);
      expect(response.status).toBe(403);

      // Opruimen
      await prisma.project.delete({ where: { id: project.id } });
      await prisma.user.delete({ where: { email: otherUserEmail } });
    });

    it("should 404 if project does not exist", async () => {
      const response = await request
        .delete(`${url}/${generateTestId()}`)
        .set("Authorization", authHeader);
      expect(response.status).toBe(404);
    });

    testAuthHeader(() => request.delete(`${url}/${tempProjectId}`));
  });
});
