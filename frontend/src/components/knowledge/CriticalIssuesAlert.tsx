import React, { useState } from 'react';
import { AlertTriangle, XCircle, AlertCircle, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';

interface Issue {
  ingredient: string;
  score: number;
  category?: string;
  details: string;
  sources?: Array<{ name: string; url?: string; year?: string }>;
  level: 'critical' | 'high' | 'moderate';
}

interface CriticalIssuesAlertProps {
  criticalIssues?: Issue[];
  highIssues?: Issue[];
  moderateIssues?: Issue[];
  scoreImpact?: number;
}

export const CriticalIssuesAlert: React.FC<CriticalIssuesAlertProps> = ({
  criticalIssues = [],
  highIssues = [],
  moderateIssues = [],
  scoreImpact = 0
}) => {
  const [expandedSections, setExpandedSections] = useState({
    critical: true,
    high: false,
    moderate: false
  });

  const hasIssues = criticalIssues.length > 0 || highIssues.length > 0 || moderateIssues.length > 0;
  
  if (!hasIssues) return null;

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  return (
    <div className="space-y-4">
      {scoreImpact < 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 shadow-soft">
          <p className="text-sm font-semibold text-red-900 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Impact sur le score : <span className="font-bold">{scoreImpact} points</span>
          </p>
        </div>
      )}

      {criticalIssues.length > 0 && (
        <div className="space-y-3">
          <button
            onClick={() => toggleSection('critical')}
            className="w-full flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
          >
            <h3 className="text-sm font-bold text-red-900 flex items-center gap-2">
              <XCircle className="w-4 h-4" />
              Problèmes critiques détectés ({criticalIssues.length})
            </h3>
            {expandedSections.critical ? (
              <ChevronUp className="w-5 h-5 text-red-700" />
            ) : (
              <ChevronDown className="w-5 h-5 text-red-700" />
            )}
          </button>
          
          {expandedSections.critical && (
            <div className="space-y-3 pl-2">
              {criticalIssues.map((issue, idx) => (
                <div key={idx} className="bg-red-50 border border-red-200 rounded-lg p-4 shadow-soft">
                  <div className="flex items-start gap-3">
                    <XCircle className="w-5 h-5 text-red-900 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <h4 className="font-semibold text-red-900 text-sm">{issue.ingredient}</h4>
                        <span className="text-xs font-mono bg-white px-2 py-1 rounded border">{issue.score}/100</span>
                      </div>
                      {issue.category && (
                        <span className="inline-block px-2 py-0.5 bg-white rounded text-xs font-medium text-neutral-600 border">{issue.category}</span>
                      )}
                      <p className="text-sm text-neutral-700 leading-relaxed">{issue.details}</p>
                      {issue.sources && issue.sources.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-2 border-t">
                          {issue.sources.map((source, sidx) => (
                            <span key={sidx} className="inline-flex items-center gap-1 px-2 py-1 bg-white rounded-full text-xs text-neutral-600 border">
                              📚 {source.name} {source.year && `(${source.year})`}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {highIssues.length > 0 && (
        <div className="space-y-3">
          <button
            onClick={() => toggleSection('high')}
            className="w-full flex items-center justify-between p-3 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 transition-colors"
          >
            <h3 className="text-sm font-bold text-orange-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Problèmes élevés ({highIssues.length})
            </h3>
            {expandedSections.high ? (
              <ChevronUp className="w-5 h-5 text-orange-700" />
            ) : (
              <ChevronDown className="w-5 h-5 text-orange-700" />
            )}
          </button>

          {expandedSections.high && (
            <div className="space-y-3 pl-2">
              {highIssues.map((issue, idx) => (
                <div key={idx} className="bg-orange-50 border border-orange-200 rounded-lg p-4 shadow-soft">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-orange-900 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <h4 className="font-semibold text-orange-900 text-sm">{issue.ingredient}</h4>
                        <span className="text-xs font-mono bg-white px-2 py-1 rounded border">{issue.score}/100</span>
                      </div>
                      {issue.category && (
                        <span className="inline-block px-2 py-0.5 bg-white rounded text-xs font-medium text-neutral-600 border">{issue.category}</span>
                      )}
                      <p className="text-sm text-neutral-700 leading-relaxed">{issue.details}</p>
                      {issue.sources && issue.sources.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-2 border-t">
                          {issue.sources.map((source, sidx) => (
                            <span key={sidx} className="inline-flex items-center gap-1 px-2 py-1 bg-white rounded-full text-xs text-neutral-600 border">
                              📚 {source.name} {source.year && `(${source.year})`}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {moderateIssues.length > 0 && (
        <div className="space-y-3">
          <button
            onClick={() => toggleSection('moderate')}
            className="w-full flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg hover:bg-yellow-100 transition-colors"
          >
            <h3 className="text-sm font-bold text-yellow-900 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Points d attention ({moderateIssues.length})
            </h3>
            {expandedSections.moderate ? (
              <ChevronUp className="w-5 h-5 text-yellow-700" />
            ) : (
              <ChevronDown className="w-5 h-5 text-yellow-700" />
            )}
          </button>

          {expandedSections.moderate && (
            <div className="space-y-3 pl-2">
              {moderateIssues.map((issue, idx) => (
                <div key={idx} className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 shadow-soft">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-yellow-900 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <h4 className="font-semibold text-yellow-900 text-sm">{issue.ingredient}</h4>
                        <span className="text-xs font-mono bg-white px-2 py-1 rounded border">{issue.score}/100</span>
                      </div>
                      {issue.category && (
                        <span className="inline-block px-2 py-0.5 bg-white rounded text-xs font-medium text-neutral-600 border">{issue.category}</span>
                      )}
                      <p className="text-sm text-neutral-700 leading-relaxed">{issue.details}</p>
                      {issue.sources && issue.sources.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-2 border-t">
                          {issue.sources.map((source, sidx) => (
                            <span key={sidx} className="inline-flex items-center gap-1 px-2 py-1 bg-white rounded-full text-xs text-neutral-600 border">
                              📚 {source.name} {source.year && `(${source.year})`}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};