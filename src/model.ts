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
  item_slot: z.union([
    z.literal("primary"),
    z.literal("secondary"),
    z.literal("melee"),
    z.literal("head"),
    z.literal("misc"),
    z.literal("pda"),
    z.literal("pda2"),
    z.literal("building"),
    z.literal("grenade"),
    z.literal("action"),
  ]),
  item_quality: z.number(),
  
  qualities: z.number().array(),
  uncraftable_qualities: z.number().array(),
  unusual_effects: z.number().array(),


  image_inventory: z.string(),
  image_url: z.string(), // Will be an empty string if none is available
  image_url_large: z.string(), // Will be an empty string if none is available
  item_set: z.string().optional(),
  drop_type: z.union([z.literal("none"), z.literal("drop")]).optional(),
  holiday_restriction: z.union([
    z.literal("halloween_or_fullmoon"),
    z.literal("halloween"),
    z.literal("christmas"),
    z.literal("birthday"),
  ]),
  model_player: z.string().nullable(),
  min_ilevel: z.number(),
  max_ilevel: z.number(),
  craft_class: z
    .union([
      z.literal("weapon"),
      z.literal("hat"),
      z.literal("craft_bar"),
      z.literal("haunted_hat"),
      z.literal("tool"),
      z.literal("supply_crate"),
      z.literal("craft_token"),
    ])
    .optional(),
  craft_material_type: z.string().optional(),
  capabilities: itemCapabilitiesSchema.optional(),
  tool: z
    .object({
      type: z.string().optional(), // Can be empty for some reason
      usage_capabilities: itemCapabilitiesSchema,
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
    .optional(),
});

export type Item = z.infer<typeof itemSchema>;
