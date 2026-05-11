import React from 'react';

const HealthScoreCard = ({ atRiskData, isLoading }) => {
  if (isLoading) return <div className="p-6 bg-white shadow rounded-lg animate-pulse">Loading Health...</div>;
  if (!atRiskData) return null;

  const { at_risk_users, count } = atRiskData;
  
  // Simple heuristic for "Health Score"
  // If we have many at-risk users relative to total (we might need total user count here)
  // Let's assume a static baseline for now or just display the count.
  const isHealthy = count < 5; 

  return (
    <div className="p-6 bg-white shadow rounded-lg border-l-4 border-blue-500">
      <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wider">User Behavioral Health</h3>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-3xl font-bold text-gray-900">{100 - (count * 2)}</span>
        <span className="text-sm text-gray-500">/ 100</span>
      </div>
      
      <div className="mt-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">At-Risk Users</span>
          <span className={`font-semibold ${count > 0 ? 'text-red-600' : 'text-green-600'}`}>
            {count}
          </span>
        </div>
        <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full ${isHealthy ? 'bg-green-500' : 'bg-red-500'}`} 
            style={{ width: `${Math.max(0, 100 - (count * 2))}%` }}
          />
        </div>
      </div>
      
      <p className="mt-4 text-xs text-gray-400 italic">
        *Based on zero activity in the last 14 days.
      </p>
    </div>
  );
};

export default HealthScoreCard;
