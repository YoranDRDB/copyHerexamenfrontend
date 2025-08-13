import { Entity, ListResponse } from "./common";

export interface Task extends Entity {
  id: number;
  project_id: number;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  due_date: Date | null; // indien DB null kan teruggeven
}

export interface CreateTaskInput {
  project_id: number;
  title: string;
  description?: string; // user kan dit weglaten, dan null in DB
  status?: string; // default 'open' als niet meegegeven
  priority?: string; // default 'medium' als niet meegegeven
  due_date?: string; // user kan dit weglaten, dan null in DB
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  status?: string;
  priority?: string;
  due_date?: string;
}

export interface CreateTaskResponse extends Task {}

export interface GetAllTasksResponse extends ListResponse<Task> {}

export interface GetTaskByIdResponse extends Task {}

export interface UpdateTaskResponse extends Task {}
