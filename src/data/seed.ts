import { PrismaClient } from "@prisma/client";
import { getLogger } from "../core/logging";
import { hashPassword } from "../core/password";
const logger = getLogger();
const prisma = new PrismaClient();

async function main() {
  // Seed Users
  try {
    // Cleanup existing data before seeding
    await prisma.$transaction([
      prisma.taskTag.deleteMany(),
      prisma.taskAssignee.deleteMany(),
      prisma.task.deleteMany(),
      prisma.tag.deleteMany(),
      prisma.project.deleteMany(),
      prisma.user.deleteMany(),
    ]);

    const passwordHash = await hashPassword("12345678");
    await prisma.user.createMany({
      data: [
        {
          username: "testuser1",
          email: "test1@example.com",
          passwordHash,
          role: "user",
        },
        {
          username: "testuser2",
          email: "test2@example.com",
          passwordHash,
          role: "user",
        },
        {
          username: "adminuser",
          email: "admin@example.com",
          passwordHash,
          role: "admin",
        },
      ],
      // createMany geeft geen terug array van objecten zoals create zou doen
      // We halen later id's op via findMany
    });

    // Haal de users nog eens op om hun ID te hebben
    const users = await prisma.user.findMany();
    const u1 = users.find((u) => u.username === "testuser1");
    const u2 = users.find((u) => u.username === "testuser2");
    const u3 = users.find((u) => u.username === "adminuser");
    if (!u1 || !u2 || !u3) {
      throw new Error(
        "Required seed users (testuser1, testuser2, adminuser) not found"
      );
    }
    // Seed Projects
    // User1 bezit 2 projecten, user2 1 project
    const projectA = await prisma.project.create({
      data: {
        owner_id: u1.id,
        name: "Website Redesign",
        description: "Redesign the company website",
      },
    });

    const projectB = await prisma.project.create({
      data: {
        owner_id: u1.id,
        name: "Mobile App Development",
        description: "Create a new mobile app",
      },
    });

    const projectC = await prisma.project.create({
      data: {
        owner_id: u2.id,
        name: "Marketing Campaign",
        description: "Launch a new marketing campaign",
      },
    });

    // Seed Tasks
    // ==========
    // Een paar taken voor project A en B
    const task1 = await prisma.task.create({
      data: {
        project_id: projectA.id,
        title: "Design new homepage",
        description: "Create a modern and responsive homepage layout",
        status: "open",
        priority: "high",
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    const task2 = await prisma.task.create({
      data: {
        project_id: projectA.id,
        title: "Implement homepage",
        description: "Convert design into HTML/CSS/JS",
        status: "open",
        priority: "medium",
      },
    });

    const task3 = await prisma.task.create({
      data: {
        project_id: projectB.id,
        title: "API Integration",
        description: "Integrate mobile app with backend API",
        status: "in_progress",
        priority: "high",
        due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      },
    });

    // Een taak voor project C
    const task4 = await prisma.task.create({
      data: {
        project_id: projectC.id,
        title: "Social Media Ads",
        description: "Prepare and schedule social media advertisements",
        status: "open",
        priority: "low",
      },
    });

    // Seed Tags
    // =========
    const frontendTag = await prisma.tag.create({ data: { name: "frontend" } });
    const backendTag = await prisma.tag.create({ data: { name: "backend" } });
    const urgentTag = await prisma.tag.create({ data: { name: "urgent" } });

    // Seed TaskAssignees
    // ==================
    // Wijs user1 en user3 toe aan task1
    await prisma.taskAssignee.createMany({
      data: [
        { task_id: task1.id, user_id: u1.id },
        { task_id: task1.id, user_id: u3.id },
        { task_id: task3.id, user_id: u1.id },
        { task_id: task2.id, user_id: u2.id },
        { task_id: task4.id, user_id: u3.id },
      ],
    });

    // Wijs user2 toe aan task3
    await prisma.taskAssignee.create({
      data: { task_id: task3.id, user_id: u2.id },
    });

    // Seed TaskTags
    // =============
    // task1 is urgent en frontend
    await prisma.taskTag.createMany({
      data: [
        { task_id: task1.id, tag_id: urgentTag.id },
        { task_id: task1.id, tag_id: frontendTag.id },
      ],
    });

    // task3 is backend
    await prisma.taskTag.create({
      data: { task_id: task3.id, tag_id: backendTag.id },
    });

    logger.info("Seeding completed!");
  } catch (error) {
    logger.error("Error occurred during database seeding:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(() => process.exit(1));
