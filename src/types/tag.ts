import type { Entity, ListResponse } from "./common";

export interface Tag extends Entity {
  id: number;
  name: string;
}

export interface CreateTagRequest {
  name: string;
}

export interface CreateTagResponse extends Tag {}

export interface GetAllTagsResponse extends ListResponse<Tag> {}

export interface GetTagByIdResponse extends Tag {}

export interface UpdateTagRequest {
  name?: string;
}

export interface UpdateTagResponse extends Tag {}
