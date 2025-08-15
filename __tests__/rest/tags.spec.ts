// __tests__/rest/tags.spec.ts
import type supertest from "supertest";
import { prisma } from "../../src/data";
import withServer from "../helpers/withServer";
import { login, loginAdmin } from "../helpers/login";
import testAuthHeader from "../helpers/testAuthHeader";

describe("Tags", () => {
  let request: supertest.Agent;
  let authHeader: string;
  let adminAuthHeader: string;

  // Start de server en initialiseer supertest
  withServer((r) => (request = r));

  beforeAll(async () => {
    // Log in als gewone gebruiker en admin gebruiker
    authHeader = await login(request);
    adminAuthHeader = await loginAdmin(request);
    // Seed de tags eenmaal voor alle tests
    await prisma.tag.createMany({
      data: [
        { id: 800, name: "frontend" },
        { id: 801, name: "backend" },
      ],
    });
  });
  afterAll(async () => {
    // Ruim de gezaaide tags op
    await prisma.tag.deleteMany({
      where: { id: { in: [800, 801, 802] } },
    });
  });

  const url = "/api/tags";
  describe("GET /api/tags", () => {
    it("should 200 and return all tags for the signed in user", async () => {
      const response = await request.get(url).set("Authorization", authHeader);
      expect(response.status).toBe(200);

      // Verifieer dat minstens de gezaaide tags aanwezig zijn
      expect(response.body.items.length).toBeGreaterThanOrEqual(2);
      expect(response.body.items).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: 800, name: "frontend" }),
          expect.objectContaining({ id: 801, name: "backend" }),
        ])
      );
    });

    it("should 200 and return all tags for the admin user", async () => {
      const response = await request
        .get(url)
        .set("Authorization", adminAuthHeader);
      expect(response.status).toBe(200);

      // Verifieer dat minstens de gezaaide tags aanwezig zijn
      expect(response.body.items.length).toBeGreaterThanOrEqual(2);
      expect(response.body.items).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: 800, name: "frontend" }),
          expect.objectContaining({ id: 801, name: "backend" }),
        ])
      );
    });

    it("should 400 when given an invalid query parameter", async () => {
      const response = await request
        .get(`${url}?invalid=true`)
        .set("Authorization", authHeader);
      expect(response.status).toBe(400);
      expect(response.body.code).toBe("VALIDATION_FAILED");
      expect(response.body.details.query).toHaveProperty("invalid");
    });

    // Test voor verzoeken zonder authenticatie
    testAuthHeader(() => request.get(url));
  });

  describe("GET /api/tags/:id", () => {
    it("should 200 and return the requested tag", async () => {
      const response = await request
        .get(`${url}/800`)
        .set("Authorization", authHeader);
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({
        id: 800,
        name: "frontend",
      });
    });

    it("should 404 when requesting a non-existing tag", async () => {
      const response = await request
        .get(`${url}/9999`)
        .set("Authorization", authHeader);
      expect(response.statusCode).toBe(404);
      expect(response.body).toMatchObject({
        code: "NOT_FOUND",
        message: "No tag with this id exists",
      });
      expect(response.body.stack).toBeTruthy();
    });

    it("should 400 with invalid tag id", async () => {
      const response = await request
        .get(`${url}/invalid`)
        .set("Authorization", authHeader);
      expect(response.statusCode).toBe(400);
      expect(response.body.code).toBe("VALIDATION_FAILED");
      expect(response.body.details.params).toHaveProperty("id");
    });

    // Test voor verzoeken zonder authenticatie
    testAuthHeader(() => request.get(`${url}/800`));
  });

  describe("POST /api/tags", () => {
    const tagsToDelete: number[] = [];

    beforeAll(async () => {
      // Geen extra setup nodig
    });

    afterAll(async () => {
      if (tagsToDelete.length > 0) {
        await prisma.tag.deleteMany({
          where: { id: { in: tagsToDelete } },
        });
      }
    });

    it("should 201 create a new tag", async () => {
      const response = await request
        .post(url)
        .send({ name: "urgent" })
        .set("Authorization", authHeader);

      expect(response.status).toBe(201);
      expect(response.body.id).toBeTruthy();
      expect(response.body.name).toBe("urgent");
      tagsToDelete.push(response.body.id);
    });

    it("should 400 when missing name", async () => {
      const response = await request
        .post(url)
        .send({})
        .set("Authorization", authHeader);
      expect(response.status).toBe(400);
      expect(response.body.code).toBe("VALIDATION_FAILED");
      expect(response.body.message).toBe("Name is required");
    });

    // Test voor verzoeken zonder authenticatie
    testAuthHeader(() => request.post(url));
  });

  describe("PUT /api/tags/:id", () => {
    it("should 200 and update the tag", async () => {
      const response = await request
        .put(`${url}/800`)
        .send({ name: "ui/ux" })
        .set("Authorization", authHeader);

      expect(response.status).toBe(200);
      expect(response.body.name).toBe("ui/ux");
    });
    it("should 400 when creating a tag with an existing name", async () => {
      const response = await request
        .post(url)
        .send({ name: "urgent" })
        .set("Authorization", authHeader);

      expect(response.status).toBe(400);
      expect(response.body.code).toBe("VALIDATION_FAILED");
      expect(response.body.message).toBe("A tag with this name already exists");
    });

    it("should 404 when updating a non-existing tag", async () => {
      const response = await request
        .put(`${url}/9999`)
        .send({ name: "nonexistent" })
        .set("Authorization", authHeader);

      expect(response.status).toBe(404);
      expect(response.body.code).toBe("NOT_FOUND");
      expect(response.body.message).toBe("No tag with this id exists");
    });

    it("should 400 when providing invalid fields", async () => {
      const response = await request
        .put(`${url}/800`)
        .send({ name: 12345 }) // Ongeldig type voor naam
        .set("Authorization", authHeader);

      expect(response.status).toBe(400);
      expect(response.body.code).toBe("VALIDATION_FAILED");
      expect(response.body.message).toBe("Name must be a string");
    });

    // Test voor verzoeken zonder authenticatie
    testAuthHeader(() => request.put(`${url}/800`));
  });

  describe("DELETE /api/tags/:id", () => {
    let tempTagId: number | null = null;

    beforeAll(async () => {
      const newTag = await prisma.tag.create({
        data: { name: "removeThis" },
      });
      tempTagId = newTag.id;
    });

    afterAll(async () => {
      if (tempTagId) {
        await prisma.tag.delete({ where: { id: tempTagId } }).catch(() => {});
      }
    });

    it("should 204 if tag deleted", async () => {
      const response = await request
        .delete(`${url}/${tempTagId}`)
        .set("Authorization", authHeader);
      expect(response.status).toBe(204);
    });

    it("should 404 if no such tag", async () => {
      const response = await request
        .delete(`${url}/9999`)
        .set("Authorization", authHeader);
      expect(response.status).toBe(404);
      expect(response.body.code).toBe("NOT_FOUND");
      expect(response.body.message).toBe("No tag with this id exists");
    });

    it("should 400 invalid id", async () => {
      const response = await request
        .delete(`${url}/invalid`)
        .set("Authorization", authHeader);
      expect(response.status).toBe(400);
      expect(response.body.code).toBe("VALIDATION_FAILED");
      expect(response.body.message).toBe("Invalid tag id");
    });

    // Test voor verzoeken zonder authenticatie
    testAuthHeader(() => request.delete(`${url}/800`));
  });
});
