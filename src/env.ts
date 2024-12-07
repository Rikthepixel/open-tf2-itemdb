import { z } from "zod";

const env = z
  .object({
    STEAM_API_KEY: z.string(),
    REDIS_HOST: z.string().optional().default("localhost"),
    REDIS_PORT: z.coerce.number().int().optional().default(6379),
    REDIS_PASSWORD: z.string().optional(),
  })
  .parse(process.env);

export const redisConnection = {
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  password: env.REDIS_PASSWORD
}

export default env;
