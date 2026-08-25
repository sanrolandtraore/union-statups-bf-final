import { Suspense, lazy, useState } from "react";
import { usePresence } from "@/hooks/usePresence";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout, { type DashboardTab } from "@/components/dashboard/DashboardLayout";
import AIAssistant from "@/components/landing/AIAssistant";
import HomeTab from "@/components/dashboard/home/HomeTab";
import { Badge } from "@/components/ui/badge";

const ProfileTab = lazy(() => import("@/components/dashboard/ProfileTabProduction"));
const MatchingTab = lazy(() => import("@/components/dashboard/MatchingTab"));
const CofounderMatchTab = lazy(() => import("@/components/dashboard/CofounderMatchTab"));
const ExplorerTab = lazy(() => import("@/components/dashboard/ExplorerTab"));
const ProjectsTab = lazy(() => import("@/components/dashboard/ProjectsTab"));
const ContactsTab = lazy(() => import("@/components/dashboard/ContactsTab"));
const SettingsTab = lazy(() => import("@/components/dashboard/SettingsTabProduction"));
const AdminTab = lazy(() => import("@/components/dashboard/AdminTab"));
const BoostTab = lazy(() => import("@/components/dashboard/BoostTab"));
const FundraisingTab = lazy(() => import("@/components/dashboard/FundraisingTab"));
const InvestmentClubTab = lazy(() => import("@/components/dashboard/InvestmentClubTab"));
const InvestorAIMatchTab = lazy(() => import("@/components/dashboard/InvestorAIMatchTab"));
const IncubationTab = lazy(() => import("@/components/incubation/IncubationTab"));

const TabLoading = () => (
  <div className="flex min-h-[320px] items-center justify-center" role="status" aria-live="polite">
    <div className="flex items-center gap-3 rounded-full border border-border/60 bg-card px-4 py-2 shadow-sm">
      <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
      <span className="text-sm text-muted-foreground">Chargement de votre espace…</span>
    </div>
  </div>
);

const Dashboard = () => {
  usePresence();
  const { role } = useAuth();
  const [activeTab, setActiveTab] = useState<DashboardTab>(role === "admin" ? "admin" : "home");

  return (
    <DashboardLayout activeTab={activeTab} onTabChange={setActiveTab}>
      <div className="relative min-h-full">
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-0 h-40 bg-gradient-to-b from-primary/[0.06] to-transparent" />
        <div className="relative z-10 mb-4 flex items-center justify-end gap-3 px-1">
          {role === "admin" && (
            <Badge variant="outline" className="shrink-0 border-primary/30 bg-primary/5 text-primary">
              Administration
            </Badge>
          )}
        </div>

        <Suspense fallback={<TabLoading />}>
          {activeTab === "home" && <HomeTab onTabChange={setActiveTab} />}
          {activeTab === "profile" && <ProfileTab />}
          {activeTab === "matching" && <MatchingTab />}
          {activeTab === "cofounder" && <CofounderMatchTab />}
          {activeTab === "explorer" && <ExplorerTab />}
          {activeTab === "projects" && <ProjectsTab />}
          {activeTab === "contacts" && <ContactsTab />}
          {activeTab === "boost" && <BoostTab />}
          {activeTab === "fundraising" && <FundraisingTab />}
          {activeTab === "settings" && <SettingsTab />}
          {activeTab === "admin" && role === "admin" && <AdminTab />}
          {activeTab === "investment-club" && <InvestmentClubTab />}
          {activeTab === "ai-match" && <InvestorAIMatchTab />}
          {activeTab === "incubation" && (role === "startup" || role === "admin") && <IncubationTab />}
        </Suspense>
        <AIAssistant />
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
