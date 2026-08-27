import { useState } from "react";
import { cn } from "@/lib/utils";
import { Menu } from "lucide-react";
import DashboardSidebar from "./DashboardSidebar";

export type DashboardTab = "home" | "profile" | "matching" | "cofounder" | "explorer" | "projects" | "contacts" | "boost" | "settings" | "admin" | "fundraising" | "investment-club" | "incubation" | "ai-match" | "legal-docs" | "pitch-coach" | "fundraising-advisor";

interface DashboardLayoutProps {
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
  children: React.ReactNode;
}

const DashboardLayout = ({ activeTab, onTabChange, children }: DashboardLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-border bg-card transition-transform md:relative md:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <DashboardSidebar
          activeTab={activeTab}
          onTabChange={onTabChange}
          onClose={() => setSidebarOpen(false)}
        />
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-background/80 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main content */}
      <div className="flex flex-1 flex-col">
        <header className="flex items-center gap-4 border-b border-border px-6 py-4 md:hidden">
          <button onClick={() => setSidebarOpen(true)} className="text-foreground">
            <Menu className="h-5 w-5" />
          </button>
          <span className="font-display font-bold text-foreground">
            Union<span className="text-gradient-gold">'S</span>
          </span>
        </header>
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
};

export default DashboardLayout;
