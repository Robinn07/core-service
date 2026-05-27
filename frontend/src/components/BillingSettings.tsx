import { CreditCard, Download, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "../lib/api";

export function BillingSettings() {
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBilling() {
      try {
        const data = await api.get("/analytics/billing-report");
        setReport(data);
      } catch (error) {
        console.error("Failed to load billing", error);
      } finally {
        setLoading(false);
      }
    }
    fetchBilling();
  }, []);

  if (loading) {
    return (
      <div className="py-20 flex justify-center">
        <Loader2 className="animate-spin text-indigo-600" size={32} />
      </div>
    );
  }

  const usagePercent = report ? Math.min((report.activeContacts / 1000) * 100, 100).toFixed(0) : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-8 rounded-3xl bg-slate-900 text-white shadow-xl">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Current Plan</div>
          <div className="text-3xl font-black mb-6">Growth Pro</div>
          
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-semibold mb-2">
                <span>Active Contacts</span>
                <span>{report?.activeContacts || 0} / 1,000</span>
              </div>
              <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500" style={{ width: `${usagePercent}%` }} />
              </div>
            </div>
          </div>
          
          <div className="mt-8 pt-6 border-t border-slate-800 flex items-center justify-between">
            <span className="text-xl font-bold">$49<span className="text-sm text-slate-500 font-medium">/mo</span></span>
            <button className="rounded-xl bg-white px-5 py-2 text-xs font-bold text-slate-900 hover:bg-slate-100 transition">
              Upgrade Plan
            </button>
          </div>
        </div>

        <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col justify-center">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-6">
            <CreditCard size={24} />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Payment Method</h3>
          <p className="text-sm text-slate-500 mt-1 mb-6">Your payment is processed securely via Stripe. Your card ends in •••• 4242.</p>
          <button className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition self-start">
            Update Payment Method
          </button>
        </div>
      </div>

      <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-slate-900">Billing History</h3>
        </div>
        <div className="divide-y divide-slate-100">
          {[
            { date: "May 1, 2026", amount: "$49.00", status: "Paid" },
            { date: "Apr 1, 2026", amount: "$49.00", status: "Paid" },
            { date: "Mar 1, 2026", amount: "$49.00", status: "Paid" }
          ].map((invoice, idx) => (
            <div key={idx} className="py-4 flex items-center justify-between">
              <div>
                <div className="text-sm font-bold text-slate-900">Pro Plan - Monthly</div>
                <div className="text-xs text-slate-500">{invoice.date}</div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm font-bold text-slate-900">{invoice.amount}</span>
                <span className="px-2 py-1 rounded bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase tracking-wider">{invoice.status}</span>
                <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition">
                  <Download size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
