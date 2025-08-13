import supertest from "supertest";
import type { Server } from "../../src/createServer";
import createServer from "../../src/createServer";
import { prisma } from "../../src/data";
import { hashPassword } from "../../src/core/password";
import Role from "../../src/core/roles";

export default function withServer(setter: (s: supertest.Agent) => void): void {
  let server: Server;

  beforeAll(async () => {
    server = await createServer();
    const passwordHash = await hashPassword("12345678");
    await prisma.user.createMany({
      data: [
        {
          id: 1,
          username: "Test User",
          email: "test.user@hogent.be",
          passwordhash: passwordHash,
          role: JSON.stringify([Role.USER]),
        },
        {
          id: 2,
          username: "Admin User",
          email: "admin.user@hogent.be",
          passwordhash: passwordHash,
          role: JSON.stringify([Role.ADMIN]),
        },
      ],
    });

    setter(supertest(server.getApp().callback()));
  });

  afterAll(async () => {
    await prisma.project.deleteMany();
    await prisma.user.deleteMany();
    await prisma.tag.deleteMany();
    await prisma.task.deleteMany();

    await server.stop();
  });
}
