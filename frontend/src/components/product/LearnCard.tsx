import React from "react";
import { 
  Scale, Candy, Beef, Droplet, Factory, Sparkles,
  ChevronRight, Clock, BookOpen, Lightbulb, AlertCircle,
  CheckCircle, XCircle
} from "lucide-react";

/**
 * LearnCard.tsx — Composant Micro-fiche Educative
 * Version: 1.0.0
 */

// Types
interface LearningCardSummary {
  id: string;
  title: string;
  subtitle?: string;
  readTime: number;
  icon: string;
  color: string;
  reason?: string;
}

interface Section {
  id: string;
  title: string;
  type: string;
  content: any;
}

interface Rule {
  id: string;
  title: string;
  description: string;
  icon?: string;
}

interface Myth {
  myth: string;
  reality: string;
}

interface PracticalTip {
  situation: string;
  tip: string;
}

interface Source {
  id: string;
  name: string;
  year: number;
  title: string;
}

interface FullLearningCard {
  id: string;
  title: string;
  subtitle?: string;
  readTime: number;
  icon: string;
  color: string;
  sections: Section[];
  rules: Rule[];
  myths: Myth[];
  practicalTips?: PracticalTip[];
  sources: Source[];
  relatedCardsSummary?: LearningCardSummary[];
}

// Props
interface LearnCardPreviewProps {
  card: LearningCardSummary;
  onClick: () => void;
}

interface LearnCardFullProps {
  card: FullLearningCard;
  onClose: () => void;
  onNavigate?: (cardId: string) => void;
}

// Icon mapping
const iconMap: Record<string, React.ElementType> = {
  scale: Scale,
  candy: Candy,
  beef: Beef,
  droplet: Droplet,
  factory: Factory,
  grain: Sparkles,
};

// Color mapping
const colorMap: Record<string, { bg: string; text: string; light: string; border: string }> = {
  emerald: { bg: "bg-emerald-500", text: "text-emerald-700", light: "bg-emerald-50", border: "border-emerald-200" },
  amber: { bg: "bg-amber-500", text: "text-amber-700", light: "bg-amber-50", border: "border-amber-200" },
  rose: { bg: "bg-rose-500", text: "text-rose-700", light: "bg-rose-50", border: "border-rose-200" },
  orange: { bg: "bg-orange-500", text: "text-orange-700", light: "bg-orange-50", border: "border-orange-200" },
  purple: { bg: "bg-purple-500", text: "text-purple-700", light: "bg-purple-50", border: "border-purple-200" },
  slate: { bg: "bg-slate-500", text: "text-slate-700", light: "bg-slate-50", border: "border-slate-200" },
};

/**
 * Preview Card (pour les suggestions)
 */
export const LearnCardPreview: React.FC<LearnCardPreviewProps> = ({ card, onClick }) => {
  const Icon = iconMap[card.icon] || BookOpen;
  const colors = colorMap[card.color] || colorMap.slate;

  return (
    <button
      onClick={onClick}
      className={`w-full p-3 rounded-xl ${colors.light} ${colors.border} border flex items-center gap-3 hover:shadow-md transition-all active:scale-[0.98]`}
    >
      <div className={`w-10 h-10 rounded-lg ${colors.bg} flex items-center justify-center flex-shrink-0`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div className="flex-1 text-left">
        <h4 className="font-semibold text-gray-800 text-sm">{card.title}</h4>
        {card.reason && (
          <p className="text-xs text-gray-500 mt-0.5">{card.reason}</p>
        )}
      </div>
      <div className="flex items-center gap-1 text-gray-400">
        <Clock className="w-3.5 h-3.5" />
        <span className="text-xs">{card.readTime} min</span>
        <ChevronRight className="w-4 h-4 ml-1" />
      </div>
    </button>
  );
};

/**
 * Full Card Content (pour le drawer)
 */
export const LearnCardFull: React.FC<LearnCardFullProps> = ({ card, onClose, onNavigate }) => {
  const Icon = iconMap[card.icon] || BookOpen;
  const colors = colorMap[card.color] || colorMap.slate;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className={`${colors.light} px-4 py-4 border-b ${colors.border}`}>
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl ${colors.bg} flex items-center justify-center`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="font-bold text-gray-900 text-lg">{card.title}</h2>
            {card.subtitle && (
              <p className="text-sm text-gray-600">{card.subtitle}</p>
            )}
          </div>
          <div className="flex items-center gap-1 text-gray-500 bg-white px-2 py-1 rounded-full">
            <Clock className="w-3.5 h-3.5" />
            <span className="text-xs font-medium">{card.readTime} min</span>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
        {/* Sections */}
        {card.sections.map((section) => (
          <SectionRenderer key={section.id} section={section} colors={colors} />
        ))}

        {/* Rules */}
        {card.rules && card.rules.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-amber-500" />
              <h3 className="font-semibold text-gray-800">Les bons reflexes</h3>
            </div>
            <div className="space-y-2">
              {card.rules.map((rule) => (
                <div key={rule.id} className="p-3 bg-amber-50 rounded-lg border border-amber-100">
                  <h4 className="font-medium text-amber-800 text-sm">{rule.title}</h4>
                  <p className="text-xs text-amber-700 mt-1">{rule.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Myths */}
        {card.myths && card.myths.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-800">Mythes vs Realite</h3>
            <div className="space-y-3">
              {card.myths.map((myth, index) => (
                <div key={index} className="rounded-lg border border-gray-100 overflow-hidden">
                  <div className="p-3 bg-red-50 flex items-start gap-2">
                    <XCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-800">{myth.myth}</p>
                  </div>
                  <div className="p-3 bg-green-50 flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-green-800">{myth.reality}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Practical Tips */}
        {card.practicalTips && card.practicalTips.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-800">En pratique</h3>
            <div className="space-y-2">
              {card.practicalTips.map((tip, index) => (
                <div key={index} className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                  <p className="text-xs font-medium text-blue-700 mb-1">{tip.situation}</p>
                  <p className="text-sm text-blue-900">{tip.tip}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sources */}
        {card.sources && card.sources.length > 0 && (
          <div className="pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-500 mb-2">Sources</p>
            <div className="space-y-1">
              {card.sources.map((source) => (
                <p key={source.id} className="text-xs text-gray-400">
                  {source.name} ({source.year}) - {source.title}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Related Cards */}
        {card.relatedCardsSummary && card.relatedCardsSummary.length > 0 && onNavigate && (
          <div className="pt-4 border-t border-gray-100">
            <p className="text-sm font-medium text-gray-700 mb-3">Pour aller plus loin</p>
            <div className="space-y-2">
              {card.relatedCardsSummary.map((related) => (
                <button
                  key={related.id}
                  onClick={() => onNavigate(related.id)}
                  className="w-full p-2 bg-gray-50 rounded-lg flex items-center gap-2 hover:bg-gray-100 transition-colors"
                >
                  <BookOpen className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-700 flex-1 text-left">{related.title}</span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Section Renderer
 */
const SectionRenderer: React.FC<{ section: Section; colors: any }> = ({ section, colors }) => {
  const { type, title, content } = section;

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-gray-800">{title}</h3>
      
      {type === "visual" && content.items && (
        <div className="space-y-2">
          {content.description && (
            <p className="text-sm text-gray-600">{content.description}</p>
          )}
          <div className="grid grid-cols-2 gap-2">
            {content.items.map((item: any, i: number) => (
              <div key={i} className={`p-3 rounded-lg bg-${item.color}-50 border border-${item.color}-100`}>
                <div className="font-bold text-lg text-gray-800">{item.portion}</div>
                <div className="font-medium text-sm text-gray-700">{item.label}</div>
                <div className="text-xs text-gray-500 mt-1">{item.detail}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {type === "comparison" && content.comparisons && (
        <div className="space-y-2">
          {content.description && (
            <p className="text-sm text-gray-600 mb-3">{content.description}</p>
          )}
          {content.comparisons.map((comp: any, i: number) => (
            <div key={i} className={`p-3 rounded-lg border-l-4 ${
              comp.color === "red" ? "border-l-red-500 bg-red-50" :
              comp.color === "green" ? "border-l-green-500 bg-green-50" :
              comp.color === "amber" ? "border-l-amber-500 bg-amber-50" :
              "border-l-gray-300 bg-gray-50"
            }`}>
              <h4 className="font-medium text-gray-800 text-sm">{comp.label}</h4>
              <p className="text-xs text-gray-600 mt-1">{comp.detail}</p>
              {comp.examples && (
                <p className="text-xs text-gray-500 mt-1 italic">Ex: {comp.examples}</p>
              )}
              {comp.recommendation && (
                <p className="text-xs font-medium text-gray-700 mt-2">{comp.recommendation}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {type === "explanation" && (
        <div className="space-y-2">
          {content.mainPoint && (
            <p className="text-sm text-gray-700 font-medium bg-gray-50 p-3 rounded-lg">
              {content.mainPoint}
            </p>
          )}
          {content.points && (
            <ul className="space-y-1.5">
              {content.points.map((point: string, i: number) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-2 flex-shrink-0" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          )}
          {content.factors && (
            <div className="grid gap-2">
              {content.factors.map((factor: any, i: number) => (
                <div key={i} className="p-2 bg-gray-50 rounded-lg">
                  <span className="font-medium text-gray-800 text-sm">{factor.factor}</span>
                  <span className="text-gray-600 text-sm"> : {factor.effect}</span>
                  {factor.example && (
                    <p className="text-xs text-gray-500 mt-0.5 italic">Ex: {factor.example}</p>
                  )}
                </div>
              ))}
            </div>
          )}
          {content.nuance && (
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-100 mt-2">
              <p className="text-sm text-blue-800">{content.nuance}</p>
            </div>
          )}
        </div>
      )}

      {type === "list" && content.items && (
        <div className="space-y-3">
          {content.description && (
            <p className="text-sm text-gray-600">{content.description}</p>
          )}
          {content.items.map((item: any, i: number) => (
            <div key={i} className="p-3 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-800 text-sm mb-1">{item.title}</h4>
              <ul className="space-y-1">
                {item.points.map((point: string, j: number) => (
                  <li key={j} className="flex items-start gap-2 text-xs text-gray-600">
                    <span className="w-1 h-1 rounded-full bg-gray-400 mt-1.5 flex-shrink-0" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {type === "key-figures" && content.figures && (
        <div className="grid gap-3">
          {content.figures.map((fig: any, i: number) => (
            <div key={i} className="p-3 bg-gradient-to-r from-gray-50 to-white rounded-lg border border-gray-100">
              <div className="text-2xl font-bold text-gray-800">{fig.value}</div>
              <div className="text-sm font-medium text-gray-700">{fig.label}</div>
              {fig.detail && <div className="text-xs text-gray-500 mt-1">{fig.detail}</div>}
            </div>
          ))}
        </div>
      )}

      {type === "scale" && content.levels && (
        <div className="space-y-2">
          {content.description && (
            <p className="text-sm text-gray-600 mb-3">{content.description}</p>
          )}
          {content.levels.map((level: any, i: number) => (
            <div key={i} className={`p-3 rounded-lg border-l-4 ${
              level.color === "green" ? "border-l-green-500 bg-green-50" :
              level.color === "lime" ? "border-l-lime-500 bg-lime-50" :
              level.color === "amber" ? "border-l-amber-500 bg-amber-50" :
              level.color === "red" ? "border-l-red-500 bg-red-50" :
              "border-l-gray-300 bg-gray-50"
            }`}>
              <div className="flex items-center gap-2">
                <span className="font-bold text-gray-800">NOVA {level.level}</span>
                <span className="text-sm text-gray-600">- {level.label}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">{level.examples}</p>
            </div>
          ))}
        </div>
      )}

      {type === "ranking" && content.items && (
        <div className="space-y-2">
          {content.description && (
            <p className="text-sm text-gray-600 mb-3">{content.description}</p>
          )}
          {content.items.map((item: any, i: number) => (
            <div key={i} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
              <span className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                {item.rank}
              </span>
              <span className="flex-1 text-sm text-gray-700">{item.item}</span>
              <span className="text-sm font-medium text-gray-500">{item.percent}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LearnCardFull;
