import { Job } from "bullmq";
import path from "path";
import { z } from "zod";
import fs from "fs/promises";
import { VersionFile } from "./update-check";
import {
  itemSchema,
  Item,
  getSchemaItems,
} from "../apis/steam-powered";
import env from "../env";

const econItemsFile = path.resolve(
  import.meta.dirname,
  "../assets/econ-items.json",
);

const econItemsFileSchema = z.object({
  version: z.number(),
  next: z.number().optional(),
  items: itemSchema.array(),
});

type EconItemsFile = z.infer<typeof econItemsFileSchema>;

export async function readEconItems() {
  return await fs
    .readFile(econItemsFile)
    .then<EconItemsFile>((file) => JSON.parse(file.toString()))
    .then(econItemsFileSchema.parse)
    .catch(() => null);
}

export default async function updateEconItems(job: Job<VersionFile>) {
  const { version } = job.data;
  const file = await readEconItems();

  if (file?.version === version && !file.next) {
    return; // File already up-to-date, nothing more to fetch
  }

  let start = 0;
  const items: Item[] = [];

  if (file?.next) {
    start = file.next;
    items.push(...file.items);
  }

  try {
    for await (const response of getSchemaItems(env.STEAM_API_KEY, start)) {
      items.push(...response.items);

      // Need to find a way to make this work together with the rate limit
      await new Promise((res) => setTimeout(res, 1000));

      if (response.next) {
        console.log(`Getting next from ${response.next}`);
        start = response.next;
      }
    }

    fs.writeFile(
      econItemsFile,
      JSON.stringify(
        { version, items, next: undefined } satisfies EconItemsFile,
        undefined,
        4,
      ),
    );
  } catch (e) {
    if (items.length !== 0) {
      fs.writeFile(
        econItemsFile,
        JSON.stringify(
          { version, items, next: start } satisfies EconItemsFile,
          undefined,
          4,
        ),
      );
    }

    throw e;
  }

  console.log("Finished updating Econ Items");

  // Instead of diffing, we store this data (file rn), and recompile later
}
