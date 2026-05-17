import { Calendar, Check, Copy, CreditCard, FormInput, Globe, Loader2, Share2, ShoppingCart, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { ApiKeyModal } from "../../components/ApiKeyModal";
import { IntegrationSetupModal } from "../../components/IntegrationSetupModal";

export function IntegrationsPage() {
  const [webhooks, setWebhooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newWebhookUrl, setNewWebhookUrl] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [copied, setCopied] = useState(false);

  // Modal States
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState<any>(null);

  const apps = [
    { name: "Facebook", suffix: "facebook", icon: Share2, desc: "Sync leads from Lead Ads.", docs: "https://developers.facebook.com/docs/marketing-api/guides/lead-ads/webhooks" },
    { name: "Stripe", suffix: "stripe", icon: CreditCard, desc: "Track conversions from payments.", docs: "https://stripe.com/docs/webhooks" },
    { name: "Razorpay", suffix: "razorpay", icon: CreditCard, desc: "Sync payments and customers.", docs: "https://razorpay.com/docs/payments/webhooks/" },
    { name: "WooCommerce", suffix: "woocommerce", icon: ShoppingCart, desc: "Track e-commerce orders.", docs: "https://woocommerce.com/document/webhooks/" },
    { name: "WordPress", suffix: "wordpress", icon: Globe, desc: "Capture leads from WP forms.", docs: "https://wordpress.org/plugins/wp-webhooks/" },
    { name: "Typeform", suffix: "typeform", icon: FormInput, desc: "Sync form submissions.", docs: "https://www.typeform.com/help/a/webhooks-360029575291/" },
    { name: "Calendly", suffix: "calendly", icon: Calendar, desc: "Sync meeting bookings.", docs: "https://developer.calendly.com/api-docs/webhooks" },
    { name: "Google Forms", suffix: "google_forms", icon: FormInput, desc: "Capture leads from forms.", docs: "https://developers.google.com/forms/api/guides/push-notifications" },
    { name: "Zapier", suffix: "zapier", icon: Zap, desc: "Connect 5000+ other apps.", docs: "https://zapier.com/help/create/code-webhooks/webhooks-in-zapier" },
  ];

  const snippetCode = `<script \n  src="https://crm.yourdomain.com/js/lx-unified.js?org=ORG_123"\n  async>\n</script>`;

  const handleCopy = () => {
    navigator.clipboard.writeText(snippetCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    async function fetchWebhooks() {
      try {
        const data = await api.get("/outgoing-webhooks");
        setWebhooks(data);
      } catch (error) {
        console.error("Failed to fetch webhooks:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchWebhooks();
  }, []);

  const handleAddWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWebhookUrl) return;
    setIsAdding(true);
    try {
      const data = await api.post("/outgoing-webhooks", { url: newWebhookUrl, events: ["*"] });
      setWebhooks([...webhooks, data]);
      setNewWebhookUrl("");
    } catch (error) {
      alert("Failed to add webhook");
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteWebhook = async (id: string) => {
    try {
      await api.delete(`/outgoing-webhooks/${id}`);
      setWebhooks(webhooks.filter(w => w.id !== id));
    } catch (error) {
      alert("Failed to delete webhook");
    }
  };

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Connected Apps & Webhooks</h2>
        <button 
          onClick={() => setIsApiKeyModalOpen(true)} 
          className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-md hover:bg-indigo-700 transition"
        >
          View API Keys
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-8 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-900 mb-4">Register New Webhook</h3>
        <form onSubmit={handleAddWebhook} className="flex gap-3">
          <input 
            type="url" 
            placeholder="https://your-server.com/webhook" 
            className="flex-1 rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-300 transition"
            value={newWebhookUrl}
            onChange={(e) => setNewWebhookUrl(e.target.value)}
            required
          />
          <button 
            disabled={isAdding}
            className="bg-indigo-600 text-white px-6 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition disabled:opacity-50"
          >
            {isAdding ? "Adding..." : "Add Webhook"}
          </button>
        </form>
      </div>

      <h2 className="text-xl font-semibold mt-12 mb-6">Success Gap Tracking Setup</h2>
      <div className="grid gap-6 lg:grid-cols-2 mb-12">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900 mb-2">1. Install Tracking Snippet</h3>
          <p className="text-xs text-slate-500 mb-4">Add this script to the <code>&lt;head&gt;</code> of your website to enable behavioral tracking and Success Gap ROI attribution.</p>
          <div className="relative group">
            <pre className="bg-slate-900 text-slate-300 p-4 rounded-xl text-xs overflow-x-auto font-mono">
              {snippetCode}
            </pre>
            <button 
              onClick={handleCopy}
              className="absolute top-3 right-3 p-1.5 bg-slate-800 text-slate-300 rounded-lg opacity-0 group-hover:opacity-100 transition hover:bg-slate-700 hover:text-white"
            >
              {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
            </button>
          </div>
          <div className="mt-4 p-3 bg-indigo-50 border border-indigo-100 rounded-xl">
            <p className="text-[11px] text-indigo-800">
              <strong>GDPR / CCPA:</strong> The tracker is consent-aware. Call <code>window.LoopX.confirmConsent()</code> after user accepts cookies.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900 mb-2">2. Authorized Origins (CORS)</h3>
          <p className="text-xs text-slate-500 mb-4">For security, events will only be ingested from authorized domains.</p>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border border-emerald-200 bg-emerald-50 rounded-xl">
              <span className="text-sm font-medium text-emerald-900">https://yourwebsite.com</span>
              <button className="text-xs font-semibold text-emerald-700 hover:text-emerald-800">Verified</button>
            </div>
            <div className="flex gap-2">
              <input 
                type="url" 
                placeholder="https://app.yourwebsite.com" 
                className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-300"
              />
              <button className="bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-semibold">Add</button>
            </div>
          </div>
        </div>
      </div>

      <h3 className="text-sm font-semibold text-slate-500 mb-4 uppercase tracking-wider">Active Webhook Subscriptions</h3>
      <div className="grid gap-4">
        {loading ? (
          <div className="py-10 flex justify-center bg-white rounded-2xl border border-slate-200">
            <Loader2 className="animate-spin text-indigo-600" size={24} />
          </div>
        ) : webhooks.length > 0 ? (
          webhooks.map((w) => (
            <div key={w.id} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div>
                <div className="font-semibold text-slate-900 truncate max-w-md">{w.url}</div>
                <div className="text-[10px] text-slate-400 mt-1">Events: {w.events.join(', ')}</div>
              </div>
              <button 
                onClick={() => handleDeleteWebhook(w.id)}
                className="text-xs font-medium text-red-600 hover:text-red-700 bg-red-50 px-3 py-1.5 rounded-lg transition"
              >
                Delete
              </button>
            </div>
          ))
        ) : (
          <div className="py-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-500 text-sm">
            No active webhooks.
          </div>
        )}
      </div>

      <h2 className="text-xl font-semibold mt-12 mb-6">Integration Marketplace</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {apps.map((app, i) => (
          <div key={i} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-indigo-300 transition group">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-slate-50 rounded-xl text-slate-400 group-hover:text-indigo-600 transition">
                <app.icon size={20} />
              </div>
              <div className="font-semibold text-slate-900">{app.name}</div>
            </div>
            <button 
              onClick={() => setSelectedApp({ name: app.name, icon: app.icon, description: app.desc, webhookSuffix: app.suffix, docsUrl: app.docs })}
              className="rounded-lg px-3 py-1.5 text-xs font-bold uppercase bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition"
            >
              Connect
            </button>
          </div>
        ))}
      </div>

      <ApiKeyModal isOpen={isApiKeyModalOpen} onClose={() => setIsApiKeyModalOpen(false)} />
      <IntegrationSetupModal isOpen={!!selectedApp} onClose={() => setSelectedApp(null)} app={selectedApp} />
    </div>
  );
}
