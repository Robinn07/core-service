import React, { useState } from 'react';
import { Settings, MousePointer, Clock, Scroll, Layout, Code, Copy, Check } from 'lucide-react';

const PopupConfigCard = ({ form, onUpdate }) => {
  const [config, setConfig] = useState(form.popUpConfig || {
    type: 'MODAL',
    trigger: 'TIME',
    triggerValue: 5,
    frequency: 'ONCE_PER_SESSION'
  });
  const [copied, setCopy] = useState(false);

  const baseUrl = window.location.origin.replace('3001', '4000'); // Assuming crm-service is on 4000
  const snippet = `<script src="${baseUrl}/api/public/js/loopx.js?org=${form.orgId}"></script>`;

  const handleSave = () => {
    onUpdate({ popUpConfig: config, isPopUp: true });
  };

  const copySnippet = () => {
    navigator.clipboard.writeText(snippet);
    setCopy(true);
    setTimeout(() => setCopy(false), 2000);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
        <h3 className="font-bold text-gray-800 flex items-center">
          <Settings className="mr-2 text-blue-600" size={18} />
          Pop-up Configuration
        </h3>
        <button
          onClick={handleSave}
          className="bg-blue-600 text-white px-4 py-1.5 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          Save Behavior
        </button>
      </div>

      <div className="p-6 space-y-8">
        {/* Type Selection */}
        <div>
          <label className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4 block">Pop-up Style</label>
          <div className="grid grid-cols-3 gap-4">
            {['MODAL', 'BAR', 'SLIDEIN'].map(type => (
              <button
                key={type}
                onClick={() => setConfig({ ...config, type })}
                className={`p-4 border-2 rounded-lg flex flex-col items-center gap-2 transition-all ${
                  config.type === type ? 'border-blue-500 bg-blue-50' : 'border-gray-100 hover:border-gray-200'
                }`}
              >
                <Layout size={24} className={config.type === type ? 'text-blue-600' : 'text-gray-400'} />
                <span className={`text-xs font-bold ${config.type === type ? 'text-blue-700' : 'text-gray-500'}`}>{type}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Trigger Logic */}
        <div>
          <label className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4 block">Display Trigger</label>
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-3 border rounded-lg border-gray-100">
              <Clock size={20} className="text-orange-500" />
              <div className="flex-grow">
                <div className="text-sm font-bold">Timed Delay</div>
                <div className="text-xs text-gray-400">Show after a set number of seconds</div>
              </div>
              <input
                type="number"
                value={config.trigger === 'TIME' ? config.triggerValue : ''}
                onChange={(e) => setConfig({ ...config, trigger: 'TIME', triggerValue: parseInt(e.target.value) })}
                placeholder="5"
                className="w-16 p-1 border rounded text-center text-sm"
              />
              <span className="text-xs text-gray-500">sec</span>
            </div>

            <div className="flex items-center gap-4 p-3 border rounded-lg border-gray-100">
              <Scroll size={20} className="text-purple-500" />
              <div className="flex-grow">
                <div className="text-sm font-bold">Scroll Depth</div>
                <div className="text-xs text-gray-400">Show after user scrolls percentage of page</div>
              </div>
              <input
                type="number"
                value={config.trigger === 'SCROLL' ? config.triggerValue : ''}
                onChange={(e) => setConfig({ ...config, trigger: 'SCROLL', triggerValue: parseInt(e.target.value) })}
                placeholder="50"
                className="w-16 p-1 border rounded text-center text-sm"
              />
              <span className="text-xs text-gray-500">%</span>
            </div>

            <div 
                onClick={() => setConfig({ ...config, trigger: 'EXIT_INTENT', triggerValue: 0 })}
                className={`flex items-center gap-4 p-3 border rounded-lg cursor-pointer transition-colors ${
                    config.trigger === 'EXIT_INTENT' ? 'border-blue-400 bg-blue-50' : 'border-gray-100'
                }`}
            >
              <MousePointer size={20} className="text-green-500" />
              <div className="flex-grow">
                <div className="text-sm font-bold">Exit Intent</div>
                <div className="text-xs text-gray-400">Show when user moves mouse to close the tab</div>
              </div>
              {config.trigger === 'EXIT_INTENT' && <Check size={16} className="text-blue-600" />}
            </div>
          </div>
        </div>

        {/* Installation Snippet */}
        <div className="bg-gray-900 rounded-lg p-4 relative">
            <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-[10px] font-bold uppercase flex items-center">
                    <Code size={12} className="mr-1" /> Installation Snippet
                </span>
                <button onClick={copySnippet} className="text-gray-400 hover:text-white transition-colors">
                    {copied ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
                </button>
            </div>
            <code className="text-blue-300 text-xs break-all block">
                {snippet}
            </code>
        </div>
      </div>
    </div>
  );
};

export default PopupConfigCard;
