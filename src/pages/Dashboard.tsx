import { useState } from "react";
import { usePresence } from "@/hooks/usePresence";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout, { type DashboardTab } from "@/components/dashboard/DashboardLayout";
import AIAssistant from "@/components/landing/AIAssistant";

// Eager imports: after login the user navigates between tabs frequently.
// Lazy loading each tab caused a visible spinner/network fetch on every
// switch. Loading them together keeps navigation instantaneous.
import HomeTab from "@/components/dashboard/home/HomeTab";
import ProfileTab from "@/components/dashboard/ProfileTab";
import MatchingTab from "@/components/dashboard/MatchingTab";
import CofounderMatchTab from "@/components/dashboard/CofounderMatchTab";
import ExplorerTab from "@/components/dashboard/ExplorerTab";
import ProjectsTab from "@/components/dashboard/ProjectsTab";
import ContactsTab from "@/components/dashboard/ContactsTab";
import SettingsTab from "@/components/dashboard/SettingsTab";
import AdminTab from "@/components/dashboard/AdminTab";
import BoostTab from "@/components/dashboard/BoostTab";
import FundraisingTab from "@/components/dashboard/FundraisingTab";
import InvestmentClubTab from "@/components/dashboard/InvestmentClubTab";
import IncubationTab from "@/components/incubation/IncubationTab";

const Dashboard = () => {
  usePresence();
  const { role } = useAuth();

  const getDefaultTab = (): DashboardTab => {
    if (role === "admin") return "admin";
    return "home";
  };

  const [activeTab, setActiveTab] = useState<DashboardTab>(getDefaultTab());

  return (
    <DashboardLayout activeTab={activeTab} onTabChange={setActiveTab}>
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
      <AIAssistant />
    </DashboardLayout>
  );
};

export default Dashboard;
