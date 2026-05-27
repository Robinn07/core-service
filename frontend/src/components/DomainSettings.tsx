import { AlertCircle, CheckCircle2, Copy, ExternalLink, Globe, Loader2, Plus, RefreshCw, ShieldCheck, Smartphone, X } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "../lib/api";

export function DomainSettings() {
  const [domains, setDomains] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingDomain, setAddingDomain] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newDomainName, setNewDomainName] = useState("");
  const [selectedDomain, setSelectedDomain] = useState<any>(null);
  const [dnsRecords, setDnsRecords] = useState<any>(null);
  const [verifying, setVerifying] = useState(false);
  const [dashboard, setDashboard] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([fetchDomains(), fetchDashboard()]);
    } catch (err: any) {
      setError("Failed to load domain data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fetchDomains = async () => {
    const data = await api.get("/domains");
    setDomains(data);
  };

  const fetchDashboard = async () => {
    try {
      const data = await api.get("/domains/dashboard");
      setDashboard(data);
    } catch (err) {
      console.warn("Dashboard metrics unavailable");
    }
  };

  const handleAddDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    const domain = newDomainName.trim().toLowerCase();
    if (!domain) return;
    
    // Simple domain validation
    if (!domain.includes('.') || domain.length < 4) {
      alert("Please enter a valid domain name (e.g., example.com)");
      return;
    }

    setAddingDomain(true);
    setError(null);
    try {
      const result = await api.post("/domains", { domainName: domain });
      setDomains(prev => [...prev, result]);
      setNewDomainName("");
      setShowAddForm(false);
      setSelectedDomain(result);
      fetchDnsRecords(result.id);
      fetchDashboard(); // Refresh metrics
    } catch (err: any) {
      console.error("Add domain error:", err);
      setError(err.message || "Failed to add domain. Ensure the name is valid and not already registered.");
    } finally {
      setAddingDomain(false);
    }
  };

  const fetchDnsRecords = async (domainId: string) => {
    try {
      const data = await api.get(`/domains/${domainId}/dns`);
      setDnsRecords(data);
    } catch (err) {
      console.error("DNS fetch error:", err);
    }
  };

  const handleVerify = async (domainId: string) => {
    setVerifying(true);
    try {
      const updatedDomain = await api.post(`/domains/${domainId}/verify`, {});
      if (updatedDomain.verificationStatus === 'verified') {
        alert("Success! Your domain has been verified.");
      } else {
        alert("Verification check initiated. If you just added the DNS records, please allow up to 48 hours for propagation.");
      }
      fetchDomains();
    } catch (err: any) {
      alert(err.message || "Verification check failed.");
    } finally {
      setVerifying(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-4">
        <Loader2 className="animate-spin text-indigo-600" size={32} />
        <p className="text-sm font-medium text-slate-500">Loading domain settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Debug Info (Helpful for ensuring latest code is running) */}
      <div className="flex justify-end">
        <span className="text-[10px] font-mono text-slate-400">Component v1.2-Overhaul</span>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100 flex items-center gap-3 text-rose-800 text-sm animate-in fade-in zoom-in">
          <AlertCircle size={18} />
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto hover:bg-rose-100 p-1 rounded-lg">
            <X size={16} />
          </button>
        </div>
      )}

      {dashboard && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Domain Reputation</div>
            <div className="flex items-end gap-2">
              <div className={`text-2xl font-black ${parseFloat(dashboard.reputation.bounceRate) > 5 ? 'text-rose-600' : 'text-emerald-600'}`}>
                {parseFloat(dashboard.reputation.bounceRate) > 5 ? 'Poor' : 'Healthy'}
              </div>
              <div className="text-xs text-slate-400 mb-1">({dashboard.reputation.totalSent} sent)</div>
            </div>
          </div>
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Bounce Rate</div>
            <div className="text-2xl font-black text-slate-900">{dashboard.reputation.bounceRate}%</div>
          </div>
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Spam Complaints</div>
            <div className="text-2xl font-black text-slate-900">{dashboard.reputation.spamRate}%</div>
          </div>
        </div>
      )}

      {dashboard && dashboard.recommendations.length > 0 && (
        <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100 flex flex-col gap-2">
          <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
            <AlertCircle size={14} />
            Recommendations
          </div>
          <ul className="space-y-1">
            {dashboard.recommendations.map((rec: string, idx: number) => (
              <li key={idx} className="text-xs text-indigo-900 font-medium">• {rec}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-slate-900">Verified Domains</h3>
          <button 
            onClick={() => setShowAddForm(!showAddForm)}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition flex items-center gap-2 ${
              showAddForm ? "bg-slate-100 text-slate-600 hover:bg-slate-200" : "bg-slate-900 text-white hover:bg-slate-800"
            }`}
          >
            {showAddForm ? <X size={14} /> : <Plus size={14} />}
            {showAddForm ? "Cancel" : "Add Domain"}
          </button>
        </div>

        {showAddForm && (
          <form onSubmit={handleAddDomain} className="mb-8 p-6 rounded-2xl bg-slate-50 border border-slate-100 animate-in slide-in-from-top-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Domain Name</label>
                <input
                  type="text"
                  placeholder="e.g. example.com"
                  value={newDomainName}
                  onChange={(e) => setNewDomainName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-500 shadow-sm"
                  autoFocus
                  required
                />
              </div>
              <div className="flex items-end">
                <button 
                  type="submit"
                  disabled={addingDomain}
                  className="w-full md:w-auto h-[46px] rounded-xl bg-indigo-600 px-8 text-sm font-bold text-white hover:bg-indigo-700 transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-indigo-100"
                >
                  {addingDomain ? <Loader2 size={16} className="animate-spin" /> : <Globe size={16} />}
                  Connect Domain
                </button>
              </div>
            </div>
          </form>
        )}
        
        <div className="space-y-4">
          {domains.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {domains.map((domain) => (
                <div key={domain.id} className="py-4 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-xl ${domain.verificationStatus === 'verified' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                      <Globe size={20} />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-900">{domain.domainName}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-[10px] font-bold uppercase ${domain.verificationStatus === 'verified' ? 'text-emerald-600' : 'text-amber-600'}`}>
                          {domain.verificationStatus}
                        </span>
                        {domain.isDefault && (
                          <span className="text-[10px] font-bold uppercase text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">Default</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => {
                        setSelectedDomain(domain);
                        fetchDnsRecords(domain.id);
                      }}
                      className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                    >
                      Manage DNS
                    </button>
                    {domain.verificationStatus !== 'verified' && (
                      <button 
                        onClick={() => handleVerify(domain.id)}
                        disabled={verifying}
                        className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-indigo-700 transition flex items-center gap-1"
                      >
                        {verifying ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                        Verify
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center border border-dashed border-slate-200 rounded-3xl">
              <Globe size={40} className="text-slate-300 mx-auto mb-4" />
              <div className="text-sm font-bold text-slate-900">No Verified Domains</div>
              <p className="text-xs text-slate-500 mt-1 mb-6 max-w-[200px] mx-auto">Add a domain to start sending professional marketing emails.</p>
              <button 
                onClick={() => setShowAddForm(true)}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-2 mx-auto"
              >
                <Plus size={14} /> Add your first domain
              </button>
            </div>
          )}
        </div>
      </div>

      {selectedDomain && dnsRecords && (
        <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm animate-in fade-in slide-in-from-top-4 scroll-mt-8" id="dns-config">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900">DNS Configuration: {selectedDomain.domainName}</h3>
              <p className="text-xs text-slate-500 mt-1">Add these records to your DNS provider (Cloudflare, GoDaddy, etc.)</p>
            </div>
            <button 
              onClick={() => setSelectedDomain(null)}
              className="text-xs font-bold text-slate-400 hover:text-slate-600"
            >
              Close
            </button>
          </div>

          <div className="space-y-6">
            {/* DKIM Records */}
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <ShieldCheck size={14} className="text-indigo-500" />
                DKIM (Identity Verification)
              </h4>
              <div className="space-y-2">
                {dnsRecords.dkim.map((record: any, idx: number) => (
                  <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                    <div>
                      <span className="text-[10px] font-black text-slate-400 uppercase block mb-1">Type</span>
                      <span className="text-xs font-bold text-slate-900">{record.type}</span>
                    </div>
                    <div className="md:col-span-1 overflow-hidden">
                      <span className="text-[10px] font-black text-slate-400 uppercase block mb-1">Host/Name</span>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-mono text-slate-600 truncate">{record.name}</span>
                        <button onClick={() => copyToClipboard(record.name)} className="p-1 hover:bg-slate-200 rounded transition text-slate-400"><Copy size={12} /></button>
                      </div>
                    </div>
                    <div className="overflow-hidden">
                      <span className="text-[10px] font-black text-slate-400 uppercase block mb-1">Value/Point to</span>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-mono text-slate-600 truncate">{record.value}</span>
                        <button onClick={() => copyToClipboard(record.value)} className="p-1 hover:bg-slate-200 rounded transition text-slate-400"><Copy size={12} /></button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* SPF Record */}
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <CheckCircle2 size={14} className="text-emerald-500" />
                SPF (Sender Policy Framework)
              </h4>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase block mb-1">Type</span>
                  <span className="text-xs font-bold text-slate-900">{dnsRecords.spf.type}</span>
                </div>
                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase block mb-1">Host/Name</span>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-mono text-slate-600 truncate">{dnsRecords.spf.name}</span>
                    <button onClick={() => copyToClipboard(dnsRecords.spf.name)} className="p-1 hover:bg-slate-200 rounded transition text-slate-400"><Copy size={12} /></button>
                  </div>
                </div>
                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase block mb-1">Value</span>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-mono text-slate-600 truncate">{dnsRecords.spf.value}</span>
                    <button onClick={() => copyToClipboard(dnsRecords.spf.value)} className="p-1 hover:bg-slate-200 rounded transition text-slate-400"><Copy size={12} /></button>
                  </div>
                </div>
              </div>
            </div>

            {/* DMARC Record */}
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <AlertCircle size={14} className="text-amber-500" />
                DMARC (Reporting & Policy)
              </h4>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase block mb-1">Type</span>
                  <span className="text-xs font-bold text-slate-900">{dnsRecords.dmarc.type}</span>
                </div>
                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase block mb-1">Host/Name</span>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-mono text-slate-600 truncate">{dnsRecords.dmarc.name}</span>
                    <button onClick={() => copyToClipboard(dnsRecords.dmarc.name)} className="p-1 hover:bg-slate-200 rounded transition text-slate-400"><Copy size={12} /></button>
                  </div>
                </div>
                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase block mb-1">Value</span>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-mono text-slate-600 truncate">{dnsRecords.dmarc.value}</span>
                    <button onClick={() => copyToClipboard(dnsRecords.dmarc.value)} className="p-1 hover:bg-slate-200 rounded transition text-slate-400"><Copy size={12} /></button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
            <p className="text-xs text-slate-500 italic flex items-center gap-2">
              <RefreshCw size={12} />
              DNS changes can take up to 48 hours to propagate globally.
            </p>
            <button className="flex items-center gap-2 text-xs font-bold text-indigo-600 hover:text-indigo-700">
              Troubleshooting Guide <ExternalLink size={12} />
            </button>
          </div>
        </div>
      )}

      <div className="p-8 rounded-3xl bg-amber-50 border border-amber-100 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-white rounded-2xl text-amber-600 shadow-sm">
            <Smartphone size={24} />
          </div>
          <div>
            <h3 className="text-amber-900 font-bold">Improve Deliverability</h3>
            <p className="text-sm text-amber-700 mt-1 leading-relaxed">
              To ensure your emails don't end up in spam, please configure your **SPF, DKIM, and DMARC** records in your DNS provider (Cloudflare, GoDaddy, etc.).
            </p>
            <button className="mt-4 text-xs font-bold text-amber-900 hover:underline">
              View DNS Configuration Guide &rarr;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
