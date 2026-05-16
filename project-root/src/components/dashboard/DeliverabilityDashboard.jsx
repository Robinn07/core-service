import React, { useEffect, useState } from 'react';
import { Shield, CheckCircle, XCircle, AlertTriangle, BarChart3, Mail } from 'lucide-react';

const DeliverabilityDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/domains/dashboard')
      .then(res => res.json())
      .then(json => {
        setData(json);
        setLoading(false);
      })
      .catch(err => console.error(err));
  }, []);

  if (loading) return <div className="p-8 text-center text-gray-500">Loading Deliverability Data...</div>;

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Email Deliverability & Reputation</h1>
          <p className="text-gray-600">Monitor your sender health and domain authentication status.</p>
        </header>

        {/* Reputation Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-500 font-medium">Bounce Rate</span>
              <BarChart3 className="text-blue-500" size={20} />
            </div>
            <div className={`text-2xl font-bold ${parseFloat(data.reputation.bounceRate) > 5 ? 'text-red-600' : 'text-green-600'}`}>
              {data.reputation.bounceRate}%
            </div>
            <p className="text-xs text-gray-400 mt-1">Target: &lt; 5.00%</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-500 font-medium">Spam Rate</span>
              <AlertTriangle className="text-orange-500" size={20} />
            </div>
            <div className={`text-2xl font-bold ${parseFloat(data.reputation.spamRate) > 0.1 ? 'text-red-600' : 'text-green-600'}`}>
              {data.reputation.spamRate}%
            </div>
            <p className="text-xs text-gray-400 mt-1">Target: &lt; 0.10%</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-500 font-medium">Total Delivered</span>
              <CheckCircle className="text-green-500" size={20} />
            </div>
            <div className="text-2xl font-bold text-gray-900">{data.reputation.delivered.toLocaleString()}</div>
            <p className="text-xs text-gray-400 mt-1">Last 30 days</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-500 font-medium">Total Bounced</span>
              <XCircle className="text-red-500" size={20} />
            </div>
            <div className="text-2xl font-bold text-gray-900">{data.reputation.bounced.toLocaleString()}</div>
            <p className="text-xs text-gray-400 mt-1">Last 30 days</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Domain Health */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                <h3 className="font-bold text-gray-800 flex items-center">
                  <Shield className="mr-2 text-blue-600" size={18} />
                  Verified Domains
                </h3>
              </div>
              <ul className="divide-y divide-gray-100">
                {data.domains.map(domain => (
                  <li key={domain.id} className="px-6 py-4 flex items-center justify-between">
                    <div>
                      <span className="text-gray-900 font-semibold">{domain.name}</span>
                      {domain.isDefault && (
                        <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded-full uppercase">
                          Default
                        </span>
                      )}
                    </div>
                    <div className="flex items-center">
                      {domain.status === 'verified' ? (
                        <span className="flex items-center text-green-600 text-sm font-medium">
                          <CheckCircle className="mr-1" size={16} /> Verified
                        </span>
                      ) : (
                        <span className="flex items-center text-orange-500 text-sm font-medium">
                          <AlertTriangle className="mr-1" size={16} /> Pending DNS
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Recommendations */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-bold text-gray-800 mb-4 flex items-center">
                <AlertTriangle className="mr-2 text-orange-500" size={18} />
                Recommendations
              </h3>
              <div className="space-y-4">
                {data.recommendations.length > 0 ? data.recommendations.map((rec, i) => (
                  <div key={i} className="flex p-3 bg-orange-50 rounded-lg border border-orange-100">
                    <AlertTriangle className="text-orange-600 mr-3 shrink-0" size={16} />
                    <p className="text-sm text-orange-800 leading-tight">{rec}</p>
                  </div>
                )) : (
                  <div className="flex p-3 bg-green-50 rounded-lg border border-green-100">
                    <CheckCircle className="text-green-600 mr-3 shrink-0" size={16} />
                    <p className="text-sm text-green-800">Your deliverability health is excellent. No actions needed.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeliverabilityDashboard;
