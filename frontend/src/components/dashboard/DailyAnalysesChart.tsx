// frontend/src/components/dashboard/DailyAnalysesChart.tsx
import React from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
  ComposedChart
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

interface DailyAnalysis {
  date: string;
  count: number;
  avgScore: number;
}

interface DailyAnalysesChartProps {
  data: DailyAnalysis[];
  period: number;
  viewType?: 'line' | 'bar' | 'area' | 'composed';
  className?: string;
}

export const DailyAnalysesChart: React.FC<DailyAnalysesChartProps> = ({
  data,
  period,
  viewType = 'composed',
  className = ''
}) => {
  // Formatter les données pour l'affichage
  const formattedData = data.map(item => ({
    ...item,
    displayDate: format(parseISO(item.date), 'd MMM', { locale: fr }),
    avgScoreRounded: Math.round(item.avgScore)
  }));

  // Custom Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-800">{label}</p>
          <p className="text-sm text-gray-600">
            Analyses : <span className="font-medium text-blue-600">{payload[0]?.value || 0}</span>
          </p>
          {payload[1] && (
            <p className="text-sm text-gray-600">
              Score moyen : <span className="font-medium text-green-600">{payload[1]?.value || 0}/100</span>
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  // Calculer les statistiques
  const totalAnalyses = data.reduce((sum, day) => sum + day.count, 0);
  const avgDailyAnalyses = Math.round(totalAnalyses / data.length || 0);
  const maxAnalyses = Math.max(...data.map(d => d.count));
  const avgGlobalScore = Math.round(
    data.reduce((sum, day) => sum + (day.avgScore || 0), 0) / data.filter(d => d.avgScore > 0).length || 0
  );

  // Render différents types de graphiques
  const renderChart = () => {
    switch (viewType) {
      case 'line':
        return (
          <LineChart data={formattedData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="displayDate" 
              tick={{ fontSize: 12 }}
              stroke="#6b7280"
            />
            <YAxis 
              yAxisId="left"
              tick={{ fontSize: 12 }}
              stroke="#6b7280"
              label={{ value: 'Nombre d\'analyses', angle: -90, position: 'insideLeft' }}
            />
            <YAxis 
              yAxisId="right" 
              orientation="right"
              domain={[0, 100]}
              tick={{ fontSize: 12 }}
              stroke="#6b7280"
              label={{ value: 'Score moyen', angle: 90, position: 'insideRight' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line 
              yAxisId="left"
              type="monotone" 
              dataKey="count" 
              stroke="#3b82f6" 
              strokeWidth={2}
              name="Analyses"
              dot={{ fill: '#3b82f6', r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line 
              yAxisId="right"
              type="monotone" 
              dataKey="avgScoreRounded" 
              stroke="#10b981" 
              strokeWidth={2}
              name="Score moyen"
              dot={{ fill: '#10b981', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        );

      case 'bar':
        return (
          <BarChart data={formattedData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="displayDate" 
              tick={{ fontSize: 12 }}
              stroke="#6b7280"
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              stroke="#6b7280"
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar 
              dataKey="count" 
              fill="#3b82f6" 
              name="Analyses"
              radius={[8, 8, 0, 0]}
            />
          </BarChart>
        );

      case 'area':
        return (
          <AreaChart data={formattedData}>
            <defs>
              <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
              </linearGradient>
              <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="displayDate" 
              tick={{ fontSize: 12 }}
              stroke="#6b7280"
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              stroke="#6b7280"
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Area 
              type="monotone" 
              dataKey="count" 
              stroke="#3b82f6" 
              fillOpacity={1} 
              fill="url(#colorCount)" 
              name="Analyses"
            />
          </AreaChart>
        );

      case 'composed':
      default:
        return (
          <ComposedChart data={formattedData}>
            <defs>
              <linearGradient id="colorBar" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.6}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="displayDate" 
              tick={{ fontSize: 12 }}
              stroke="#6b7280"
            />
            <YAxis 
              yAxisId="left"
              tick={{ fontSize: 12 }}
              stroke="#6b7280"
              label={{ value: 'Analyses', angle: -90, position: 'insideLeft' }}
            />
            <YAxis 
              yAxisId="right" 
              orientation="right"
              domain={[0, 100]}
              tick={{ fontSize: 12 }}
              stroke="#6b7280"
              label={{ value: 'Score', angle: 90, position: 'insideRight' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar 
              yAxisId="left"
              dataKey="count" 
              fill="url(#colorBar)" 
              name="Nombre d'analyses"
              radius={[8, 8, 0, 0]}
            />
            <Line 
              yAxisId="right"
              type="monotone" 
              dataKey="avgScoreRounded" 
              stroke="#10b981" 
              strokeWidth={3}
              name="Score moyen"
              dot={{ fill: '#10b981', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </ComposedChart>
        );
    }
  };

  return (
    <div className={`daily-analyses-chart ${className}`}>
      {/* En-tête avec statistiques */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-800">
            📊 Évolution sur {period} jours
          </h3>
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-blue-500 rounded-full mr-2" />
              <span className="text-gray-600">Analyses</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-2" />
              <span className="text-gray-600">Score</span>
            </div>
          </div>
        </div>
        
        {/* Mini statistiques */}
        <div className="grid grid-cols-4 gap-3 mb-4">
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500">Total analyses</p>
            <p className="text-lg font-semibold text-gray-800">{totalAnalyses}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500">Moyenne/jour</p>
            <p className="text-lg font-semibold text-gray-800">{avgDailyAnalyses}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500">Max/jour</p>
            <p className="text-lg font-semibold text-gray-800">{maxAnalyses}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500">Score moyen</p>
            <p className="text-lg font-semibold text-green-600">{avgGlobalScore}/100</p>
          </div>
        </div>
      </div>

      {/* Graphique */}
      <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
        <ResponsiveContainer width="100%" height={300}>
          {renderChart()}
        </ResponsiveContainer>
      </div>

      {/* Message si pas de données */}
      {data.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>Aucune donnée disponible pour cette période</p>
        </div>
      )}
    </div>
  );
};

export default DailyAnalysesChart;