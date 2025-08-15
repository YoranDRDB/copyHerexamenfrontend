import type { Next } from "koa";
import config from "config";
import type { KoaContext } from "../types/koa";
import * as userService from "../service/user";
import ServiceError from "./serviceError";

const AUTH_MAX_DELAY = config.get<number>("auth.maxDelay");

export const requireAuthentication = async (ctx: KoaContext, next: Next) => {
  const { authorization } = ctx.headers;
  if (!authorization) {
    throw ServiceError.unauthorized("You need to be signed in");
  }
  ctx.state.session = await userService.checkAndParseSession(authorization);

  return next();
};
export const makeRequireRole =
  (requiredRole: string) => async (ctx: KoaContext, next: Next) => {
    const { role } = ctx.state.session;

    userService.checkRole(requiredRole, role);

    return next();
  };

export const authDelay = async (_: KoaContext, next: Next) => {
  await new Promise((resolve) => {
    const delay = Math.round(Math.random() * AUTH_MAX_DELAY);
    setTimeout(resolve, delay);
  });
  return next();
};
