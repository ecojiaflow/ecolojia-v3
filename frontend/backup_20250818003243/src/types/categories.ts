export enum CategoryType {
  ALIMENTAIRE = 'alimentaire',
  COSMETIQUE = 'cosmetique', 
  MODE = 'mode',
  MAISON = 'maison',
  ELECTRONIQUE = 'electronique',
  SPORT = 'sport',
  MOBILITE = 'mobilite'
}

export interface CategoryConfig {
  name: string;
  icon: string;
  color: string;
  criteria: string[];
  weights: {
    health?: number;
    environmental?: number;
    social?: number;
    durability?: number;
  };
}

export const CATEGORIES: Record<CategoryType, CategoryConfig> = {
  [CategoryType.ALIMENTAIRE]: {
    name: "Alimentaire",
    icon: "ƒÆ’‚Â°ƒâ€¦‚Â¸ƒâ€š‚Âƒâ€¦‚Â½",
    color: "green",
    criteria: ["bio", "local", "equitable", "saisonnier"],
    weights: { health: 0.35, environmental: 0.3, social: 0.15 }
  },
  [CategoryType.COSMETIQUE]: {
    name: "Cosmetiques", 
    icon: "ƒÆ’‚Â°ƒâ€¦‚Â¸aaâ€šÂ¬aâ€žÂ¢aaâ€šÂ¬…Â¾",
    color: "pink",
    criteria: ["clean", "naturel", "cruelty-free", "vegan"],
    weights: { health: 0.4, environmental: 0.25, social: 0.15 }
  },
  [CategoryType.MODE]: {
    name: "Mode",
    icon: "ƒÆ’‚Â°ƒâ€¦‚Â¸aaâ€šÂ¬‹Å“aaâ€šÂ¬‚Â¢", 
    color: "blue",
    criteria: ["ethique", "durable", "local", "recycle"],
    weights: { environmental: 0.35, social: 0.25, durability: 0.15 }
  },
  [CategoryType.MAISON]: {
    name: "Maison",
    icon: "ƒÆ’‚Â°ƒâ€¦‚Â¸ƒâ€š‚Âƒâ€š‚Â ",
    color: "orange", 
    criteria: ["ecologique", "non-toxique", "durable", "local"],
    weights: { health: 0.3, environmental: 0.35, durability: 0.2 }
  },
  [CategoryType.ELECTRONIQUE]: {
    name: "ƒÆ’†â€™aaâ€šÂ¬‚Â°lectronique",
    icon: "ƒÆ’‚Â°ƒâ€¦‚Â¸aaâ€šÂ¬…â€œƒâ€š‚Â±",
    color: "purple",
    criteria: ["reconditionne", "reparable", "efficace", "recyclable"],
    weights: { environmental: 0.4, durability: 0.3, social: 0.1 }
  },
  [CategoryType.SPORT]: {
    name: "Sport", 
    icon: "ƒÆ’‚Â°ƒâ€¦‚Â¸ƒâ€š‚Âƒâ€ aâ‚¬â„¢",
    color: "red",
    criteria: ["recycle", "ethique", "durable", "local"],
    weights: { environmental: 0.3, social: 0.25, durability: 0.25 }
  },
  [CategoryType.MOBILITE]: {
    name: "Mobilite",
    icon: "ƒÆ’‚Â°ƒâ€¦‚Â¸ƒâ€¦‚Â¡aaâ€šÂ¬aâ‚¬Â", 
    color: "teal",
    criteria: ["electrique", "doux", "efficace", "partage"],
    weights: { environmental: 0.45, social: 0.2, durability: 0.15 }
  }
};

