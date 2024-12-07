import fs from "fs/promises";
import { readTradeTfSpreadsheet } from "../apis/tradetf";
import path from "path";
import { z } from "zod";
import { itemSchema } from "../apis/steam-powered";
import { replacer } from "../helpers/json";
import { readLocaleFile } from "../apis/steamdb-gametracker";

type AggregateAttributeRecord = {
  crate: {
    type: "crate";
    series: Map<
      number,
      {
        series: number;
        contents: { defindex: string; qualities: number[] }[];
        unusual_effects: Set<number>;
      }
    >;
  };
  recipe: {
    type: "recipe";
    outputs: { defindex: number; quality: number; applies_to: Set<number> }[];
  };
  unusual: {
    type: "unusual";
    unusual_effecs: Set<number>;
  };
  tool: {
    type: "tool";
    applies_to: Set<string>;
  };
};

type AggregateItem = {
  name: string;
  defindex: number;
  class_id: number;
  instance_ids: Set<number>;
  qualities: Set<number>;
  uncraftable_qualities: Set<number>;
  attributes: Partial<AggregateAttributeRecord>;
};

type ItemAggregatesFile = {
  items: Map<string, AggregateItem>;
};

const econItemsFile = path.resolve(
  import.meta.dirname ?? __dirname,
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
    .catch((e) => {
      console.error(e);
      return null;
    });
}

async function run() {
  const [econItemsFile, tradeTfSpreadsheet, locale] = await Promise.all([
    readEconItems(),
    readTradeTfSpreadsheet(),
    readLocaleFile(),
  ] as const);

  if (!econItemsFile) {
    throw Error("Econ items could not be loaded");
  }

  const warpaintLocale = Object.entries(locale.protoObjDefTokens)
    .filter(([key]) => key.startsWith("9_"))
    .map(([key, value]) => {
      const matches = key.match(/9_(\d*)_field/);
      if (!matches) {
        throw new Error(
          `proto_obj_def '${key}' didn't conform to warpaint key`,
        );
      }

      return {
        name: value,
        texture: matches.at(1)!,
        item_suffix: "_" + value.replace(/[^a-zA-Z0-9]/g, "").toLowerCase(),
      };
    });

  const econItems = new Map(
    econItemsFile.items.map((item) => [item.defindex.toString(), item]),
  );

  const file: ItemAggregatesFile = {
    items: new Map(
      econItemsFile.items.map((item) => {
        const attributes: Partial<AggregateAttributeRecord> = {};
        if (item.item_class === "supply_crate") {
          attributes.crate = {
            type: "crate",
            series: new Map(),
          };

          const seriesAttr = item.attributes?.find(
            (attr) => attr.class === "supply_crate_series",
          );

          if (seriesAttr && seriesAttr.value) {
            attributes.crate.series.set(seriesAttr.value, {
              series: seriesAttr.value,
              contents: [],
              unusual_effects: new Set(),
            });
          }
        }

        if (item.item_quality === 15) {
          const locale =
            item.item_class !== "tool"
              ? warpaintLocale.find((warpaint) =>
                  item.name.endsWith(warpaint.item_suffix),
                )
              : null;

          if (locale) {
            const actualName = locale.name + " " + name;
          }
        }

        return [
          item.defindex.toString(),
          {
            name: locale.tokens[item.item_name.replace(/^#/, "")] ?? item.name,
            defindex: item.defindex,
            class_id: -1,
            instance_ids: new Set(),
            qualities: new Set([item.item_quality]),
            uncraftable_qualities: new Set(),
            attributes,
          },
        ];
      }),
    ),
  };

  for (let [key, item] of Object.entries(tradeTfSpreadsheet.items)) {
    let aggregate = file.items.get(key);
    let econItem = econItems.get(key);

    if (key.length === 8) {
      const defIndex = key.substring(0, 4);
      const crateEconItem = econItems.get(defIndex);
      const crateAggregate = file.items.get(defIndex);

      const isCrate = crateEconItem?.item_class === "supply_crate";
      if (isCrate && crateAggregate && crateEconItem) {
        econItem = crateEconItem;
        aggregate = crateAggregate;

        const series = parseInt(key.substring(4, 8));
        const crate = aggregate.attributes.crate;
        if (crate && !crate.series.has(series) && !Number.isNaN(series)) {
          crate.series.set(series, {
            series,
            contents: [],
            unusual_effects: new Set(),
          });
        }
      } else if (!isCrate && crateAggregate && crateEconItem) {
        console.log("8 length key, but not crate:", key);
      }
    }

    if (!aggregate || !econItem) {
      console.log("No aggregate found for:", key);
      continue;
    }

    if ("-1" in item) {
      delete item["-1"];
      aggregate.uncraftable_qualities.add(econItem.item_quality);
    }

    for (const quality of Object.keys(item)) {
      aggregate.qualities.add(parseInt(quality));
    }
  }

  console.log("Writing aggregates");

  fs.writeFile(
    path.resolve(
      import.meta.dirname ?? __dirname,
      "../assets/item-aggregates.json",
    ),
    JSON.stringify(file, replacer, 2),
  );
}

run();
