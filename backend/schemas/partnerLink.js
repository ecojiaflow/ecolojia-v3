// schemas/partnerLink.js
const { z } = require('zod');

const createPartnerLinkSchema = z.object({
  product_id: z.string().uuid('ID produit doit Ãªtre un UUID valide'),
  partner_id: z.string().uuid('ID partenaire doit Ãªtre un UUID valide'),
  affiliate_url: z.string().url('URL d\'affiliation doit Ãªtre valide').min(1),
  tracking_id: z.string().optional(),
  commission_rate: z.number()
    .min(0, 'Commission doit Ãªtre >= 0')
    .max(1, 'Commission doit Ãªtre <= 1 (100%)')
    .transform(val => val), // Garde en decimal pour Prisma
  active: z.boolean().default(true)
});

const updatePartnerLinkSchema = createPartnerLinkSchema.partial().extend({
  id: z.string().uuid('ID lien doit Ãªtre un UUID valide')
});

module.exports = {
  createPartnerLinkSchema,
  updatePartnerLinkSchema
};