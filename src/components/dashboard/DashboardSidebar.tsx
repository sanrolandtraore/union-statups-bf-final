import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  LogOut, UserCircle, Target, Globe2, MessageSquareMore, Settings,
  Layers, ShieldHalf, Megaphone, Handshake, Briefcase, Video,
  BarChart3, UsersRound, TrendingUp, Home,
  Rocket, Search, FolderOpen, LayoutDashboard, GraduationCap, Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import type { DashboardTab } from "./DashboardLayout";
import logoIcon from "@/assets/brand/icon.png";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface SidebarGroup {
  id: string;
  label: string;
  icon: React.ElementType;
  items: {
    id: DashboardTab | string;
    label: string;
    icon: React.ElementType;
    isExternal?: boolean;
    path?: string;
  }[];
}

const getSidebarGroups = (role: string | null, t: (key: string) => string): SidebarGroup[] => {
  const groups: SidebarGroup[] = [];

  // Mon Espace
  const monEspace: SidebarGroup = {
    id: "my-space",
    label: "Mon Espace",
    icon: Home,
    items: [
      { id: "home", label: "Accueil", icon: LayoutDashboard },
      { id: "profile", label: t("dashboard.profile"), icon: UserCircle },
      { id: "settings", label: t("dashboard.settings"), icon: Settings },
    ],
  };
  groups.push(monEspace);

  // Réseau & Matching
  if (role !== "partner") {
    const reseau: SidebarGroup = {
      id: "network",
      label: "Réseau & Matching",
      icon: Search,
      items: [
        { id: "matching", label: t("dashboard.matching"), icon: Target },
        { id: "cofounder", label: t("dashboard.cofounder"), icon: Handshake },
        { id: "explorer", label: t("dashboard.explorer"), icon: Globe2 },
        { id: "contacts", label: t("dashboard.contacts"), icon: MessageSquareMore },
      ],
    };
    groups.push(reseau);
  } else {
    groups.push({
      id: "network",
      label: "Réseau",
      icon: Search,
      items: [
        { id: "explorer", label: t("dashboard.explorer"), icon: Globe2 },
        { id: "contacts", label: t("dashboard.contacts"), icon: MessageSquareMore },
      ],
    });
  }

  // Projets & Levée
  if (role === "startup" || role === "admin") {
    groups.push({
      id: "projects",
      label: "Projets & Levée",
      icon: Rocket,
      items: [
        { id: "projects", label: t("dashboard.projects"), icon: Layers },
        { id: "incubation", label: "Incubateur digital", icon: GraduationCap },
        { id: "fundraising", label: t("dashboard.fundraising"), icon: TrendingUp },
      ],
    });
  }

  // Investissement (module complet)
  if (role === "investor" || role === "admin") {
    groups.push({
      id: "investment",
      label: "Investissement",
      icon: BarChart3,
      items: [
        { id: "investment-club", label: "Club d'Investissement", icon: BarChart3 },
        ...(role === "investor" ? [{ id: "fundraising" as DashboardTab, label: t("dashboard.fundraising"), icon: TrendingUp }] : []),
        ...(role === "investor" ? [{ id: "ai-match" as DashboardTab, label: "Matching IA", icon: Sparkles }] : []),
      ],
    });
  }

  // Visibilité & Boost
  if (role !== "partner") {
    groups.push({
      id: "visibility",
      label: "Visibilité",
      icon: Megaphone,
      items: [
        { id: "boost", label: t("dashboard.boost"), icon: Megaphone },
      ],
    });
  }

  // Annuaires
  groups.push({
    id: "directories",
    label: "Annuaires",
    icon: FolderOpen,
    items: [
      { id: "talents-link", label: t("dashboard.talentDirectory") || "Annuaire Talents", icon: UsersRound, isExternal: true, path: "/talents" },
      { id: "projects-link", label: t("dashboard.projectDirectory") || "Annuaire Projets", icon: Layers, isExternal: true, path: "/projets" },
    ],
  });

  // Accès rapides
  const quickLinks: SidebarGroup["items"] = [];
  if (role === "startup" || role === "admin") {
    quickLinks.push({ id: "jobs-link", label: t("dashboard.startupJobs"), icon: Briefcase, isExternal: true, path: "/jobs" });
  }
  if (role !== "partner") {
    quickLinks.push({ id: "pitch-link", label: t("dashboard.livePitch"), icon: Video, isExternal: true, path: "/pitch-rooms" });
  }
  if (quickLinks.length > 0) {
    groups.push({
      id: "quick-access",
      label: "Accès rapides",
      icon: Rocket,
      items: quickLinks,
    });
  }

  // Admin
  if (role === "admin") {
    groups.push({
      id: "admin",
      label: "Administration",
      icon: ShieldHalf,
      items: [
        { id: "admin", label: t("dashboard.admin"), icon: ShieldHalf },
      ],
    });
  }

  return groups;
};

interface DashboardSidebarProps {
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
  onClose: () => void;
}

const DashboardSidebar = ({ activeTab, onTabChange, onClose }: DashboardSidebarProps) => {
  const { role, signOut } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const roleLabels: Record<string, string> = {
    talent: t("dashboard.roleTalent"),
    startup: t("dashboard.roleStartup"),
    investor: t("dashboard.roleInvestor"),
    partner: t("dashboard.rolePartner"),
    admin: t("dashboard.roleAdmin"),
  };

  const groups = getSidebarGroups(role, t);

  // Determine which accordion groups should be open by default
  const defaultOpen = groups
    .filter((g) => g.items.some((item) => item.id === activeTab))
    .map((g) => g.id);

  const handleItemClick = (item: SidebarGroup["items"][number]) => {
    if (item.isExternal && item.path) {
      navigate(item.path);
    } else {
      onTabChange(item.id as DashboardTab);
    }
    onClose();
  };

  return (
    <>
      {/* Logo */}
      <div className="flex items-center gap-2 border-b border-border px-6 py-5">
        <img src={logoIcon} alt="Union'S" className="h-9 w-9 object-contain" />
        <span className="text-xl font-display font-bold text-foreground">
          Union<span className="text-gradient-gold">'S</span>
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <Accordion type="multiple" defaultValue={defaultOpen} className="space-y-1">
          {groups.map((group) => (
            <AccordionItem key={group.id} value={group.id} className="border-none">
              <AccordionTrigger className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold text-muted-foreground hover:bg-secondary hover:text-foreground hover:no-underline [&[data-state=open]]:text-foreground">
                <div className="flex items-center gap-2">
                  <group.icon className="h-4 w-4" />
                  <span>{group.label}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-1 pt-0">
                <div className="ml-2 space-y-0.5 border-l border-border pl-3">
                  {group.items.map((item) => {
                    const isActive = !item.isExternal && item.id === activeTab;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleItemClick(item)}
                        className={cn(
                          "flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                          isActive
                            ? "bg-primary/10 text-primary"
                            : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                        )}
                      >
                        <item.icon className="h-4 w-4 shrink-0" />
                        <span className="truncate">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </nav>

      {/* Footer */}
      <div className="border-t border-border p-4">
        <div className="flex items-center justify-between mb-3">
          {role && (
            <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              {roleLabels[role]}
            </span>
          )}
          <div className="flex items-center gap-1">
            <ThemeSwitcher />
            <LanguageSwitcher />
          </div>
        </div>
        <Button variant="outline" size="sm" className="w-full" onClick={signOut}>
          <LogOut className="mr-2 h-4 w-4" /> {t("dashboard.logout")}
        </Button>
      </div>
    </>
  );
};

export default DashboardSidebar;
