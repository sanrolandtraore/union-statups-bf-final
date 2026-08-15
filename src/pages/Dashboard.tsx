import { Suspense, lazy, useState } from "react";
import { usePresence } from "@/hooks/usePresence";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout, { type DashboardTab } from "@/components/dashboard/DashboardLayout";
import AIAssistant from "@/components/landing/AIAssistant";
import HomeTab from "@/components/dashboard/home/HomeTab";

// Keep the initial dashboard bundle small. Secondary modules load only when opened.
const ProfileTab = lazy(() => import("@/components/dashboard/ProfileTab"));
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
const IncubationTab = lazy(() => import("@/components/incubation/IncubationTab"));

const TabLoading = () => (
  <div className="flex min-h-[240px] items-center justify-center" role="status" aria-live="polite">
    <span className="text-sm text-muted-foreground">Chargement…</span>
  </div>
);

const Dashboard = () => {
  usePresence();
  const { role } = useAuth();
  const getDefaultTab = (): DashboardTab => role === "admin" ? "admin" : "home";
  const [activeTab, setActiveTab] = useState<DashboardTab>(getDefaultTab());

  return (
    <DashboardLayout activeTab={activeTab} onTabChange={setActiveTab}>
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
        {activeTab === "incubation" && <IncubationTab />}
      </Suspense>
      <AIAssistant />
    </DashboardLayout>
  );
};

export default Dashboard;
