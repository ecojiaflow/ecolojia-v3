import React from 'react';

interface EnvImpactProps {
  biodegradability?: string;
  ecoDesign?: string;
  certifications?: string[];
}

export function EnvImpact({ biodegradability, ecoDesign, certifications }: EnvImpactProps) {
  return (
    <div className="space-y-4">
      {biodegradability && (
        <div className="flex items-start gap-3">
          <span className="text-2xl">🌿</span>
          <div className="flex-1">
            <div className="font-semibold text-gray-800 mb-1">Biodégradabilité</div>
            <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
              biodegradability.toLowerCase().includes('excellent') 
                ? 'bg-green-100 text-green-700' 
                : 'bg-gray-100 text-gray-700'
            }`}>
              {biodegradability}
            </div>
          </div>
        </div>
      )}

      {ecoDesign && (
        <div className="flex items-start gap-3">
          <span className="text-2xl">📦</span>
          <div className="flex-1">
            <div className="font-semibold text-gray-800 mb-1">Éco-conception</div>
            <div className="text-sm text-gray-600">{ecoDesign}</div>
          </div>
        </div>
      )}

      {certifications && certifications.length > 0 && (
        <div className="flex items-start gap-3">
          <span className="text-2xl">✅</span>
          <div className="flex-1">
            <div className="font-semibold text-gray-800 mb-2">Certifications</div>
            <div className="flex flex-wrap gap-2">
              {certifications.map((cert, idx) => (
                <span key={idx} className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                  {cert}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}