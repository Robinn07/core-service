import { Smartphone, Monitor } from "lucide-react";
import { useState } from "react";

interface TemplatePreviewProps {
  html: string;
}

export function TemplatePreview({ html }: TemplatePreviewProps) {
  const [view, setView] = useState<"mobile" | "desktop">("mobile");

  return (
    <div className="flex flex-col h-full bg-slate-100 rounded-2xl overflow-hidden border border-slate-200">
      <div className="flex items-center justify-between p-3 bg-white border-b border-slate-200">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Live Preview</span>
        <div className="flex bg-slate-100 p-1 rounded-lg">
          <button 
            onClick={() => setView("mobile")}
            className={`p-1.5 rounded-md transition ${view === "mobile" ? "bg-white shadow-sm text-indigo-600" : "text-slate-500 hover:text-slate-700"}`}
          >
            <Smartphone size={16} />
          </button>
          <button 
            onClick={() => setView("desktop")}
            className={`p-1.5 rounded-md transition ${view === "desktop" ? "bg-white shadow-sm text-indigo-600" : "text-slate-500 hover:text-slate-700"}`}
          >
            <Monitor size={16} />
          </button>
        </div>
      </div>
      
      <div className="flex-1 flex items-center justify-center p-2 overflow-hidden min-h-0">
        <div className={`transition-all duration-500 ease-in-out bg-white shadow-2xl overflow-hidden flex flex-col ${
          view === "mobile" ? "w-[320px] h-[568px] rounded-[40px] border-[12px] border-slate-900 origin-center scale-[0.7] xl:scale-90" : "w-full h-full rounded-xl border border-slate-200"
        }`}>
          <div className="flex-1 relative">
            <iframe
              title="preview"
              srcDoc={html || "<body style='display:flex;align-items:center;justify-center;height:100vh;font-family:sans-serif;color:#94a3b8'>Your design will appear here</body>"}
              className="absolute inset-0 w-full h-full border-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
