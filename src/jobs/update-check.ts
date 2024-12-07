import fs from "fs/promises";
import { getUpToDate } from "../apis/steam-powered";
import env from "../env";
import path from "path";
import { z } from "zod";
import updaterQueue, { flowProducer } from "../queues/updater";

const versionFile = path.resolve(import.meta.dirname, "../assets/version.json");

export const versionFileSchema = z.object({ version: z.number() });

export type VersionFile = z.infer<typeof versionFileSchema>;

export default async function updateCheck() {
  const current = await fs
    .readFile(versionFile)
    .then((file) => JSON.parse(file.toString()))
    .then(versionFileSchema.parse)
    .catch(() => null); // Don't care if format is invalid, or if file doesn't exist. We'll create a new file in that case

  const response = await getUpToDate(env.STEAM_API_KEY, current?.version ?? 0);
  if (response.up_to_date) return;

  const data: VersionFile = {
    version: response.required_version,
  };

  await fs.writeFile(versionFile, JSON.stringify(data));

  const queueName = updaterQueue.name;

  flowProducer.add({
    name: "compileItemDB",
    queueName,
    children: [
      {
        name: "updateEconItems",
        queueName,
        data,
      },

      // We want to start refetching these regularly after an update
      // {
      //   name: "updateBackpackTFSpreadsheet",
      //   queueName,
      //   data,
      // },
      // {
      //   name: "updateBackpackTFPrices",
      //   queueName,
      //   data,
      // },
    ],
  });
}
