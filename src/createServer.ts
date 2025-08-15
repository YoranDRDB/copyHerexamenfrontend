import Koa from "koa";
import { getLogger } from "./core/logging";
import { initializeData, shutdownData } from "./data";
import installMiddlewares from "./core/installMiddlewares";
import installRest from "./rest";
import config from "config";
import type { Server as HttpServer } from "http";
import type {
  KoaApplication,
  TaakBeheerState,
  TaakBeheerContext,
} from "./types/koa";
const PORT = config.get<number>("port");
export interface Server {
  getApp(): KoaApplication;
  start(): Promise<void>;
  stop(): Promise<void>;
}
export default async function createServer(): Promise<Server> {
  const app = new Koa<TaakBeheerState, TaakBeheerContext>();
  let server: HttpServer | undefined;

  installMiddlewares(app);
  await initializeData();
  installRest(app);
  return {
    getApp() {
      return app;
    },

    start() {
      return new Promise<void>((resolve) => {
        server = app.listen(PORT, () => {
          getLogger().info(` Server listening on ${PORT}`);
          resolve();
        });
      });
    },

    async stop() {
      app.removeAllListeners();
      await shutdownData();
      server?.close();
      getLogger().info("Goodbye!");
    },
  };
}
