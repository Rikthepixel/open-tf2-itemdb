import { z } from "zod";

export const itemCapabilitiesSchema = z
  .object({
    can_craft_mark: z.boolean(),
    nameable: z.boolean(),
    can_gift_wrap: z.boolean(),
    paintable: z.boolean(),
    can_craft_count: z.boolean(),
    decodable: z.boolean(),
    usable: z.boolean(),
    usable_gc: z.boolean(),
    usable_out_of_game: z.boolean(),
  })
  .partial();

export type ItemCapabilities = z.infer<typeof itemCapabilitiesSchema>;

export const itemSchema = z.object({
  name: z.string(),
  defindex: z.number(),
  item_class: z.string(),
  item_type_name: z.string(),
  item_name: z.string(),
  item_description: z.string().optional(),
  proper_name: z.boolean(),
  item_slot: z.string().optional(),
  item_quality: z.number(),
  image_inventory: z.string().nullable(),
  image_url: z.string().nullable(), // Will be an empty string if none is available
  image_url_large: z.string().nullable(), // Will be an empty string if none is available
  item_set: z.string().optional(),
  drop_type: z.union([z.literal("none"), z.literal("drop")]).optional(),
  holiday_restriction: z.string().optional(),
  model_player: z.string().nullable(),
  min_ilevel: z.number(),
  max_ilevel: z.number(),
  craft_class: z.string().optional(),
  craft_material_type: z.string().optional(),
  capabilities: itemCapabilitiesSchema.optional(),
  tool: z
    .object({
      type: z.string().optional(), // Can be empty for some reason
      usage_capabilities: itemCapabilitiesSchema.optional(),
    })
    .optional(),
  used_by_classes: z.string().array().optional(),
  per_class_loadout_slots: z.record(z.string()).optional(),
  styles: z
    .object({
      name: z.string(),
    })
    .array()
    .optional(),
  attributes: z
    .object({
      name: z.string(),
      class: z.string(),
      value: z.number(),
    })
    .array()
    .optional(),
});

export type Item = z.infer<typeof itemSchema>;

type GetSchemaItemsResponse = {
  status: 1; // Should always be 1
  items_game_url: string;
  items: Item[]; // max 1000 items
  next?: number;
};

export async function* getSchemaItems(
  apiKey: string,
  initialStart?: number,
): AsyncIterable<GetSchemaItemsResponse> {
  const url = new URL(
    "/IEconItems_440/GetSchemaItems/v0001/",
    "https://api.steampowered.com",
  );

  url.searchParams.set("key", apiKey);
  url.searchParams.set("format", "json");

  let start: number | undefined = initialStart;
  while (initialStart !== undefined) {
    url.searchParams.set("start", String(start));

    const response = await fetch(url)
      .then((res) => res.json())
      .then<GetSchemaItemsResponse>((json) => json.result);

    start = response.next;

    yield response;
  }
}

type GetUpToDateResponse =
  | {
      success: boolean;
      up_to_date: true;
      version_is_listable: boolean;
    }
  | {
      success: boolean;
      up_to_date: false;
      version_is_listable: boolean;
      required_version: number;
      message: string;
    };

// https://wiki.teamfortress.com/wiki/WebAPI/UpToDateCheck
export async function getUpToDate(apiKey: string, version?: number) {
  const url = new URL(
    `/ISteamApps/UpToDateCheck/v1`,
    "https://api.steampowered.com",
  );

  url.searchParams.set("key", apiKey);
  url.searchParams.set("format", "json");
  url.searchParams.set("appId", "440");
  url.searchParams.set("version", String(version ?? 0));

  return await fetch(url)
    .then((res) => res.json())
    .then<GetUpToDateResponse>((json) => json.response);
}
