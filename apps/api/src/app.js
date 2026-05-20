import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { ensureUploadDirectories, UPLOAD_ROOT } from "./common/utils/localUpload.js";
import { env } from "./config/env.js";
import { errorMiddleware } from "./middlewares/error.middleware.js";
import { notFoundMiddleware } from "./middlewares/notFound.middleware.js";
import apiRoutes from "./routes/index.js";

const app = express();

ensureUploadDirectories();

app.use(
  helmet({
    crossOriginResourcePolicy: {
      policy: "cross-origin"
    }
  })
);
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(UPLOAD_ROOT));

if (env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

app.use("/api", apiRoutes);

app.use(notFoundMiddleware);
app.use(errorMiddleware);

export default app;
