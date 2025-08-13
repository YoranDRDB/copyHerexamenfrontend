import type supertest from "supertest";
import { prisma } from "../../src/data";
import withServer from "../helpers/withServer";
import { login } from "../helpers/login";
import testAuthHeader from "../helpers/testAuthHeader";

const data = {
  projects: [
    {
      id: 1,
      owner_id: 1,
      name: "Project Alpha",
      description: "Test project description",
    },
  ],
  tasks: [
    {
      id: 1,
      project_id: 1,
      title: "Task 1",
      description: "First task",
      status: "open",
      priority: "medium",
      due_date: new Date(2023, 10, 15),
    },
    {
      id: 2,
      project_id: 1,
      title: "Task 2",
      description: "Second task",
      status: "in_progress",
      priority: "high",
      due_date: new Date(2023, 11, 1),
    },
  ],
};

const dataToDelete = {
  projects: [1],
  tasks: [1, 2],
};

describe("Tasks", () => {
  let request: supertest.Agent;
  let authHeader: string;

  withServer((r) => (request = r));

  beforeAll(async () => {
    authHeader = await login(request);
  });

  const url = "/api/tasks";

  describe("GET /api/tasks", () => {
    beforeAll(async () => {
      await prisma.project.createMany({ data: data.projects });
      await prisma.task.createMany({ data: data.tasks });
    });

    afterAll(async () => {
      await prisma.task.deleteMany({
        where: { id: { in: dataToDelete.tasks } },
      });
      await prisma.project.deleteMany({
        where: { id: { in: dataToDelete.projects } },
      });
    });

    it("should 200 and return all tasks", async () => {
      const response = await request.get(url).set("Authorization", authHeader);

      expect(response.statusCode).toBe(200);
      expect(response.body.items.length).toBe(2);
      expect(response.body.items).toEqual(
        expect.arrayContaining([
          {
            id: 1,
            title: "Task 1",
            description: "First task",
            status: "open",
            priority: "medium",
            due_date: "2023-11-15T00:00:00.000Z",
            project_id: 1,
          },
          {
            id: 2,
            title: "Task 2",
            description: "Second task",
            status: "in_progress",
            priority: "high",
            due_date: "2023-12-01T00:00:00.000Z",
            project_id: 1,
          },
        ])
      );
    });

    testAuthHeader(() => request.get(url));
  });

  describe("GET /api/tasks/:id", () => {
    beforeAll(async () => {
      await prisma.project.createMany({ data: data.projects });
      await prisma.task.createMany({ data: data.tasks });
    });

    afterAll(async () => {
      await prisma.task.deleteMany({
        where: { id: { in: dataToDelete.tasks } },
      });
      await prisma.project.deleteMany({
        where: { id: { in: dataToDelete.projects } },
      });
    });

    it("should 200 and return the requested task", async () => {
      const response = await request
        .get(`${url}/1`)
        .set("Authorization", authHeader);

      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({
        id: 1,
        title: "Task 1",
        description: "First task",
        status: "open",
        priority: "medium",
        due_date: "2023-11-15T00:00:00.000Z",
        project_id: 1,
      });
    });

    it("should 404 when task does not exist", async () => {
      const response = await request
        .get(`${url}/999`)
        .set("Authorization", authHeader);

      expect(response.statusCode).toBe(404);
      expect(response.body).toMatchObject({
        code: "NOT_FOUND",
        message: "No task with this id exists",
      });
    });

    testAuthHeader(() => request.get(`${url}/1`));
  });

  describe("POST /api/tasks", () => {
    afterAll(async () => {
      await prisma.task.deleteMany({
        where: { id: { in: dataToDelete.tasks } },
      });
    });

    it("should 201 and create a new task", async () => {
      const response = await request
        .post(url)
        .send({
          project_id: 1,
          title: "New Task",
          description: "A new task",
          status: "open",
          priority: "medium",
          due_date: "2023-12-20",
        })
        .set("Authorization", authHeader);

      expect(response.statusCode).toBe(201);
      expect(response.body).toMatchObject({
        title: "New Task",
        description: "A new task",
        status: "open",
        priority: "medium",
        due_date: "2023-12-20T00:00:00.000Z",
        project_id: 1,
      });

      dataToDelete.tasks.push(response.body.id);
    });

    it("should 400 for missing required fields", async () => {
      const response = await request
        .post(url)
        .send({})
        .set("Authorization", authHeader);

      expect(response.statusCode).toBe(400);
      expect(response.body.code).toBe("VALIDATION_FAILED");
    });

    testAuthHeader(() => request.post(url));
  });

  describe("PUT /api/tasks/:id", () => {
    beforeAll(async () => {
      await prisma.project.createMany({ data: data.projects });
      await prisma.task.createMany({ data: data.tasks });
    });

    afterAll(async () => {
      await prisma.task.deleteMany({
        where: { id: { in: dataToDelete.tasks } },
      });
      await prisma.project.deleteMany({
        where: { id: { in: dataToDelete.projects } },
      });
    });

    it("should 200 and update the task", async () => {
      const response = await request
        .put(`${url}/1`)
        .send({
          title: "Updated Task",
          status: "done",
        })
        .set("Authorization", authHeader);

      expect(response.statusCode).toBe(200);
      expect(response.body).toMatchObject({
        id: 1,
        title: "Updated Task",
        status: "done",
        priority: "medium",
        project_id: 1,
      });
    });

    it("should 404 when task does not exist", async () => {
      const response = await request
        .put(`${url}/999`)
        .send({ title: "Does Not Exist" })
        .set("Authorization", authHeader);

      expect(response.statusCode).toBe(404);
      expect(response.body).toMatchObject({
        code: "NOT_FOUND",
        message: "No task with this id exists",
      });
    });

    testAuthHeader(() => request.put(`${url}/1`));
  });

  describe("DELETE /api/tasks/:id", () => {
    beforeAll(async () => {
      await prisma.project.createMany({ data: data.projects });
      await prisma.task.createMany({ data: data.tasks });
    });

    afterAll(async () => {
      await prisma.task.deleteMany({
        where: { id: { in: dataToDelete.tasks } },
      });
      await prisma.project.deleteMany({
        where: { id: { in: dataToDelete.projects } },
      });
    });

    it("should 204 and delete the task", async () => {
      const response = await request
        .delete(`${url}/1`)
        .set("Authorization", authHeader);

      expect(response.statusCode).toBe(204);
    });

    it("should 404 when task does not exist", async () => {
      const response = await request
        .delete(`${url}/999`)
        .set("Authorization", authHeader);

      expect(response.statusCode).toBe(404);
      expect(response.body).toMatchObject({
        code: "NOT_FOUND",
        message: "No task with this id exists",
      });
    });

    testAuthHeader(() => request.delete(`${url}/1`));
  });
});
