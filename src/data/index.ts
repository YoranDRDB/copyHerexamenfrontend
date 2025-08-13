// src/data/index.ts
import { PrismaClient } from "@prisma/client";
import { getLogger } from "../core/logging";

export const prisma = new PrismaClient();

export async function initializeData(): Promise<void> {
  const logger = getLogger();
  logger.info("Initializing connection to the database");

  await prisma.$connect();

  logger.info("Successfully connected to the database");
}

export async function shutdownData(): Promise<void> {
  const logger = getLogger();
  logger.info("Shutting down database connection");

  await prisma.$disconnect();

  logger.info("Database connection closed");
}
