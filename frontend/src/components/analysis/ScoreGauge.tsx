import React from "react";

interface Props {
  label: string;
  value: number;
}

export const ScoreGauge: React.FC<Props> = ({ label, value }) => {
  const radius = 50;
  const stroke = 8;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const progress = Math.min(Math.max(value, 0), 100); // clamp 0-100
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="flex flex-col items-center bg-white rounded-xl shadow-sm p-4">
      <svg height={radius * 2} width={radius * 2}>
        <circle
          stroke="#e5e7eb"
          fill="transparent"
          strokeWidth={stroke}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        <circle
          stroke="#10b981"
          fill="transparent"
          strokeWidth={stroke}
          strokeDasharray={`${circumference} ${circumference}`}
          style={{ strokeDashoffset, transition: "stroke-dashoffset 0.5s" }}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
          strokeLinecap="round"
        />
        {/* Texte centré */}
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dy=".3em"
          className="font-bold text-gray-700"
          fontSize="18"
        >
          {progress}%
        </text>
      </svg>
      <span className="mt-2 text-sm text-gray-600">{label}</span>
    </div>
  );
};
