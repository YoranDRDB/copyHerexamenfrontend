import { prisma } from "../../src/data";
import { generateTestId } from "./testIds";

export const createProject = async (
  ownerId: number,
  data: Partial<{ name: string; description: string | null }> = {}
) => {
  return prisma.project.create({
    data: {
      id: generateTestId(),
      owner_id: ownerId,
      name: data.name ?? `Test Project ${Date.now()}`,
      description: data.description ?? null,
      ...data,
    },
  });
};
