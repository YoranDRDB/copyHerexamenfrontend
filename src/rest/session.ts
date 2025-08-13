import Router from "@koa/router";
import Joi from "joi";
import validate from "../core/validation";
import * as userService from "../service/user";
import { authDelay } from "../core/auth";
import type {
  KoaContext,
  KoaRouter,
  TaakBeheerState,
  TaakBeheerContext,
} from "../types/koa";
import type { LoginResponse, LoginRequest } from "../types/user";

/**
 * @api {post} /sessions User login
 * @apiName Login
 * @apiGroup Sessions
 *
 * @apiHeader {String} Content-Type application/json.
 *
 * @apiParamExample {json} Request-Body:
 *     {
 *       "email": "user@example.com",
 *       "password": "userpassword"
 *     }
 *
 * @apiSuccess {String} token Authentication token for the logged-in user.
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "token": "jwt.token.here"
 *     }
 *
 * @apiError {String} code Error code.
 * @apiError {String} message Error message.
 *
 * @apiErrorExample {json} Error-Response:
 *     HTTP/1.1 401 Unauthorized
 *     {
 *       "code": "INVALID_CREDENTIALS",
 *       "message": "Invalid email or password."
 *     }
 */
const login = async (ctx: KoaContext<LoginResponse, void, LoginRequest>) => {
  const { email, password } = ctx.request.body;
  const token = await userService.login(email, password);

  ctx.status = 200;
  ctx.body = { token };
};
login.validationScheme = {
  body: {
    email: Joi.string().email(),
    password: Joi.string(),
  },
};

/**
 * Registers session-related routes on the given parent router.
 *
 * @param {KoaRouter} parent The parent router to register the routes on.
 */
export default function installSessionRoutes(parent: KoaRouter) {
  const router = new Router<TaakBeheerState, TaakBeheerContext>({
    prefix: "/sessions",
  });

  // User login route
  router.post("/", authDelay, validate(login.validationScheme), login);

  parent.use(router.routes()).use(router.allowedMethods());
}
