import { prisma } from "../data";
import ServiceError from "../core/serviceError";
import type { Task, CreateTaskInput, UpdateTaskRequest } from "../types/task";
import Role from "../core/roles";

/**
 * Haal alle taken op die de user mag zien.
 * Bijvoorbeeld: alleen taken van projecten waarvan user owner is of assignee.
 * In dit voorbeeld checken we enkel of de gebruiker owner is van het project.
 */
export async function getAllForUser(
  userId: number,
  projectId?: number
): Promise<Task[]> {
  // Filter taken op basis van project_id als meegegeven.
  // Eerst halen we projecten op waar user owner van is.
  const userProjects = await prisma.project.findMany({
    where: { owner_id: userId },
    select: { id: true },
  });
  const allowedProjectIds = userProjects.map((p) => p.id);

  return prisma.task.findMany({
    where: {
      project_id: projectId ? projectId : { in: allowedProjectIds },
    },
  });
}

/**
 * Maak een nieuwe task aan als de user toegang heeft tot het project.
 */
export async function create(
  userId: number,
  data: CreateTaskInput
): Promise<Task> {
  // Check of user toegang heeft tot project
  const project = await prisma.project.findUnique({
    where: { id: data.project_id },
  });
  if (!project) {
    throw ServiceError.notFound("No project with this id exists");
  }
  if (project.owner_id !== userId) {
    throw ServiceError.forbidden("You do not have access to this project");
  }

  const newTask = await prisma.task.create({
    data: {
      project_id: data.project_id,
      title: data.title,
      description: data.description ?? null,
      status: data.status ?? "open",
      priority: data.priority ?? "medium",
      due_date: data.due_date ?? null,
    },
  });
  return newTask;
}

/**
 * Haal een specifieke task op als de user er toegang toe heeft.
 */
export async function getByIdForUser(
  taskId: number,
  userId: number
): Promise<Task> {
  const task = await prisma.task.findUnique({ where: { id: taskId } });

  if (!task) {
    throw ServiceError.notFound("No task with this id exists");
  }

  // Check project eigenaarschap
  const project = await prisma.project.findUnique({
    where: { id: task.project_id },
  });
  if (!project || project.owner_id !== userId) {
    throw ServiceError.forbidden("You do not have access to this task");
  }

  return task;
}

/**
 * Update een task als de user toegang heeft (eigenaar van het project of admin).
 */
export async function updateById(
  taskId: number,
  userId: number,
  role: string,
  changes: UpdateTaskRequest
): Promise<Task> {
  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task) {
    throw ServiceError.notFound("No task with this id exists");
  }

  const project = await prisma.project.findUnique({
    where: { id: task.project_id },
  });
  if (!project) {
    throw ServiceError.notFound("Project not found");
  }

  if (project.owner_id !== userId && role !== Role.ADMIN) {
    throw ServiceError.forbidden(
      "You do not have permission to update this task"
    );
  }

  const updated = await prisma.task.update({
    where: { id: taskId },
    data: {
      ...changes,
      description: changes.description ?? null,
      due_date: changes.due_date ?? null,
    },
  });

  return updated;
}

/**
 * Verwijder een task als de user toegang heeft (eigenaar van project of admin).
 */
export async function deleteById(
  taskId: number,
  userId: number,
  role: string
): Promise<void> {
  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task) {
    throw ServiceError.notFound("No task with this id exists");
  }

  const project = await prisma.project.findUnique({
    where: { id: task.project_id },
  });
  if (!project) {
    throw ServiceError.notFound("Project not found");
  }

  if (project.owner_id !== userId && role !== Role.ADMIN) {
    throw ServiceError.forbidden(
      "You do not have permission to delete this task"
    );
  }

  await prisma.task.delete({ where: { id: taskId } });
}
