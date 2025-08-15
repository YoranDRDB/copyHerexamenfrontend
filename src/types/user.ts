import type { Entity, ListResponse } from "./common";

export interface User extends Entity {
  username: string;
  email: string;
  passwordHash: string;
  role: string;
}

export interface UserCreateInput {
  username: string;
  email: string;
  password: string;
}

export interface PublicUser extends Pick<User, "id" | "username" | "email"> {}

export interface UserUpdateInput {
  username?: string;
  email?: string;
  password?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface GetUserRequest {
  id: number | "ik";
}

export interface RegisterUserRequest {
  username: string;
  email: string;
  password: string;
}

export interface UpdateUserRequest {
  username?: string;
  email?: string;
  password?: string;
}

// Responses
export interface GetAllUsersResponse extends ListResponse<PublicUser> {}
export interface GetUserByIdResponse extends PublicUser {}
export interface UpdateUserResponse extends PublicUser {}
export interface LoginResponse {
  token: string;
}
