/**
 * learningCards.js — Knowledge Base Educative Ecolojia
 * Version: 1.1.0 (corrigee)
 * 
 * PRINCIPE ECOLOJIA:
 * - Micro-fiches courtes (2-3 min lecture)
 * - Scientifiquement sourcees (OMS/ANSES/EFSA)
 * - Actionnables (regles concretes)
 * - Neutres (pas de jugement moral)
 * - AUCUN trigger lie a un etat de sante suppose
 * - Formulations nuancees, populationnelles, non causales
 */

const LEARNING_CARDS = {
  // ═══════════════════════════════════════════════════════════════
  // FICHE 1 : EQUILIBRE ALIMENTAIRE
  // ═══════════════════════════════════════════════════════════════
  "equilibre-alimentaire": {
    id: "equilibre-alimentaire",
    title: "Equilibre alimentaire",
    subtitle: "Composer un repas sans compter",
    readTime: 3,
    icon: "scale",
    color: "emerald",
    
    // Triggers 100% produit-dependants
    triggers: ["first_scan", "nutrition_overview", "default"],
    
    sections: [
      {
        id: "assiette",
        title: "Le repere visuel : l'assiette equilibree",
        type: "visual",
        content: {
          description: "Un repere simple pour composer un repas sans calcul",
          items: [
            { label: "Legumes", portion: "1/2", detail: "Crus ou cuits, varies en couleurs", color: "green" },
            { label: "Proteines", portion: "1/4", detail: "Viande, poisson, oeufs, legumineuses", color: "red" },
            { label: "Feculents", portion: "1/4", detail: "De preference complets ou peu transformes", color: "amber" },
            { label: "Matieres grasses", portion: "1 c. a soupe", detail: "Huile d'olive, colza, ou autre huile de qualite", color: "yellow" }
          ]
        }
      },
      {
        id: "macronutriments",
        title: "Role des macronutriments",
        type: "list",
        content: {
          items: [
            {
              title: "Proteines",
              icon: "muscle",
              points: [
                "Contribuent a la satiete apres le repas",
                "Participent au maintien de la masse musculaire",
                "Interviennent dans le renouvellement cellulaire"
              ]
            },
            {
              title: "Glucides",
              icon: "zap",
              points: [
                "Source d'energie pour le corps et le cerveau",
                "La qualite et le contexte comptent autant que la quantite",
                "L'association (fibres, proteines) module l'effet sur la glycemie"
              ]
            },
            {
              title: "Lipides",
              icon: "droplet",
              points: [
                "Necessaires a la synthese hormonale",
                "Permettent l'absorption des vitamines A, D, E, K",
                "Contribuent a la sensation de satiete"
              ]
            }
          ]
        }
      }
    ],
    
    rules: [
      {
        id: "rule-1",
        title: "Varier les couleurs",
        description: "Chaque couleur apporte des nutriments differents. Plus c'est colore, plus c'est varie.",
        icon: "palette"
      },
      {
        id: "rule-2",
        title: "Equilibrer sur la journee",
        description: "Un repas moins equilibre peut etre compense par les autres. C'est l'ensemble qui compte.",
        icon: "calendar"
      },
      {
        id: "rule-3",
        title: "Ecouter sa faim",
        description: "Manger a sa faim, pas au-dela. Les signaux de satiete arrivent apres 15-20 minutes.",
        icon: "heart"
      }
    ],
    
    myths: [
      {
        myth: "Il faut manger equilibre a chaque repas",
        reality: "L'equilibre se fait sur la journee, voire la semaine. Un ecart ponctuel s'integre dans une alimentation globale."
      },
      {
        myth: "Les feculents font grossir",
        reality: "Ce sont les portions excessives et le contexte global qui comptent, pas les feculents en soi."
      }
    ],
    
    sources: [
      { id: "anses-2016-pnns", name: "ANSES", year: 2016, title: "Actualisation des reperes du PNNS" },
      { id: "spf-2019", name: "Sante Publique France", year: 2019, title: "Recommandations sur l'alimentation" }
    ],
    
    relatedCards: ["glucides-et-sucres", "proteines-et-satiete", "lipides-et-graisses"]
  },

  // ═══════════════════════════════════════════════════════════════
  // FICHE 2 : GLUCIDES ET SUCRES
  // ═══════════════════════════════════════════════════════════════
  "glucides-et-sucres": {
    id: "glucides-et-sucres",
    title: "Glucides et sucres",
    subtitle: "Comprendre pour mieux choisir",
    readTime: 3,
    icon: "candy",
    color: "amber",
    
    // Triggers 100% produit-dependants (AUCUN trigger medical)
    triggers: ["sugar_high", "ultra_processed"],
    
    sections: [
      {
        id: "types",
        title: "Tous les glucides ne se valent pas",
        type: "comparison",
        content: {
          description: "La distinction rapide/lent est simpliste. Ce qui compte vraiment :",
          comparisons: [
            {
              label: "Sucres libres / ajoutes",
              detail: "Ajoutes lors de la fabrication, ou naturellement presents dans jus, sirops, miel",
              examples: "Sodas, confiseries, patisseries industrielles, jus de fruits",
              recommendation: "OMS : moins de 10% de l'energie, idealement moins de 5% (environ 25g/jour)",
              color: "red"
            },
            {
              label: "Sucres dans les aliments entiers",
              detail: "Naturellement presents dans les aliments non transformes",
              examples: "Fruits entiers, legumes, produits laitiers nature",
              recommendation: "Pas de repere chiffre specifique : la matrice (fibres, eau) module l'effet",
              color: "green"
            },
            {
              label: "Amidons",
              detail: "Glucides complexes des feculents",
              examples: "Pain, pates, riz, pommes de terre, legumineuses",
              recommendation: "Privilegier les versions completes ou peu transformees",
              color: "amber"
            }
          ]
        }
      },
      {
        id: "contexte",
        title: "Le contexte change tout",
        type: "explanation",
        content: {
          mainPoint: "Un meme aliment peut avoir des effets differents selon comment et avec quoi il est consomme.",
          factors: [
            {
              factor: "Fibres",
              effect: "Ralentissent l'absorption des glucides",
              example: "Fruit entier vs jus de fruit"
            },
            {
              factor: "Proteines",
              effect: "Contribuent a moderer la reponse glycemique",
              example: "Tartine + oeuf vs tartine seule"
            },
            {
              factor: "Matieres grasses",
              effect: "Ralentissent la vidange gastrique",
              example: "Pain + beurre vs pain seul"
            },
            {
              factor: "Transformation",
              effect: "Plus c'est transforme, plus l'absorption tend a etre rapide",
              example: "Flocons d'avoine vs cereales soufflees"
            }
          ]
        }
      },
      {
        id: "glycemie",
        title: "Et la glycemie ?",
        type: "explanation",
        content: {
          mainPoint: "Les variations de glycemie sont normales. C'est leur amplitude et leur repetition qui peuvent avoir un impact.",
          points: [
            "Apres un repas, la glycemie monte naturellement, c'est physiologique",
            "Des variations importantes et frequentes peuvent favoriser fringales et fluctuations d'energie",
            "L'association d'aliments (fibres, proteines, graisses) aide a lisser ces variations"
          ]
        }
      }
    ],
    
    rules: [
      {
        id: "rule-1",
        title: "Associer plutot qu'isoler",
        description: "Associer un aliment sucre a des fibres, proteines ou matieres grasses aide a moderer l'effet sur la glycemie.",
        icon: "combine"
      },
      {
        id: "rule-2",
        title: "Preferer l'aliment entier",
        description: "Un fruit entier apporte fibres et eau. Une pomme de terre cuite maison differe d'une puree industrielle.",
        icon: "apple"
      },
      {
        id: "rule-3",
        title: "C'est la frequence qui compte",
        description: "Un dessert occasionnel s'integre dans une alimentation equilibree. C'est la consommation reguliere de sucres ajoutes qui compte.",
        icon: "calendar"
      }
    ],
    
    myths: [
      {
        myth: "Le sucre est un poison",
        reality: "Le sucre n'est pas toxique. C'est l'exces regulier de sucres ajoutes qui est associe a des effets defavorables au niveau populationnel."
      },
      {
        myth: "Il faut supprimer tous les glucides",
        reality: "Les glucides sont la source d'energie preferee du cerveau. C'est la qualite, le contexte et la frequence qui comptent."
      },
      {
        myth: "Les fruits sont trop sucres",
        reality: "Les fruits entiers contiennent fibres, vitamines et eau. Ils sont recommandes dans le cadre d'une alimentation equilibree (2-3 par jour)."
      }
    ],
    
    practicalTips: [
      {
        situation: "Envie de sucre en fin de repas",
        tip: "Attendre 15-20 minutes. La sensation de satiete peut attenuer l'envie."
      },
      {
        situation: "Gouter pour les enfants",
        tip: "Associer fruit + produit cerealier + produit laitier plutot qu'un produit sucre seul."
      },
      {
        situation: "Petit-dejeuner qui tient",
        tip: "Inclure des proteines (oeuf, fromage, yaourt) et des fibres (pain complet, flocons d'avoine)."
      }
    ],
    
    sources: [
      { id: "oms-2015-sugars", name: "OMS", year: 2015, title: "Guideline: Sugars intake for adults and children" },
      { id: "anses-2016-glucides", name: "ANSES", year: 2016, title: "Actualisation des reperes du PNNS - Glucides" },
      { id: "efsa-2022-sugars", name: "EFSA", year: 2022, title: "Avis sur les sucres - conclusion : aussi bas que possible (pas de seuil UL defini)" }
    ],
    
    relatedCards: ["equilibre-alimentaire", "transformation-alimentaire", "proteines-et-satiete"]
  },

  // ═══════════════════════════════════════════════════════════════
  // FICHE 3 : PROTEINES ET SATIETE
  // ═══════════════════════════════════════════════════════════════
  "proteines-et-satiete": {
    id: "proteines-et-satiete",
    title: "Proteines et satiete",
    subtitle: "Le levier simple pour tenir entre les repas",
    readTime: 2,
    icon: "beef",
    color: "rose",
    
    triggers: ["low_protein", "satiety_concern", "breakfast_context"],
    
    sections: [
      {
        id: "reperes",
        title: "Les reperes",
        type: "key-figures",
        content: {
          figures: [
            { value: "0.83g/kg", label: "Apport de securite pour un adulte (ANSES)", detail: "Soit environ 50-60g/jour pour un adulte moyen" },
            { value: "1-1.2g/kg", label: "Pour les personnes agees", detail: "Les besoins augmentent avec l'age pour maintenir la masse musculaire" },
            { value: "20-30g", label: "Par repas pour optimiser la satiete", detail: "Repartir les apports sur la journee" }
          ]
        }
      },
      {
        id: "roles",
        title: "Pourquoi les proteines aident a tenir",
        type: "explanation",
        content: {
          mainPoint: "Les proteines sont le macronutriment le plus rassasiant.",
          points: [
            "Digestion plus lente que les glucides simples",
            "Stimulent les hormones de satiete (GLP-1, PYY)",
            "Stabilisent la glycemie en association avec d'autres aliments",
            "Contribuent au maintien de la masse musculaire (qui consomme de l'energie au repos)"
          ]
        }
      },
      {
        id: "sources",
        title: "Ou trouver des proteines ?",
        type: "comparison",
        content: {
          description: "Varier les sources permet d'equilibrer les apports en acides amines et autres nutriments.",
          comparisons: [
            {
              label: "Sources animales",
              detail: "Proteines completes (tous les acides amines essentiels)",
              examples: "Viande, poisson, oeufs, produits laitiers",
              recommendation: "Varier : volaille, poisson (2x/semaine dont 1 gras), oeufs",
              color: "red"
            },
            {
              label: "Sources vegetales",
              detail: "A combiner pour avoir tous les acides amines",
              examples: "Legumineuses, tofu, tempeh, seitan, cereales completes",
              recommendation: "Association cereales + legumineuses = proteines completes",
              color: "green"
            },
            {
              label: "Produits laitiers",
              detail: "Bonne source de proteines et calcium",
              examples: "Yaourt, fromage blanc, fromage",
              recommendation: "2-3 produits laitiers par jour (PNNS)",
              color: "blue"
            }
          ]
        }
      }
    ],
    
    rules: [
      {
        id: "rule-1",
        title: "Proteines a chaque repas",
        description: "Inclure une source de proteines a chaque repas principal aide a rester rassasie plus longtemps.",
        icon: "clock"
      },
      {
        id: "rule-2",
        title: "Ne pas oublier le petit-dejeuner",
        description: "Un petit-dejeuner avec proteines (oeuf, yaourt, fromage) tient mieux qu'un petit-dejeuner uniquement sucre.",
        icon: "sunrise"
      },
      {
        id: "rule-3",
        title: "Varier animal et vegetal",
        description: "Alterner les sources permet de varier les apports et de reduire l'impact environnemental.",
        icon: "leaf"
      }
    ],
    
    myths: [
      {
        myth: "Les proteines, c'est pour les sportifs",
        reality: "Tout le monde a besoin de proteines pour le renouvellement cellulaire, l'immunite, la satiete."
      },
      {
        myth: "Trop de proteines abime les reins",
        reality: "Chez les personnes en bonne sante, un apport eleve en proteines n'est pas associe a des problemes renaux. En cas de maladie renale, consultez un professionnel."
      },
      {
        myth: "Les proteines vegetales sont incompletes donc inutiles",
        reality: "En combinant cereales et legumineuses (pas forcement au meme repas), on obtient tous les acides amines essentiels."
      }
    ],
    
    practicalTips: [
      {
        situation: "Faim a 11h malgre le petit-dejeuner",
        tip: "Ajouter une source de proteines au petit-dejeuner : oeuf, yaourt grec, fromage, jambon."
      },
      {
        situation: "Repas vegetarien equilibre",
        tip: "Associer legumineuses (lentilles, pois chiches) + cereales (riz, pain) + legumes."
      },
      {
        situation: "Collation qui tient",
        tip: "Yaourt nature + quelques noix, ou fromage + fruit."
      }
    ],
    
    sources: [
      { id: "anses-2016-proteines", name: "ANSES", year: 2016, title: "Actualisation des reperes du PNNS - Proteines" },
      { id: "efsa-2012-prp", name: "EFSA", year: 2012, title: "Scientific Opinion on Dietary Reference Values for protein" }
    ],
    
    relatedCards: ["equilibre-alimentaire", "glucides-et-sucres"]
  },

  // ═══════════════════════════════════════════════════════════════
  // FICHE 4 : LIPIDES ET GRAISSES
  // ═══════════════════════════════════════════════════════════════
  "lipides-et-graisses": {
    id: "lipides-et-graisses",
    title: "Lipides et graisses",
    subtitle: "Qualite plutot que quantite",
    readTime: 3,
    icon: "droplet",
    color: "orange",
    
    // Triggers 100% produit-dependants
    triggers: ["satfat_high", "fat_high"],
    
    sections: [
      {
        id: "types",
        title: "Toutes les graisses ne se valent pas",
        type: "comparison",
        content: {
          description: "La qualite des graisses compte autant, voire plus, que la quantite.",
          comparisons: [
            {
              label: "Graisses saturees",
              detail: "Solides a temperature ambiante",
              examples: "Beurre, fromage, viandes grasses, huile de coco, palme",
              recommendation: "A limiter : moins de 12% de l'energie totale (ANSES)",
              color: "orange"
            },
            {
              label: "Graisses insaturees",
              detail: "Liquides a temperature ambiante",
              examples: "Huile d'olive, colza, noix, poissons gras, avocat",
              recommendation: "A privilegier : contribuent a la sante cardiovasculaire",
              color: "green"
            },
            {
              label: "Graisses trans industrielles",
              detail: "Issues de l'hydrogenation des huiles",
              examples: "Certaines margarines, viennoiseries industrielles, fritures industrielles",
              recommendation: "A limiter autant que possible",
              color: "red"
            }
          ]
        }
      },
      {
        id: "roles",
        title: "Pourquoi on a besoin de graisses",
        type: "list",
        content: {
          items: [
            {
              title: "Energie et reserve",
              icon: "battery",
              points: ["Source d'energie concentree (9 kcal/g)", "Permet de tenir entre les repas"]
            },
            {
              title: "Fonctions essentielles",
              icon: "heart",
              points: ["Composant des membranes cellulaires", "Necessaires a la synthese hormonale", "Protection des organes"]
            },
            {
              title: "Absorption des vitamines",
              icon: "pill",
              points: ["Les vitamines A, D, E, K sont liposolubles", "Sans graisses dans le repas, leur absorption est reduite"]
            }
          ]
        }
      },
      {
        id: "omega",
        title: "Focus : Omega-3 et Omega-6",
        type: "explanation",
        content: {
          mainPoint: "Ces acides gras essentiels doivent etre apportes par l'alimentation.",
          points: [
            "Omega-3 : poissons gras (saumon, sardine, maquereau), noix, huile de colza, lin",
            "Omega-6 : huiles de tournesol, mais, soja",
            "L'equilibre entre les deux est important : on consomme souvent trop d'omega-6",
            "Objectif : augmenter les omega-3 (2 portions de poisson/semaine dont 1 gras)"
          ]
        }
      }
    ],
    
    rules: [
      {
        id: "rule-1",
        title: "Varier les huiles",
        description: "Huile d'olive pour la cuisson, colza ou noix pour l'assaisonnement. Chacune a ses atouts.",
        icon: "shuffle"
      },
      {
        id: "rule-2",
        title: "2 portions de poisson par semaine",
        description: "Dont une de poisson gras (saumon, sardine, maquereau) pour les omega-3.",
        icon: "fish"
      },
      {
        id: "rule-3",
        title: "Moderer les fritures",
        description: "La cuisson a haute temperature peut alterer les huiles. Privilegier vapeur, four, poele.",
        icon: "flame"
      }
    ],
    
    myths: [
      {
        myth: "Le gras fait grossir",
        reality: "C'est l'exces calorique global qui compte. Les graisses contribuent a la satiete et peuvent aider a manger moins au total."
      },
      {
        myth: "Il faut eviter le beurre",
        reality: "Le beurre peut s'integrer dans une alimentation equilibree. C'est la quantite et la frequence qui comptent."
      },
      {
        myth: "L'huile de coco est particulierement saine",
        reality: "L'huile de coco est tres riche en graisses saturees (plus que le beurre). A utiliser avec moderation."
      }
    ],
    
    practicalTips: [
      {
        situation: "Cuisson quotidienne",
        tip: "Huile d'olive ou huile de colza raffinee supportent bien la chaleur moderee."
      },
      {
        situation: "Vinaigrette maison",
        tip: "Melanger huile de colza (omega-3) et huile d'olive (gout) pour equilibrer."
      },
      {
        situation: "Envie de fromage",
        tip: "Privilegier la qualite a la quantite : 30g d'un bon fromage satisfait souvent mieux que 100g d'un fromage fade."
      }
    ],
    
    sources: [
      { id: "anses-2016-lipides", name: "ANSES", year: 2016, title: "Actualisation des reperes du PNNS - Lipides" },
      { id: "efsa-2017-fats", name: "EFSA", year: 2017, title: "Dietary Reference Values for fats" }
    ],
    
    relatedCards: ["equilibre-alimentaire", "glucides-et-sucres"]
  },

  // ═══════════════════════════════════════════════════════════════
  // FICHE 5 : TRANSFORMATION ALIMENTAIRE
  // ═══════════════════════════════════════════════════════════════
  "transformation-alimentaire": {
    id: "transformation-alimentaire",
    title: "Transformation alimentaire",
    subtitle: "Comprendre NOVA et ses limites",
    readTime: 3,
    icon: "factory",
    color: "purple",
    
    triggers: ["ultra_processed", "nova_4", "additives_high"],
    
    sections: [
      {
        id: "nova",
        title: "La classification NOVA",
        type: "scale",
        content: {
          description: "Une grille de lecture basee sur le degre de transformation, pas sur la qualite nutritionnelle.",
          levels: [
            {
              level: 1,
              label: "Aliments bruts ou peu transformes",
              examples: "Fruits, legumes, oeufs, viande fraiche, lait, riz, legumineuses",
              color: "green"
            },
            {
              level: 2,
              label: "Ingredients culinaires",
              examples: "Huile, beurre, sucre, sel, farine",
              color: "lime"
            },
            {
              level: 3,
              label: "Aliments transformes",
              examples: "Conserves de legumes, fromages, pain artisanal, jambon",
              color: "amber"
            },
            {
              level: 4,
              label: "Produits ultra-transformes",
              examples: "Sodas, snacks, plats prepares industriels, cereales du petit-dejeuner sucrees",
              color: "red"
            }
          ]
        }
      },
      {
        id: "pourquoi",
        title: "Pourquoi s'interesser a la transformation ?",
        type: "explanation",
        content: {
          mainPoint: "Des etudes observationnelles montrent une association entre consommation elevee d'ultra-transformes et certains effets defavorables.",
          points: [
            "Formulation optimisee pour le gout : peut encourager a manger au-dela de la satiete",
            "Souvent riches en sucres ajoutes, sel, graisses saturees",
            "Presence d'additifs dont les effets cumules font l'objet de recherches",
            "Densite nutritionnelle souvent faible par rapport aux calories"
          ],
          nuance: "Important : ce n'est pas un verdict. Un produit NOVA 4 occasionnel s'integre dans une alimentation equilibree. C'est la proportion globale qui compte."
        }
      },
      {
        id: "limites",
        title: "Les limites de NOVA",
        type: "list",
        content: {
          description: "NOVA est un outil utile mais imparfait.",
          items: [
            {
              title: "Pas de nuance nutritionnelle",
              icon: "alert",
              points: ["Un pain de mie complet bio et un soda sont tous deux NOVA 4", "La qualite peut varier enormement dans une meme categorie"]
            },
            {
              title: "Transformation n'est pas toujours negative",
              icon: "check",
              points: ["Pasteurisation, congelation, fermentation preservent et securisent", "Le yaourt est transforme mais recommande"]
            },
            {
              title: "Le contexte global compte",
              icon: "pie-chart",
              points: ["Une alimentation globalement equilibree tolere des ecarts", "C'est la proportion d'ultra-transformes dans l'alimentation qui importe"]
            }
          ]
        }
      }
    ],
    
    rules: [
      {
        id: "rule-1",
        title: "Privilegier le moins transforme quand c'est facile",
        description: "Entre deux options, choisir celle avec la liste d'ingredients la plus courte et comprehensible.",
        icon: "list"
      },
      {
        id: "rule-2",
        title: "Cuisiner plus souvent",
        description: "Meme simple, un plat maison permet de savoir ce qu'on mange.",
        icon: "chef-hat"
      },
      {
        id: "rule-3",
        title: "Lire les etiquettes",
        description: "Plus la liste est longue et contient des ingredients inconnus, plus le produit est transforme.",
        icon: "search"
      }
    ],
    
    myths: [
      {
        myth: "Tout ce qui est industriel est mauvais",
        reality: "Des produits industriels peuvent etre de bonne qualite (conserves de legumes nature, surgeles bruts). C'est la formulation qui compte."
      },
      {
        myth: "Bio = non transforme",
        reality: "Un biscuit bio reste un produit transforme. Le label bio concerne le mode de production, pas le degre de transformation."
      },
      {
        myth: "Les additifs sont tous dangereux",
        reality: "Les additifs autorises sont evalues pour leur securite. Le debat porte sur l'exposition cumulee et repetee a certains d'entre eux."
      }
    ],
    
    sources: [
      { id: "monteiro-2019", name: "Monteiro et al.", year: 2019, title: "Ultra-processed foods: what they are and how to identify them" },
      { id: "anses-2022-upt", name: "ANSES", year: 2022, title: "Avis sur les aliments ultra-transformes" }
    ],
    
    relatedCards: ["equilibre-alimentaire", "glucides-et-sucres"]
  },

  // ═══════════════════════════════════════════════════════════════
  // FICHE 6 : SEL ET SODIUM
  // ═══════════════════════════════════════════════════════════════
  "sel-et-sodium": {
    id: "sel-et-sodium",
    title: "Sel et sodium",
    subtitle: "Le sel cache et comment le reduire",
    readTime: 2,
    icon: "grain",
    color: "slate",
    
    triggers: ["salt_high"],
    
    sections: [
      {
        id: "reperes",
        title: "Les reperes",
        type: "key-figures",
        content: {
          figures: [
            { value: "5g", label: "Maximum recommande par jour (OMS)", detail: "Soit environ 1 cuillere a cafe rase, ou 2g de sodium" },
            { value: "8-10g", label: "Consommation moyenne en France", detail: "La plupart des adultes depassent le repere" },
            { value: "80%", label: "Du sel consomme est cache", detail: "Dans les produits transformes, pas dans la saliere" }
          ]
        }
      },
      {
        id: "sources",
        title: "Ou se cache le sel ?",
        type: "ranking",
        content: {
          description: "Les principales sources de sel dans l'alimentation francaise :",
          items: [
            { rank: 1, item: "Pain et produits de boulangerie", percent: "~25%" },
            { rank: 2, item: "Charcuterie", percent: "~15%" },
            { rank: 3, item: "Fromages", percent: "~10%" },
            { rank: 4, item: "Plats prepares et pizzas", percent: "~10%" },
            { rank: 5, item: "Soupes et sauces", percent: "~10%" }
          ]
        }
      },
      {
        id: "pourquoi",
        title: "Pourquoi limiter le sel ?",
        type: "explanation",
        content: {
          mainPoint: "Au niveau populationnel, la reduction du sel est associee a une baisse de la pression arterielle.",
          points: [
            "La pression arterielle elevee est un facteur de risque cardiovasculaire",
            "Les papilles s'adaptent : apres quelques semaines, on apprecie des plats moins sales",
            "Reduire progressivement est plus facile que d'arreter d'un coup"
          ]
        }
      }
    ],
    
    rules: [
      {
        id: "rule-1",
        title: "Gouter avant de saler",
        description: "Prendre l'habitude de gouter le plat avant d'ajouter du sel a table.",
        icon: "utensils"
      },
      {
        id: "rule-2",
        title: "Utiliser epices et aromates",
        description: "Herbes, epices, citron, ail rehaussent le gout sans ajouter de sel.",
        icon: "leaf"
      },
      {
        id: "rule-3",
        title: "Comparer les etiquettes",
        description: "A produit equivalent, choisir celui avec moins de sel (regarder sel ou sodium x 2.5).",
        icon: "scale"
      }
    ],
    
    myths: [
      {
        myth: "Le sel de mer est meilleur pour la sante",
        reality: "Sel de mer, sel rose, fleur de sel : c'est du chlorure de sodium. Les differences en mineraux sont negligeables aux quantites consommees."
      },
      {
        myth: "Je ne sale pas, donc pas de probleme",
        reality: "80% du sel consomme provient des produits transformes. La saliere ne represente qu'une petite partie."
      }
    ],
    
    sources: [
      { id: "oms-2012-sodium", name: "OMS", year: 2012, title: "Guideline: Sodium intake for adults and children" },
      { id: "anses-2016-sel", name: "ANSES", year: 2016, title: "Actualisation des reperes - Sel" }
    ],
    
    relatedCards: ["equilibre-alimentaire"]
  }
};

// ═══════════════════════════════════════════════════════════════
// FONCTIONS D'ACCES
// ═══════════════════════════════════════════════════════════════

function getAllCards() {
  return Object.values(LEARNING_CARDS);
}

function getCardById(id) {
  return LEARNING_CARDS[id] || null;
}

/**
 * Recuperer les fiches pertinentes pour un contexte produit
 * @param {Object} productContext - Le productContextProfile
 * @returns {Array} Fiches suggerees avec raison et priorite
 */
function getCardsForProductContext(productContext) {
  if (!productContext) return [];
  
  const suggestedCards = [];
  
  // Sucres eleves -> fiche glucides
  if (productContext.sugarLevel === "high") {
    suggestedCards.push({
      card: LEARNING_CARDS["glucides-et-sucres"],
      reason: "Riche en sucres",
      priority: 1
    });
  }
  
  // Graisses saturees elevees -> fiche lipides
  if (productContext.satFatLevel === "high") {
    suggestedCards.push({
      card: LEARNING_CARDS["lipides-et-graisses"],
      reason: "Contient des graisses saturees",
      priority: 2
    });
  }
  
  // Ultra-transforme -> fiche transformation
  if (productContext.processingLevel === "ultra_processed") {
    suggestedCards.push({
      card: LEARNING_CARDS["transformation-alimentaire"],
      reason: "Produit ultra-transforme",
      priority: 3
    });
  }
  
  // Sel eleve -> fiche sel
  if (productContext.saltLevel === "high") {
    suggestedCards.push({
      card: LEARNING_CARDS["sel-et-sodium"],
      reason: "Riche en sel",
      priority: 4
    });
  }
  
  // Additifs nombreux -> fiche transformation aussi
  if (productContext.additivesLevel === "high" && !suggestedCards.find(s => s.card.id === "transformation-alimentaire")) {
    suggestedCards.push({
      card: LEARNING_CARDS["transformation-alimentaire"],
      reason: "Contient plusieurs additifs",
      priority: 5
    });
  }
  
  // Si aucune fiche specifique, proposer equilibre + proteines
  if (suggestedCards.length === 0) {
    suggestedCards.push({
      card: LEARNING_CARDS["equilibre-alimentaire"],
      reason: "Pour comprendre l'equilibre alimentaire",
      priority: 10
    });
  }
  
  // Trier par priorite et retourner max 2 fiches
  return suggestedCards
    .sort((a, b) => a.priority - b.priority)
    .slice(0, 2);
}

/**
 * Version legere pour l'API (sans le contenu complet)
 */
function getSuggestedCardIds(productContext) {
  const suggestions = getCardsForProductContext(productContext);
  return suggestions.map(s => ({
    id: s.card.id,
    title: s.card.title,
    subtitle: s.card.subtitle,
    readTime: s.card.readTime,
    reason: s.reason,
    icon: s.card.icon,
    color: s.card.color
  }));
}

/**
 * Recuperer une fiche complete par ID (pour l'API)
 */
function getFullCard(id) {
  const card = LEARNING_CARDS[id];
  if (!card) return null;
  
  return {
    ...card,
    relatedCardsSummary: (card.relatedCards || []).map(relId => {
      const rel = LEARNING_CARDS[relId];
      return rel ? { id: rel.id, title: rel.title, readTime: rel.readTime, icon: rel.icon, color: rel.color } : null;
    }).filter(Boolean)
  };
}

module.exports = {
  LEARNING_CARDS,
  getAllCards,
  getCardById,
  getCardsForProductContext,
  getSuggestedCardIds,
  getFullCard
};
