import { Navigate, Route, Routes } from "react-router-dom";
import { Suspense, lazy } from "react";
import { Loader2 } from "lucide-react";
import { GuestRoute, ProtectedRoute } from "./components/AuthGuards";
import DashboardPage from "./pages/DashboardPage";
import LandingPage from "./pages/LandingPage";
import SignInPage from "./pages/SignInPage";
import { AnalyticsPage } from "./pages/dashboard/AnalyticsPage";
import { AudiencePage } from "./pages/dashboard/AudiencePage";
import { CampaignDetailPage } from "./pages/dashboard/CampaignDetailPage";
import { CampaignsPage } from "./pages/dashboard/CampaignsPage";
import { DashboardHome } from "./pages/dashboard/DashboardHome";
import { FormsPage } from "./pages/dashboard/FormsPage";
import { IntegrationsPage } from "./pages/dashboard/IntegrationsPage";
import { TemplateDetailPage } from "./pages/dashboard/TemplateDetailPage";
import { TemplatesPage } from "./pages/dashboard/TemplatesPage";
import { AutomationsPage } from "./pages/dashboard/AutomationsPage";
import { SettingsPage } from "./pages/dashboard/SettingsPage";
import SignUpPage from "./pages/SignUpPage";

const ContactProfilePage = lazy(() => import("./pages/dashboard/ContactProfilePage"));

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route
        path="/sign-in"
        element={
          <GuestRoute>
            <SignInPage />
          </GuestRoute>
        }
      />
      <Route
        path="/sign-up"
        element={
          <GuestRoute>
            <SignUpPage />
          </GuestRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      >
        <Route path="home" element={<DashboardHome />} />
        <Route path="campaigns" element={<CampaignsPage />} />
        <Route path="campaigns/:id" element={<CampaignDetailPage />} />
        <Route path="templates" element={<TemplatesPage />} />
        <Route path="templates/:id" element={<TemplateDetailPage />} />
        <Route path="forms" element={<FormsPage />} />
        <Route path="automations" element={<AutomationsPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="integrations" element={<IntegrationsPage />} />
        <Route path="audience" element={<AudiencePage />} />
        <Route path="audience/:id" element={
          <Suspense fallback={<div className="flex justify-center py-20"><Loader2 className="animate-spin text-indigo-600" size={32} /></div>}>
            <ContactProfilePage />
          </Suspense>
        } />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
