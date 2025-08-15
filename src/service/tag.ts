import { prisma } from "../data";
import ServiceError from "../core/serviceError";
import type { Tag, CreateTagRequest, UpdateTagRequest } from "../types/tag";

export async function getAll(): Promise<Tag[]> {
  return prisma.tag.findMany();
}

export async function create(data: CreateTagRequest): Promise<Tag> {
  const existing = await prisma.tag.findFirst({ where: { name: data.name } });
  if (existing) {
    throw ServiceError.validationFailed("A tag with this name already exists");
  }

  return prisma.tag.create({
    data: {
      name: data.name,
    },
  });
}

export async function getById(id: number): Promise<Tag> {
  const tag = await prisma.tag.findUnique({ where: { id } });
  if (!tag) {
    throw ServiceError.notFound("No tag with this id exists");
  }
  return tag;
}

export async function updateById(
  id: number,
  changes: UpdateTagRequest
): Promise<Tag> {
  // Check existence
  const tag = await prisma.tag.findUnique({ where: { id } });
  if (!tag) {
    throw ServiceError.notFound("No tag with this id exists");
  }

  const updated = await prisma.tag.update({
    where: { id },
    data: {
      ...changes,
    },
  });
  return updated;
}

export async function deleteById(id: number): Promise<void> {
  // Check existence
  const tag = await prisma.tag.findUnique({ where: { id } });
  if (!tag) {
    throw ServiceError.notFound("No tag with this id exists");
  }

  await prisma.tag.delete({ where: { id } });
}
