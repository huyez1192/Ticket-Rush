import app from "./app.js";
import { env } from "./config/env.js";
import { connectMongo } from "./database/connectMongo.js";

let server;

process.on("uncaughtException", (error) => {
  console.error("Uncaught exception.", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled promise rejection.", reason);

  if (server) {
    server.close(() => process.exit(1));
    return;
  }

  process.exit(1);
});

async function startServer() {
  await connectMongo();

  server = app.listen(env.PORT, () => {
    console.log(`Ticket Rush API listening at http://localhost:${env.PORT}`);
  });
}

startServer().catch((error) => {
  console.error("Failed to start Ticket Rush API.", error.message);
  process.exit(1);
});
