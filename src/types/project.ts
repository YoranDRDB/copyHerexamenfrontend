import type { Entity, ListResponse } from "./common";

export interface Project extends Entity {
  id: number;
  owner_id: number;
  name: string;
  description: string | null;
}

export interface CreateProjectRequest {
  name: string;
  description: string | null;
}

export interface CreateProjectResponse extends Project {}
export interface GetAllProjectsResponse extends ListResponse<Project> {}
export interface GetProjectByIdResponse extends Project {}
export interface UpdateProjectRequest {
  name?: string;
  description?: string;
}
export interface UpdateProjectResponse extends Project {}
