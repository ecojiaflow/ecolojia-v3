/**
 * KNOWLEDGE ENGINE V3.2 - TYPES TYPESCRIPT
 * 
 * Interfaces alignées avec backend/src/knowledge/knowledge.service.js
 * Output de analyzeProduct()
 */

export type SeverityLevel = 'critical' | 'high' | 'medium' | 'low';
export type PriorityLevel = 'high' | 'medium' | 'low';

/**
 * ISSUE : Problème détecté (santé, environnement, éthique)
 */
export interface Issue {
  category: string;          // Ex: "Déforestation massive"
  severity: SeverityLevel;   // critical, high, medium, low
  message: string;           // Message complet
  details?: string;          // Détails optionnels
  healthImpact?: string;     // Impact santé spécifique
  population?: string;       // Population concernée (ex: "Femmes enceintes")
  source: string;            // Sources scientifiques (ex: "EFSA (2023) | IARC (2023)")
}

/**
 * RED FLAG : Alerte critique (affichage prioritaire mobile)
 */
export interface RedFlag {
  name: string;              // Nom ingrédient (ex: "Huile de palme")
  code: string;              // Code unique (ex: "HUILE_DE_PALME_RAFFIN__E")
  severity: SeverityLevel;   // critical, high
  category: string;          // Catégorie issue
  impact?: string;           // Impact détaillé
  score: number;             // Score ingredient (0-100)
  sources: string;           // Sources scientifiques
}

/**
 * PROCESS : Processus industriel détecté (raffinage, hydrogénation, etc.)
 */
export interface Process {
  name: string;              // Ex: "Raffinage industriel"
  severity: SeverityLevel;   // high, medium, low
  description?: string;      // Description processus
  detectedOn: string;        // Ingrédient concerné (ex: "Huile de palme")
  impact?: string;           // Impact environnemental/santé
}

/**
 * RECOMMENDATION : Alternative suggérée
 */
export interface Recommendation {
  replace: string;           // Ingrédient à remplacer
  with: string;              // Alternative suggérée
  currentScore: number;      // Score actuel (0-100)
  suggestedScore: number;    // Score suggéré (0-100)
  gain: number;              // Gain de points
  why: string;               // Pourquoi cette alternative
  priority: PriorityLevel;   // high, medium, low
}

/**
 * KNOWLEDGE DATA : Output complet du KnowledgeEngine
 */
export interface KnowledgeData {
  issues: Issue[];
  redFlags: RedFlag[];
  processes: Process[];
  recommendations: Recommendation[];
}

/**
 * PROPS COMPOSANTS
 */
export interface KnowledgeInsightsProps {
  data: KnowledgeData | null;
  loading?: boolean;
  productName?: string;
  compact?: boolean;         // Mode mobile compact
}

export interface IssuesBannerProps {
  issues: Issue[];
  compact?: boolean;
}

export interface RedFlagAlertProps {
  redFlags: RedFlag[];
  compact?: boolean;
}

export interface ProcessesInfoProps {
  processes: Process[];
  compact?: boolean;
}

export interface RecommendationCardProps {
  recommendations: Recommendation[];
  compact?: boolean;
}
