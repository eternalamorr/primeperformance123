import { z } from "zod";

const StringArray = z.array(z.string());
const SpecSchema = z.object({
  label: z.string().trim().min(1).max(120),
  value: z.string().trim().min(1).max(200),
});
const ColorSchema = z.object({
  name: z.string().trim().min(1).max(80),
  hex: z.string().trim().regex(/^#[0-9a-fA-F]{6}$/),
  splitHex: z.tuple([z.string().regex(/^#[0-9a-fA-F]{6}$/), z.string().regex(/^#[0-9a-fA-F]{6}$/)]).optional(),
});

export const ProductSchema = z
  .object({
    id: z.number().int().positive(),
    name: z.string().min(1).max(200),
    price: z.string().min(1).max(50),
    segment: z.enum(["standard", "premium"]).default("standard"),
    description: z.string().max(5000).optional().nullable(),
    full_description: z.string().max(10000).optional().nullable(),
    features: StringArray.optional().nullable(),
    specs: z.array(SpecSchema).optional().nullable(),
    colors: z.array(ColorSchema).optional().nullable(),
    color_gallery: z.record(StringArray).optional().nullable(),
    badge: z.string().max(200).optional().nullable(),
    image: z.string().max(500).optional().nullable(),
    gallery: StringArray.optional().nullable(),
    is_upgrade: z.boolean().optional().nullable(),
  })
  .strict();

export const ProductPatchSchema = ProductSchema.partial().omit({ id: true });
