import { AlertCircle, CheckCircle2, Copy, ExternalLink, Globe, Loader2, RefreshCw, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "../lib/api";

export function DomainSettings() {
  const [domains, setDomains] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingDomain, setAddingDomain] = useState(false);
  const [newDomainName, setNewDomainName] = useState("");
  const [selectedDomain, setSelectedDomain] = useState<any>(null);
  const [dnsRecords, setDnsRecords] = useState<any>(null);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    fetchDomains();
  }, []);

  const fetchDomains = async () => {
    try {
      const data = await api.get("/domains");
      setDomains(data);
    } catch (error) {
      console.error("Failed to fetch domains:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDomainName.trim()) return;
    setAddingDomain(true);
    try {
      const domain = await api.post("/domains", { domainName: newDomainName.trim() });
      setDomains([...domains, domain]);
      setNewDomainName("");
      setSelectedDomain(domain);
      fetchDnsRecords(domain.id);
    } catch (error) {
      console.error("Failed to add domain:", error);
      alert("Failed to add domain. Please check if it's a valid domain name.");
    } finally {
      setAddingDomain(false);
    }
  };

  const fetchDnsRecords = async (domainId: string) => {
    try {
      const data = await api.get(`/domains/${domainId}/dns`);
      setDnsRecords(data);
    } catch (error) {
      console.error("Failed to fetch DNS records:", error);
    }
  };

  const handleVerify = async (domainId: string) => {
    setVerifying(true);
    try {
      const updatedDomain = await api.post(`/domains/${domainId}/verify`, {});
      if (updatedDomain.verificationStatus === 'verified') {
        alert("Domain verified successfully!");
      } else {
        alert("Verification pending. Please ensure DNS records are propagated.");
      }
      fetchDomains();
    } catch (error) {
      console.error("Verification error:", error);
      alert("Failed to trigger verification.");
    } finally {
      setVerifying(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  if (loading) {
    return (
      <div className="py-20 flex justify-center">
        <Loader2 className="animate-spin text-indigo-600" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-slate-900">Verified Domains</h3>
          <form onSubmit={handleAddDomain} className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. example.com"
              value={newDomainName}
              onChange={(e) => setNewDomainName(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm outline-none transition focus:border-indigo-500 focus:bg-white"
              required
            />
            <button 
              type="submit"
              disabled={addingDomain}
              className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 transition disabled:opacity-50 flex items-center gap-2"
            >
              {addingDomain ? <Loader2 size={14} className="animate-spin" /> : null}
              Add Domain
            </button>
          </form>
        </div>
        
        <div className="space-y-4">
          {domains.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {domains.map((domain) => (
                <div key={domain.id} className="py-4 flex items-center justify-between">
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
            </div>
          )}
        </div>
      </div>

      {selectedDomain && dnsRecords && (
        <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm animate-in fade-in slide-in-from-top-4">
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
