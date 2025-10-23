const { PrismaClient, VerifiedStatus } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const product = await prisma.product.create({
    data: {
      title: "Savon test local",
      description: "Produit de test insÃ©rÃ© par script",
      slug: "savon-test-local",
      tags: ["test", "demo"],
      zones_dispo: ["FR"],
      affiliate_url: null,
      eco_score: 0.5,
      ai_confidence: 0.9,
      confidence_pct: 90,
      confidence_color: "yellow",
      verified_status: VerifiedStatus.verified
    }
  });

  console.log("âœ… Produit insÃ©rÃ© avec succÃ¨s :", product);
}

main()
  .catch((err) => {
    console.error("âŒ Erreur pendant lâ€™insertion :", err);
  })
  .finally(async () => {
    prisma.$disconnect();
  });
