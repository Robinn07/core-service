import { ChevronRight, X } from "lucide-react";
import { useEffect, useState } from "react";

const STEPS = [
  {
    title: "Welcome to LoopX",
    content: "The first AI-driven CRM that closes the 'Success Gap' between leads and revenue. Let's take a 30-second tour.",
    target: "sidebar-home"
  },
  {
    title: "Intelligence Hub",
    content: "View your real-time ROI, lead scores, and churn risk on your main dashboard.",
    target: "sidebar-analytics"
  },
  {
    title: "Audience Control",
    content: "Manage your contacts and let our AI score them based on engagement probability.",
    target: "sidebar-audience"
  },
  {
    title: "Creative Studio",
    content: "Build high-converting email templates with live mobile previews and AI spam analysis.",
    target: "sidebar-templates"
  },
  {
    title: "Go Live",
    content: "Launch and schedule campaigns with Send-Time Optimization to maximize open rates.",
    target: "sidebar-campaigns"
  }
];

export function OnboardingTour() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const hasSeenTour = localStorage.getItem("loopx_tour_seen");
    if (!hasSeenTour) {
      setTimeout(() => setIsVisible(true), 1500);
    }
  }, []);

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = () => {
    localStorage.setItem("loopx_tour_seen", "true");
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
      <div className="relative w-[400px] bg-white rounded-3xl shadow-2xl p-8 border border-slate-200 animate-in fade-in zoom-in duration-300">
        <button onClick={handleComplete} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600">
          <X size={20} />
        </button>

        <div className="flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-bold text-xl mb-6 shadow-lg shadow-indigo-200">
            {currentStep + 1}
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-3">{STEPS[currentStep].title}</h3>
          <p className="text-sm text-slate-500 leading-relaxed mb-8">
            {STEPS[currentStep].content}
          </p>

          <div className="flex items-center justify-between w-full">
            <div className="flex gap-1.5">
              {STEPS.map((_, i) => (
                <div key={i} className={`h-1.5 rounded-full transition-all ${i === currentStep ? "w-6 bg-indigo-600" : "w-1.5 bg-slate-200"}`} />
              ))}
            </div>
            <button 
              onClick={handleNext}
              className="flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 transition"
            >
              {currentStep === STEPS.length - 1 ? "Get Started" : "Next Step"}
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
