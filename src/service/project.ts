import { prisma } from "../data";
import ServiceError from "../core/serviceError";
import type {
  Project,
  CreateProjectRequest,
  UpdateProjectRequest,
} from "../types/project";
import Role from "../core/roles";

/**
 * Haal alle projecten op waar de gebruiker toegang toe heeft.
 * Aanname: Een gebruiker heeft toegang tot een project als hij owner is
 * of je kunt logic toevoegen als je dat wilt.
 */
export async function getAllForUser(userId: number): Promise<Project[]> {
  const projects = await prisma.project.findMany({
    where: {
      owner_id: userId,
    },
  });
  return projects;
}

/**
 * Maak een nieuw project aan voor een specifieke owner (userId).
 */
export async function create(
  userId: number,
  data: CreateProjectRequest
): Promise<Project> {
  const project = await prisma.project.create({
    data: {
      owner_id: userId,
      name: data.name,
      description: data.description?.trim() || null,
    },
  });
  return project;
}

/**
 * Haal een project op dat door de user toegankelijk is.
 * Als user geen toegang heeft, geef een 403 terug.
 */
export async function getByIdForUser(
  projectId: number,
  userId: number
): Promise<Project> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (!project) {
    throw ServiceError.notFound("No project with this id exists");
  }

  if (project.owner_id !== userId) {
    throw ServiceError.forbidden("You do not have access to this project");
  }

  return project;
}

/**
 * Update een project als de user de eigenaar is (of als admin?)
 * Indien je admins wilt laten updaten, check de role.
 */
export async function updateById(
  projectId: number,
  userId: number,
  role: string,
  changes: UpdateProjectRequest
): Promise<Project> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (!project) {
    throw ServiceError.notFound("No project with this id exists");
  }

  // Als je wilt dat alleen de eigenaar OF een admin mag updaten:
  if (project.owner_id !== userId && role !== Role.ADMIN) {
    throw ServiceError.forbidden(
      "You do not have permission to update this project"
    );
  }

  const updated = await prisma.project.update({
    where: { id: projectId },
    data: {
      ...changes,
      ...(changes.description !== undefined && {
        description: changes.description.trim() || null,
      }),
    },
  });

  return updated;
}

/**
 * Verwijder een project als de user de eigenaar of admin is.
 */
export async function deleteById(
  projectId: number,
  userId: number,
  role: string
): Promise<void> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (!project) {
    throw ServiceError.notFound("No project with this id exists");
  }

  if (project.owner_id !== userId && role !== Role.ADMIN) {
    throw ServiceError.forbidden(
      "You do not have permission to delete this project"
    );
  }

  await prisma.project.delete({ where: { id: projectId } });
}
