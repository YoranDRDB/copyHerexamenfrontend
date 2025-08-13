import type { Next } from "koa";
import Router from "@koa/router";
import Joi from "joi";
import * as userService from "../service/user";
import type { TaakBeheerContext, TaakBeheerState } from "../types/koa";
import type { KoaContext, KoaRouter } from "../types/koa";
import type {
  RegisterUserRequest,
  GetAllUsersResponse,
  GetUserByIdResponse,
  UpdateUserRequest,
  UpdateUserResponse,
  LoginResponse,
  GetUserRequest,
} from "../types/user";
import type { IdParams } from "../types/common";
import validate from "../core/validation";
import {
  requireAuthentication,
  makeRequireRole,
  authDelay,
} from "../core/auth";
import Role from "../core/roles";

/**
 * Middleware to check user permissions for accessing specific user data.
 *
 * - Allows access to "me" for the logged-in user.
 * - Allows admins to access any user.
 * - Restricts other access.
 */
const checkUserId = (ctx: KoaContext<unknown, GetUserRequest>, next: Next) => {
  const { userId, role } = ctx.state.session;
  const { id } = ctx.params;

  if (id === "ik") {
    return next();
  }

  const requestedId = Number(id);
  if (isNaN(requestedId)) {
    return ctx.throw(400, "Invalid user id", { code: "BAD_REQUEST" });
  }

  if (requestedId !== userId && role !== Role.ADMIN) {
    return ctx.throw(
      403,
      "You are not allowed to view this user's information",
      {
        code: "FORBIDDEN",
      }
    );
  }

  return next();
};

/**
 * @api {get} /users Retrieve all users
 * @apiName GetAllUsers
 * @apiGroup Users
 *
 * @apiHeader {String} Authorization Bearer token.
 * @apiPermission Admin
 *
 * @apiSuccess {Object[]} items List of all users.
 * @apiSuccess {Number} items.id User ID.
 * @apiSuccess {String} items.name User name.
 * @apiSuccess {String} items.email User email.
 *
 * @apiError {String} code Error code.
 * @apiError {String} message Error message.
 */
const getAllUsers = async (ctx: KoaContext<GetAllUsersResponse>) => {
  const users = await userService.getAll();
  ctx.body = { items: users };
};
getAllUsers.validationScheme = null;

/**
 * @api {post} /users Register a new user
 * @apiName RegisterUser
 * @apiGroup Users
 *
 * @apiParamExample {json} Request-Body:
 *     {
 *       "name": "John Doe",
 *       "email": "john.doe@example.com",
 *       "password": "securepassword123"
 *     }
 *
 * @apiParam {String} name Name of the user.
 * @apiParam {String} email Email of the user.
 * @apiParam {String} password Password for the user.
 *
 * @apiSuccess {String} token Authentication token for the newly registered user.
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 201 Created
 *     {
 *       "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
 *     }
 *
 * @apiError {String} code Error code.
 * @apiError {String} message Error message.
 *
 * @apiErrorExample {json} Error-Response:
 *     HTTP/1.1 400 Bad Request
 *     {
 *       "code": "VALIDATION_FAILED",
 *       "message": "Email is required and must be a valid email address."
 *     }
 */
const registerUser = async (
  ctx: KoaContext<LoginResponse, void, RegisterUserRequest>
) => {
  const token = await userService.register(ctx.request.body);
  ctx.status = 200;
  ctx.body = { token };
};
registerUser.validationScheme = {
  body: {
    username: Joi.string().max(255),
    email: Joi.string().email(),
    password: Joi.string().min(12).max(128),
  },
};

/**
 * @api {get} /users/:id Retrieve a user by ID
 * @apiName GetUserById
 * @apiGroup Users
 *
 * @apiHeader {String} Authorization Bearer token.
 *
 * @apiParam {String} id User ID or "ik" for the logged-in user.
 *
 * @apiSuccess {Number} id ID of the user.
 * @apiSuccess {String} name Name of the user.
 * @apiSuccess {String} email Email of the user.
 *
 * @apiError {String} code Error code.
 * @apiError {String} message Error message.
 */
const getUserById = async (
  ctx: KoaContext<GetUserByIdResponse, GetUserRequest>
) => {
  const userIdToFetch =
    ctx.params.id === "ik" ? ctx.state.session.userId : Number(ctx.params.id);
  const user = await userService.getById(userIdToFetch);
  ctx.status = 200;
  ctx.body = user;
};
getUserById.validationScheme = {
  params: {
    id: Joi.alternatives().try(
      Joi.number().integer().positive(),
      Joi.string().valid("me")
    ),
  },
};

/**
 * @api {put} /users/:id Update a user's information
 * @apiName UpdateUserById
 * @apiGroup Users
 *
 * @apiHeader {String} Authorization Bearer token.
 *
 * @apiParam {Number} id ID of the user.
 * @apiParam {String} [username] New username for the user.
 * @apiParam {String} [email] New email for the user.
 * @apiParam {String} [password] New password for the user.
 *
 * @apiSuccess {Number} id ID of the updated user.
 * @apiSuccess {String} name Updated name of the user.
 * @apiSuccess {String} email Updated email of the user.
 *
 * @apiError {String} code Error code.
 * @apiError {String} message Error message.
 */
const updateUserById = async (
  ctx: KoaContext<UpdateUserResponse, IdParams, UpdateUserRequest>
) => {
  const user = await userService.updateById(ctx.params.id, ctx.request.body);
  ctx.status = 200;
  ctx.body = user;
};
updateUserById.validationScheme = {
  params: { id: Joi.number().integer().positive().required() },
  body: {
    username: Joi.string().max(255).optional(),
    email: Joi.string().email().optional(),
    password: Joi.string().min(12).max(128).optional(),
  },
};

/**
 * @api {delete} /users/:id Delete a user
 * @apiName DeleteUserById
 * @apiGroup Users
 *
 * @apiHeader {String} Authorization Bearer token.
 *
 * @apiParam {Number} id ID of the user.
 *
 * @apiSuccessExample {json} Success Response:
 *     HTTP/1.1 204 No Content
 *
 * @apiError {String} code Error code.
 * @apiError {String} message Error message.
 */
const deleteUserById = async (ctx: KoaContext<void, IdParams>) => {
  await userService.deleteById(ctx.params.id);
  ctx.status = 204;
};
deleteUserById.validationScheme = {
  params: {
    id: Joi.number().integer().positive().required(),
  },
};

/**
 * Registers all user-related routes on the given parent router.
 *
 * @param {KoaRouter} parent The parent router to register the routes on.
 */
export default (parent: KoaRouter) => {
  const router = new Router<TaakBeheerState, TaakBeheerContext>({
    prefix: "/users",
  });

  // Registration endpoint (no authentication required)
  router.post(
    "/",
    authDelay,
    validate(registerUser.validationScheme),
    registerUser
  );

  // Admin-only endpoint to retrieve all users
  const requireAdmin = makeRequireRole(Role.ADMIN);
  router.get(
    "/",
    requireAuthentication,
    requireAdmin,
    validate(getAllUsers.validationScheme),
    getAllUsers
  );

  // Routes for retrieving, updating, or deleting a user by ID
  router.get(
    "/:id",
    requireAuthentication,
    validate(getUserById.validationScheme),
    checkUserId,
    getUserById
  );
  router.put(
    "/:id",
    requireAuthentication,
    validate(updateUserById.validationScheme),
    checkUserId,
    updateUserById
  );
  router.delete(
    "/:id",
    requireAuthentication,
    validate(deleteUserById.validationScheme),
    checkUserId,
    deleteUserById
  );

  parent.use(router.routes()).use(router.allowedMethods());
};
