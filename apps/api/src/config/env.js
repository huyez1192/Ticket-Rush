import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
  path: path.resolve(__dirname, "../../.env")
});

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]),
  PORT: z.coerce.number().int().positive(),
  MONGODB_URI: z.string().min(1, "MONGODB_URI is required."),
  JWT_ACCESS_SECRET: z.string().min(1, "JWT_ACCESS_SECRET is required."),
  JWT_ACCESS_EXPIRES_IN: z.string().min(1, "JWT_ACCESS_EXPIRES_IN is required."),
  CORS_ORIGIN: z.string().min(1, "CORS_ORIGIN is required."),
  BCRYPT_SALT_ROUNDS: z.coerce.number().int().positive()
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  const details = parsedEnv.error.errors
    .map((error) => `${error.path.join(".")}: ${error.message}`)
    .join("; ");

  throw new Error(`Invalid API environment configuration. ${details}`);
}

export const env = Object.freeze(parsedEnv.data);
