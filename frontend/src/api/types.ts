import { z } from 'zod';

export const ProductCreateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional().default(''),
  lang: z.string().optional().default('fr'),
  zones_dispo: z.array(z.string()).optional().default(['FR']),
  affiliate_url: z.string().url().optional().default(''),
  price: z.number().positive(),
  currency: z.string().default('EUR'),
  category: z.string(),
  tags: z.array(z.string()).default([]),
  certifications: z.array(z.string()).default([])
});

export const ProductUpdateSchema = z.object({
  resume_fr: z.string(),
  resume_en: z.string(),
  eco_score: z.number().min(0).max(5),
  confidence_pct: z.number().min(0).max(100),
  criteria_score: z.number().min(0).max(100)
});

export type ProductCreate = z.infer<typeof ProductCreateSchema>;
export type ProductUpdate = z.infer<typeof ProductUpdateSchema>;