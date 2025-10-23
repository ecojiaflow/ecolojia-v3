// âœ… FICHIER COMPLET : src/docs/swagger.ts

import swaggerJSDoc from 'swagger-jsdoc';

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Ecolojia API',
      version: '1.0.0',
      description: 'Documentation de l\'API Ecolojia (produits, partenaires, IA)',
      contact: {
        name: 'Ã‰quipe Ecolojia',
        email: 'contact@ecolojia.com',
        url: 'https://ecolojia.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Serveur local (dev)'
      },
      {
        url: 'https://api.ecolojia.com',
        description: 'Serveur de production'
      }
    ],
    tags: [
      {
        name: 'Products',
        description: 'Gestion des produits Ã©co-responsables'
      },
      {
        name: 'Search',
        description: 'Recherche et filtres'
      },
      {
        name: 'EcoScore',
        description: 'Score Ã©cologique IA'
      },
      {
        name: 'Partners',
        description: 'Partenaires et affiliations'
      }
    ],
    components: {
      schemas: {
        Product: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Identifiant unique du produit'
            },
            title: {
              type: 'string',
              description: 'Nom du produit'
            },
            slug: {
              type: 'string',
              description: 'Slug unique pour URLs (ex. "savon-bio-karite")'
            },
            description: {
              type: 'string',
              description: 'Description dÃ©taillÃ©e du produit'
            },
            brand: {
              type: 'string',
              nullable: true,
              description: 'Marque du produit'
            },
            category: {
              type: 'string',
              description: 'CatÃ©gorie du produit'
            },
            tags: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'Mots-clÃ©s associÃ©s'
            },
            images: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'URLs des images'
            },
            zones_dispo: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'Zones de disponibilitÃ© (FR, EU, etc.)'
            },
            prices: {
              type: 'object',
              description: 'Prix par zone/partenaire'
            },
            affiliate_url: {
              type: 'string',
              nullable: true,
              description: 'Lien d\'affiliation principal'
            },
            eco_score: {
              type: 'number',
              minimum: 0,
              maximum: 1,
              description: 'Score Ã©cologique calculÃ© par IA (0-1)'
            },
            ai_confidence: {
              type: 'number',
              minimum: 0,
              maximum: 1,
              description: 'Confiance de l\'IA dans le score'
            },
            confidence_pct: {
              type: 'integer',
              minimum: 0,
              maximum: 100,
              description: 'Pourcentage de confiance'
            },
            confidence_color: {
              type: 'string',
              enum: ['green', 'orange', 'yellow', 'red'],
              description: 'Couleur indiquant la confiance'
            },
            verified_status: {
              type: 'string',
              enum: ['pending', 'manual_review', 'ai_verified', 'expert_verified'],
              description: 'Statut de vÃ©rification'
            },
            resume_fr: {
              type: 'string',
              description: 'RÃ©sumÃ© en franÃ§ais'
            },
            resume_en: {
              type: 'string',
              description: 'RÃ©sumÃ© en anglais'
            },
            image_url: {
              type: 'string',
              nullable: true,
              description: 'URL de l\'image principale'
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Date de crÃ©ation'
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
              description: 'Date de derniÃ¨re modification'
            },
            enriched_at: {
              type: 'string',
              format: 'date-time',
              nullable: true,
              description: 'Date du dernier enrichissement IA'
            }
          },
          required: [
            'id',
            'title',
            'slug',
            'description',
            'category',
            'eco_score',
            'verified_status',
            'created_at',
            'updated_at'
          ]
        },
        CreateProductRequest: {
          type: 'object',
          properties: {
            title: {
              type: 'string',
              minLength: 3,
              maxLength: 200,
              description: 'Nom du produit'
            },
            slug: {
              type: 'string',
              pattern: '^[a-z0-9-]+$',
              description: 'Slug unique (lettres minuscules, chiffres, tirets)'
            },
            description: {
              type: 'string',
              minLength: 10,
              maxLength: 2000,
              description: 'Description dÃ©taillÃ©e'
            },
            brand: {
              type: 'string',
              maxLength: 100,
              description: 'Marque du produit'
            },
            category: {
              type: 'string',
              maxLength: 50,
              description: 'CatÃ©gorie'
            },
            tags: {
              type: 'array',
              items: {
                type: 'string'
              },
              maxItems: 20,
              description: 'Mots-clÃ©s (max 20)'
            },
            images: {
              type: 'array',
              items: {
                type: 'string',
                format: 'uri'
              },
              maxItems: 10,
              description: 'URLs des images'
            },
            zones_dispo: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'Zones de disponibilitÃ©'
            },
            prices: {
              type: 'object',
              description: 'Prix par zone'
            },
            affiliate_url: {
              type: 'string',
              format: 'uri',
              description: 'Lien d\'affiliation'
            },
            eco_score: {
              type: 'number',
              minimum: 0,
              maximum: 1,
              description: 'Score manuel (optionnel, calculÃ© par IA sinon)'
            },
            verified_status: {
              type: 'string',
              enum: ['pending', 'manual_review', 'ai_verified', 'expert_verified'],
              default: 'pending',
              description: 'Statut de vÃ©rification'
            },
            resume_fr: {
              type: 'string',
              maxLength: 500,
              description: 'RÃ©sumÃ© franÃ§ais'
            },
            resume_en: {
              type: 'string',
              maxLength: 500,
              description: 'RÃ©sumÃ© anglais'
            },
            image_url: {
              type: 'string',
              format: 'uri',
              description: 'URL image principale'
            }
          },
          required: [
            'title',
            'slug',
            'description'
          ]
        },
        UpdateProductRequest: {
          type: 'object',
          properties: {
            title: {
              type: 'string',
              minLength: 3,
              maxLength: 200
            },
            slug: {
              type: 'string',
              pattern: '^[a-z0-9-]+$'
            },
            description: {
              type: 'string',
              minLength: 10,
              maxLength: 2000
            },
            brand: {
              type: 'string',
              maxLength: 100
            },
            category: {
              type: 'string',
              maxLength: 50
            },
            tags: {
              type: 'array',
              items: {
                type: 'string'
              },
              maxItems: 20
            },
            images: {
              type: 'array',
              items: {
                type: 'string',
                format: 'uri'
              },
              maxItems: 10
            },
            zones_dispo: {
              type: 'array',
              items: {
                type: 'string'
              }
            },
            prices: {
              type: 'object'
            },
            affiliate_url: {
              type: 'string',
              format: 'uri'
            },
            eco_score: {
              type: 'number',
              minimum: 0,
              maximum: 1
            },
            ai_confidence: {
              type: 'number',
              minimum: 0,
              maximum: 1
            },
            confidence_pct: {
              type: 'integer',
              minimum: 0,
              maximum: 100
            },
            confidence_color: {
              type: 'string',
              enum: ['green', 'orange', 'yellow', 'red']
            },
            verified_status: {
              type: 'string',
              enum: ['pending', 'manual_review', 'ai_verified', 'expert_verified']
            },
            resume_fr: {
              type: 'string',
              maxLength: 500
            },
            resume_en: {
              type: 'string',
              maxLength: 500
            },
            image_url: {
              type: 'string',
              format: 'uri'
            }
          },
          description: 'Tous les champs sont optionnels pour la mise Ã  jour'
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Message d\'erreur'
            },
            code: {
              type: 'string',
              description: 'Code d\'erreur'
            },
            details: {
              oneOf: [
                {
                  type: 'string'
                },
                {
                  type: 'array',
                  items: {
                    type: 'object'
                  }
                }
              ],
              description: 'DÃ©tails supplÃ©mentaires'
            }
          },
          required: [
            'error'
          ]
        }
      }
    }
  },
  apis: [
    './src/routes/*.ts',
    './src/app.ts'
  ]
};

export const swaggerSpec = swaggerJSDoc(options);
