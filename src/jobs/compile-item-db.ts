import { Job } from "bullmq";
import path from "path";
import { z } from "zod";
import { itemSchema } from "../apis/steam-powered";
import { readEconItems } from "./update-econ-items";
import { readTradeTfSpreadsheet } from "../apis/tradetf";

const itemDBFile = path.resolve(import.meta.dirname, "../assets/item-db.json");

const itemDBFileSchema = z.object({
  version: z.number(),
  items: itemSchema.array(),
});

type ItemDBFile = z.infer<typeof itemDBFileSchema>;

export default async function compileItemDB(job: Job) {
  const { version } = job.data;

  const [econItems, tradeTfSpreadsheet] = await Promise.all([
    readEconItems(),
    readTradeTfSpreadsheet(),
  ]);

  if (!econItems) {
    throw new Error("Econ items were not defined");
  }

  for (const econItem of econItems.items) {
    const tradeTfItem = tradeTfSpreadsheet.items[econItem.defindex];
    const tradeTfQualities = Object.keys(tradeTfItem).map((q) => parseInt(q));

    econItem.item_quality
  }
}
