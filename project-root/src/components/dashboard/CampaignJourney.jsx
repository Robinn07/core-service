import React from 'react';
import { useJourney } from '../../hooks/useAnalytics';
import { Share2, GitBranch, ArrowRight } from 'lucide-react';

const CampaignJourney = ({ orgId, token }) => {
  const { data, isLoading, error } = useJourney(orgId, token);

  if (isLoading) return <div className="p-12 text-center text-gray-400 animate-pulse">Computing Journey Matrix...</div>;
  if (error) return <div className="p-8 text-center text-red-500 bg-red-50 rounded-lg">Failed to load journey data: {error.message}</div>;
  if (!data || !data.nodes) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
        <h3 className="font-bold text-gray-800 flex items-center">
          <Share2 className="mr-2 text-indigo-600" size={18} />
          User Journey Mapping
        </h3>
        <span className="text-[10px] bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded uppercase">
          AI Generated
        </span>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Top Nodes */}
          <div>
            <h4 className="text-xs font-semibold text-gray-400 uppercase mb-4 tracking-wider">Key Interaction Points</h4>
            <div className="space-y-3">
              {data.nodes.slice(0, 5).map((node, i) => (
                <div key={i} className="flex items-center p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="w-2 h-2 rounded-full bg-indigo-500 mr-3" />
                  <span className="text-sm font-medium text-gray-700">{node.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Top Transitions */}
          <div>
            <h4 className="text-xs font-semibold text-gray-400 uppercase mb-4 tracking-wider">High-Velocity Transitions</h4>
            <div className="space-y-3">
              {data.links.sort((a, b) => b.value - a.value).slice(0, 5).map((link, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-indigo-50/30 rounded-lg border border-indigo-100/50">
                  <div className="flex items-center text-sm font-medium text-gray-700">
                    <span className="text-indigo-600">{data.nodes[link.source].name}</span>
                    <ArrowRight size={14} className="mx-2 text-gray-400" />
                    <span className="text-indigo-600">{data.nodes[link.target].name}</span>
                  </div>
                  <span className="text-xs font-bold text-indigo-700">
                    {Math.round(link.value)} users
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-center">
          <button className="flex items-center text-sm font-semibold text-indigo-600 hover:text-indigo-700">
            <GitBranch size={16} className="mr-2" />
            View Full Sankey Diagram & Attribution Report
          </button>
        </div>
      </div>
    </div>
  );
};

export default CampaignJourney;
