/**
 * ISSUES BANNER V2
 * 
 * Affichage groupé des problèmes détectés par severity
 * Basé sur KnowledgeEngine V3.2
 * Desktop uniquement (trop dense pour mobile)
 */

import React, { useState } from 'react';
import { AlertCircle, AlertTriangle, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { Issue, SeverityLevel } from '../../types/knowledge.types';

interface IssuesBannerV2Props {
  issues: Issue[];
}

export const IssuesBannerV2: React.FC<IssuesBannerV2Props> = ({ issues }) => {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    critical: true,
    high: true,
    medium: false,
    low: false
  });

  if (issues.length === 0) return null;

  // Grouper par severity
  const groupedIssues = {
    critical: issues.filter(i => i.severity === 'critical'),
    high: issues.filter(i => i.severity === 'high'),
    medium: issues.filter(i => i.severity === 'medium'),
    low: issues.filter(i => i.severity === 'low')
  };

  const toggleSection = (severity: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [severity]: !prev[severity]
    }));
  };

  // Configuration couleurs par severity
  const getSeverityConfig = (severity: SeverityLevel) => {
    const configs = {
      critical: {
        icon: AlertTriangle,
        label: 'Problèmes critiques',
        emoji: '🚨',
        bg: 'bg-red-50',
        border: 'border-red-300',
        text: 'text-red-900',
        iconColor: 'text-red-600',
        badge: 'bg-red-100 text-red-700'
      },
      high: {
        icon: AlertCircle,
        label: 'Problèmes importants',
        emoji: '⚠️',
        bg: 'bg-orange-50',
        border: 'border-orange-300',
        text: 'text-orange-900',
        iconColor: 'text-orange-600',
        badge: 'bg-orange-100 text-orange-700'
      },
      medium: {
        icon: AlertCircle,
        label: 'Points d\'attention',
        emoji: '⚡',
        bg: 'bg-yellow-50',
        border: 'border-yellow-300',
        text: 'text-yellow-900',
        iconColor: 'text-yellow-600',
        badge: 'bg-yellow-100 text-yellow-700'
      },
      low: {
        icon: Info,
        label: 'Informations',
        emoji: 'ℹ️',
        bg: 'bg-blue-50',
        border: 'border-blue-300',
        text: 'text-blue-900',
        iconColor: 'text-blue-600',
        badge: 'bg-blue-100 text-blue-700'
      }
    };
    return configs[severity];
  };

  // Render section
  const renderSection = (severity: SeverityLevel, issuesList: Issue[]) => {
    if (issuesList.length === 0) return null;

    const config = getSeverityConfig(severity);
    const Icon = config.icon;
    const isExpanded = expandedSections[severity];

    return (
      <div key={severity} className="space-y-2">
        {/* Header */}
        <button
          onClick={() => toggleSection(severity)}
          className={`w-full flex items-center justify-between p-3 ${config.bg} border ${config.border} rounded-lg hover:opacity-80 transition-all`}
        >
          <h4 className={`text-sm font-bold ${config.text} flex items-center gap-2`}>
            <Icon className={`w-4 h-4 ${config.iconColor}`} />
            {config.emoji} {config.label} ({issuesList.length})
          </h4>
          {isExpanded ? (
            <ChevronUp className={`w-5 h-5 ${config.iconColor}`} />
          ) : (
            <ChevronDown className={`w-5 h-5 ${config.iconColor}`} />
          )}
        </button>

        {/* Issues list */}
        {isExpanded && (
          <div className="space-y-2 pl-2">
            {issuesList.map((issue, idx) => (
              <div
                key={idx}
                className={`${config.bg} border ${config.border} rounded-lg p-3 shadow-sm`}
              >
                <div className="space-y-2">
                  {/* Catégorie + Message */}
                  <div className="flex items-start gap-2">
                    <span className={`inline-block px-2 py-1 bg-white rounded text-xs font-semibold ${config.text} border shrink-0`}>
                      {issue.category}
                    </span>
                    <p className={`text-sm ${config.text} font-medium leading-tight flex-1`}>
                      {issue.message}
                    </p>
                  </div>

                  {/* Details */}
                  {issue.details && (
                    <p className="text-xs text-neutral-600 leading-relaxed bg-white p-2 rounded border">
                      {issue.details}
                    </p>
                  )}

                  {/* Impact santé */}
                  {issue.healthImpact && (
                    <div className="flex items-start gap-2 bg-white p-2 rounded border">
                      <span className="text-xs font-semibold text-neutral-500 shrink-0">
                        💊 Impact santé :
                      </span>
                      <p className="text-xs text-neutral-700 leading-relaxed">
                        {issue.healthImpact}
                      </p>
                    </div>
                  )}

                  {/* Population concernée */}
                  {issue.population && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-neutral-500">
                        👥 Population :
                      </span>
                      <span className={`inline-block px-2 py-1 ${config.badge} rounded-full text-xs font-medium`}>
                        {issue.population}
                      </span>
                    </div>
                  )}

                  {/* Source */}
                  <div className="pt-2 border-t flex items-center gap-2">
                    <span className="text-xs font-semibold text-neutral-500">📚 Source :</span>
                    <span className="text-xs text-neutral-700 font-medium">{issue.source}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-3">
        <AlertCircle className="w-5 h-5 text-neutral-700" />
        <h3 className="text-base font-bold text-neutral-900">
          Problèmes détectés ({issues.length})
        </h3>
      </div>

      <div className="space-y-3">
        {renderSection('critical', groupedIssues.critical)}
        {renderSection('high', groupedIssues.high)}
        {renderSection('medium', groupedIssues.medium)}
        {renderSection('low', groupedIssues.low)}
      </div>
    </div>
  );
};
