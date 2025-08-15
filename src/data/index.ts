// src/data/index.ts
import { PrismaClient } from "@prisma/client";
import { getLogger } from "../core/logging";

export const prisma = new PrismaClient();

export async function initializeData(): Promise<void> {
  const logger = getLogger();
  logger.info("Initializing connection to the database");
  try {
    await prisma.$connect();
    logger.info("Successfully connected to the database");
  } catch (error) {
    logger.error("Failed to connect to the database", { error });
    throw error;
  }
}

export async function shutdownData(): Promise<void> {
  const logger = getLogger();
  logger.info("Shutting down database connection");
  try {
    await prisma.$disconnect();
    logger.info("Database connection closed");
  } catch (error) {
    logger.error("Failed to disconnect from the database", { error });
    throw error;
  }
}
