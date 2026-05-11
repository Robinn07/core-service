import ApiKeyCard from '@/components/settings/ApiKeyCard';

export default function SettingsPage() {
  // 1. Fetch tenantData from your /api/tenant endpoint
  // 2. Pass it to the component
  return (
    <div className="max-w-2xl mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Workspace Settings</h1>
      <ApiKeyCard 
        tenantData={data} 
        onRegenerate={callRegenerateApi} 
      />
    </div>
  );
}