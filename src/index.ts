// src/index.ts
import createServer from "./createServer";
import { getLogger } from "./core/logging";
const logger = getLogger();
process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled promise rejection", { error: reason });
  process.exit(-1);
});
async function main() {
  try {
    const server = await createServer();
    await server.start();

    async function onClose() {
      await server.stop();
      process.exit(0);
    }

    process.on("SIGTERM", onClose);
    process.on("SIGQUIT", onClose);
  } catch (error) {
    getLogger().error("Error while starting the server", { error });
    process.exit(-1);
  }
}

main();
