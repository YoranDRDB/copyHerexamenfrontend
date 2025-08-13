import Router from "@koa/router";
import * as healthService from "../service/health";
import type { KoaContext, KoaRouter } from "../types/koa";
import type { TaakBeheerContext, TaakBeheerState } from "../types/koa";
import type { PingResponse, VersionResponse } from "../types/health";
import validate from "../core/validation";

/**
 * @api {get} /health/ping Ping
 * @apiName Ping
 * @apiGroup Health
 *
 * @apiSuccess {String} message "pong".
 *
 * @apiError {String} code Error code.
 * @apiError {String} message Error message.
 */
const ping = async (ctx: KoaContext<PingResponse>) => {
  ctx.status = 200;
  ctx.body = healthService.ping();
};
ping.validationScheme = null;

/**
 * @api {get} /health/version Get application version
 * @apiName GetVersion
 * @apiGroup Health
 *
 * @apiSuccess {String} version Current version of the application.
 *
 * @apiError {String} code Error code.
 * @apiError {String} message Error message.
 */
const getVersion = async (ctx: KoaContext<VersionResponse>) => {
  ctx.status = 200;
  ctx.body = healthService.getVersion();
};
getVersion.validationScheme = null;

/**
 * Registers health-related routes on the given parent router.
 *
 * @param {KoaRouter} parent The parent router to register the routes on.
 */
export default function installPlacesRoutes(parent: KoaRouter) {
  const router = new Router<TaakBeheerState, TaakBeheerContext>({
    prefix: "/health",
  });

  // Define health endpoints
  router.get("/ping", validate(ping.validationScheme), ping); // Health check (ping)
  router.get("/version", validate(getVersion.validationScheme), getVersion); // Application version

  // Register the health routes with the parent router
  parent.use(router.routes()).use(router.allowedMethods());
}
