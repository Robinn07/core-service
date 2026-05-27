import { Globe, Lock, Mail, Save, ShieldCheck, Users, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { DomainSettings } from "../../components/DomainSettings";
import { BillingSettings } from "../../components/BillingSettings";
import { SecuritySettings } from "../../components/SecuritySettings";
import { TeamSettings } from "../../components/TeamSettings";
import { api } from "../../lib/api";

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState("general");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [orgConfig, setOrgConfig] = useState<any>({});
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");

  const tabs = [
    { id: "general", label: "General", icon: Globe },
    { id: "domains", label: "Domains & Tracking", icon: Mail },
    { id: "team", label: "Team", icon: Users },
    { id: "security", label: "Security & API", icon: ShieldCheck },
    { id: "billing", label: "Billing", icon: Lock },
  ];

  useEffect(() => {
    fetchOrgConfig();
  }, []);

  const fetchOrgConfig = async () => {
    try {
      const data = await api.get("/org/settings");
      setOrgConfig(data);
    } catch (err) {
      console.error("Failed to load settings:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveGeneral = async () => {
    setSaving(true);
    setSaveStatus("idle");
    try {
      await api.put("/org/settings", orgConfig);
      setSaveStatus("success");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch (err) {
      console.error("Failed to save settings:", err);
      setSaveStatus("error");
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setOrgConfig((prev: any) => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="py-20 flex justify-center mt-8">
        <Loader2 className="animate-spin text-indigo-600" size={32} />
      </div>
    );
  }

  return (
    <div className="mt-8">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Nav */}
        <div className="w-full lg:w-64 space-y-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition ${
                activeTab === tab.id 
                  ? "bg-slate-900 text-white shadow-lg shadow-slate-200" 
                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 space-y-6 pb-12">
          {activeTab === "general" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
              <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 mb-6">Organization Profile</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Organization Name</label>
                    <input 
                      type="text" 
                      value={orgConfig.orgName || ""} 
                      onChange={(e) => handleChange("orgName", e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:bg-white focus:border-indigo-500 outline-none transition"
                      placeholder="Your Company Name"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Support Email</label>
                    <input 
                      type="email" 
                      value={orgConfig.supportEmail || ""} 
                      onChange={(e) => handleChange("supportEmail", e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:bg-white focus:border-indigo-500 outline-none transition"
                      placeholder="support@company.com"
                    />
                  </div>
                </div>
              </div>

              <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 mb-2">Company Branding</h3>
                <p className="text-sm text-slate-500 mb-6">This will be used for your landing pages and system emails.</p>
                <div className="flex flex-wrap items-center gap-8">
                  <div className="relative w-20 h-20 rounded-3xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-black text-2xl shadow-sm overflow-hidden group">
                    {orgConfig.logoUrl ? (
                      <img src={orgConfig.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                    ) : (
                      <span className="opacity-50 text-base font-semibold">Logo</span>
                    )}
                  </div>
                  <div className="flex-1 space-y-2 max-w-sm">
                    <label className="text-xs font-bold text-slate-500 uppercase">Logo URL</label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={orgConfig.logoUrl || ""} 
                        onChange={(e) => handleChange("logoUrl", e.target.value)}
                        className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:bg-white focus:border-indigo-500 outline-none transition"
                        placeholder="https://example.com/logo.png"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-bold text-slate-900">Compliance & Delivery</h3>
                  <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 text-[10px] font-bold uppercase tracking-wider">Required</span>
                </div>
                <p className="text-sm text-slate-500 mb-6">These settings are legally required for CAN-SPAM compliance and improve deliverability.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Default "From" Name</label>
                    <input 
                      type="text" 
                      value={orgConfig.defaultFromName || ""} 
                      onChange={(e) => handleChange("defaultFromName", e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:bg-white focus:border-indigo-500 outline-none transition"
                      placeholder="e.g. Talha from LoopX"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Timezone</label>
                    <select 
                      value={orgConfig.timezone || "UTC"} 
                      onChange={(e) => handleChange("timezone", e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:bg-white focus:border-indigo-500 outline-none transition appearance-none"
                    >
                      <option value="UTC">UTC (Universal Time)</option>
                      <option value="America/New_York">Eastern Time (ET)</option>
                      <option value="America/Chicago">Central Time (CT)</option>
                      <option value="America/Denver">Mountain Time (MT)</option>
                      <option value="America/Los_Angeles">Pacific Time (PT)</option>
                      <option value="Europe/London">London (GMT)</option>
                      <option value="Asia/Kolkata">India (IST)</option>
                      <option value="Asia/Singapore">Singapore (SGT)</option>
                      <option value="Australia/Sydney">Sydney (SGT)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Physical Office Address</label>
                  <textarea 
                    value={orgConfig.physicalAddress || ""} 
                    onChange={(e) => handleChange("physicalAddress", e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:bg-white focus:border-indigo-500 outline-none transition resize-none h-24"
                    placeholder="123 Startup Blvd, Suite 400, San Francisco, CA 94107"
                  />
                  <p className="text-xs text-slate-400 mt-1">This address will be automatically appended to the footer of all marketing emails.</p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-4 pt-4">
                {saveStatus === "success" && <span className="text-sm font-semibold text-emerald-600">Saved successfully!</span>}
                {saveStatus === "error" && <span className="text-sm font-semibold text-rose-600">Error saving changes</span>}
                <button 
                  onClick={handleSaveGeneral}
                  disabled={saving}
                  className="flex items-center gap-2 rounded-xl bg-indigo-600 px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition disabled:opacity-50"
                >
                  {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                  Save Changes
                </button>
              </div>
            </div>
          )}

          {activeTab === "domains" && (
            <div className="animate-in fade-in slide-in-from-bottom-2">
              <DomainSettings />
              
              {/* Feature tease for custom tracking domain */}
              <div className="mt-6 p-6 rounded-3xl bg-indigo-50 border border-indigo-100 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-indigo-900">Custom Tracking Domains</h3>
                  <p className="text-xs text-indigo-700 mt-1">Want link clicks to show as <code className="bg-indigo-100 px-1 rounded">links.yourbrand.com</code>? Upgrade to Pro to unlock.</p>
                </div>
                <button className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 shadow-sm">
                  Upgrade
                </button>
              </div>
            </div>
          )}

          {activeTab === "team" && (
            <div className="animate-in fade-in slide-in-from-bottom-2">
              <TeamSettings />
            </div>
          )}

          {activeTab === "security" && (
            <div className="animate-in fade-in slide-in-from-bottom-2">
              <SecuritySettings />
            </div>
          )}

          {activeTab === "billing" && (
            <div className="animate-in fade-in slide-in-from-bottom-2">
              <BillingSettings />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
