import { config } from "dotenv";
import { z } from "zod";

config();
config({ path: "../../.env" });

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(4000),
  API_PORT: z.coerce.number().optional(),
  WEB_ORIGIN: z.string().default("http://localhost:3000"),
  JWT_SECRET: z.string().min(24),
  MONGODB_URI: z.string().url().or(z.string().startsWith("mongodb://")),
  REDIS_URL: z.string().default("redis://localhost:6379"),
  BETFAIR_APP_KEY: z.string().optional(),
  BETFAIR_SESSION_TOKEN: z.string().optional(),
  RAPIDAPI_KEY: z.string().optional(),
  RAPIDAPI_CRICBUZZ_HOST: z.string().default("cricbuzz-cricket.p.rapidapi.com"),
  COMMISSION_BPS: z.coerce.number().default(200),
  MAX_USER_EXPOSURE: z.coerce.number().default(100000),
  MAX_MARKET_EXPOSURE: z.coerce.number().default(1000000)
});

const rawEnv = schema.parse(process.env);

export const env = {
  ...rawEnv,
  PORT: rawEnv.API_PORT ?? rawEnv.PORT,
};
