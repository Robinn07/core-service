import { useState } from 'react';

export default function ApiKeyCard({ tenantData, onRegenerate }) {
  const [showKey, setShowKey] = useState(false);
  const [isRotating, setIsRotating] = useState(false);

  const handleRegenerate = async () => {
    if (!confirm("Are you sure? Existing integrations using this key will break immediately.")) return;
    
    setIsRotating(true);
    await onRegenerate(); // Calls the backend function we discussed
    setIsRotating(false);
  };

  const usagePercent = (tenantData.currentUsage / tenantData.usageLimit) * 100;

  return (
    <div className="p-6 bg-white border rounded-lg shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-lg font-bold">API Configuration</h3>
          <p className="text-sm text-gray-500">Authenticate your B2B requests via GetLoopx.</p>
        </div>
        <button 
          onClick={handleRegenerate}
          disabled={isRotating}
          className="text-xs border border-red-200 text-red-600 px-3 py-1 rounded hover:bg-red-50 disabled:opacity-50"
        >
          {isRotating ? "Regenerating..." : "Regenerate Key"}
        </button>
      </div>
      
      <div className="flex items-center space-x-2 bg-gray-50 p-3 rounded border font-mono">
        <code className="flex-1 truncate">
          {showKey ? tenantData.apiKey : "••••••••••••••••••••••••••••••••"}
        </code>
        <button 
          onClick={() => setShowKey(!showKey)}
          className="text-blue-600 text-sm font-medium hover:underline"
        >
          {showKey ? "Hide" : "Show"}
        </button>
      </div>

      <div className="mt-8">
        <div className="flex justify-between text-sm mb-2">
          <span className="font-medium text-gray-700">Monthly Usage Quota</span>
          <span className="text-gray-500">{tenantData.currentUsage.toLocaleString()} / {tenantData.usageLimit.toLocaleString()}</span>
        </div>
        <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-500 ${usagePercent > 90 ? 'bg-red-500' : 'bg-blue-600'}`}
            style={{ width: `${usagePercent}%` }}
          />
        </div>
        <p className="text-xs text-gray-400 mt-2">Your quota resets on the 1st of every month.</p>
      </div>
    </div>
  );
}