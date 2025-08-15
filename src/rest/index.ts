import Router from "@koa/router";
import installHealthRoutes from "./health";
import installUserRouter from "./users";
import installProjectRouter from "./projects";
import installSessionRouter from "./session";
import installTaskRouter from "./tasks";
import installTagRouter from "./tags";

import type {
  TaakBeheerContext,
  TaakBeheerState,
  KoaApplication,
} from "../types/koa";

/**
 * Sets up the main API router and installs all route modules.
 *
 * @param {KoaApplication} app The main Koa application instance.
 */
export default function installRest(app: KoaApplication) {
  const router = new Router<TaakBeheerState, TaakBeheerContext>({
    prefix: "/api", // All routes will be prefixed with /api
  });

  // Install individual route modules
  installHealthRoutes(router); // Health check routes
  installUserRouter(router); // User-related routes
  installProjectRouter(router); // Project-related routes
  installSessionRouter(router); // Session (authentication) routes
  installTaskRouter(router); // Task-related routes
  installTagRouter(router); // Tag-related routes

  // Register the router with the Koa application
  app.use(router.routes()).use(router.allowedMethods());
}
