import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { ShieldHalf, FileText, BookOpen, HelpCircle, Layers, Plus, Edit2, Trash2, Save, GraduationCap, Users, Video, ShieldCheck, Gavel, Check, X, Sparkles, Mail, Phone, Building2 } from "lucide-react";
import { TabSkeleton } from "@/components/ui/loading-skeletons";
import type { Database } from "@/integrations/supabase/types";

type LegalPage = Database["public"]["Tables"]["legal_pages"]["Row"];
type BlogPost = Database["public"]["Tables"]["blog_posts"]["Row"];
type BlogCategory = Database["public"]["Tables"]["blog_categories"]["Row"];
type FaqItem = Database["public"]["Tables"]["faq_items"]["Row"];
type ResourceItem = Database["public"]["Tables"]["resources"]["Row"];
type Mentor = Database["public"]["Tables"]["mentors"]["Row"];
type Program = Database["public"]["Tables"]["startup_school_programs"]["Row"];
type SchoolContentItem = Database["public"]["Tables"]["startup_school_content"]["Row"];
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type ProjectRow = Database["public"]["Tables"]["projects"]["Row"];
type ServiceRequestRow = Database["public"]["Tables"]["service_requests"]["Row"];
type EditableItem = Partial<LegalPage> | Partial<BlogPost> | Partial<FaqItem> | Partial<ResourceItem> | Partial<Mentor> | Partial<Program> | Partial<SchoolContentItem>;

type AdminSection = "moderation" | "legal" | "blog" | "faq" | "resources" | "mentors" | "programs" | "school-content" | "kyc" | "services";

const AdminTab = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [section, setSection] = useState<AdminSection>("moderation");
  const [loading, setLoading] = useState(true);

  const [legalPages, setLegalPages] = useState<LegalPage[]>([]);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [blogCategories, setBlogCategories] = useState<BlogCategory[]>([]);
  const [faqItems, setFaqItems] = useState<FaqItem[]>([]);
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [schoolContent, setSchoolContent] = useState<SchoolContentItem[]>([]);
  const [kycProfiles, setKycProfiles] = useState<ProfileRow[]>([]);
  const [pendingProjects, setPendingProjects] = useState<ProjectRow[]>([]);
  const [pendingProfiles, setPendingProfiles] = useState<ProfileRow[]>([]);
  const [serviceRequests, setServiceRequests] = useState<ServiceRequestRow[]>([]);

  const [editItem, setEditItem] = useState<EditableItem | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  const sections = [
    { id: "moderation" as const, label: t("dashV2.admin.sections.moderation"), icon: Gavel },
    { id: "legal" as const, label: t("dashV2.admin.sections.legal"), icon: FileText },
    { id: "blog" as const, label: t("dashV2.admin.sections.blog"), icon: BookOpen },
    { id: "faq" as const, label: t("dashV2.admin.sections.faq"), icon: HelpCircle },
    { id: "resources" as const, label: t("dashV2.admin.sections.resources"), icon: Layers },
    { id: "mentors" as const, label: t("dashV2.admin.sections.mentors"), icon: Users },
    { id: "programs" as const, label: t("dashV2.admin.sections.programs"), icon: GraduationCap },
    { id: "school-content" as const, label: t("dashV2.admin.sections.schoolContent"), icon: Video },
    { id: "kyc" as const, label: t("dashV2.admin.sections.kyc"), icon: ShieldCheck },
    { id: "services" as const, label: t("premiumService.admin.sectionLabel"), icon: Sparkles },
  ];

  const fetchAll = async () => {
    setLoading(true);
    const [{ data: legal }, { data: posts }, { data: cats }, { data: faq }, { data: res }, { data: mnt }, { data: prg }, { data: sc }] = await Promise.all([
      supabase.from("legal_pages").select("*").order("title"),
      supabase.from("blog_posts").select("*").order("created_at", { ascending: false }),
      supabase.from("blog_categories").select("*").order("name"),
      supabase.from("faq_items").select("*").order("sort_order"),
      supabase.from("resources").select("*").order("sort_order"),
      supabase.from("mentors").select("*").order("created_at", { ascending: false }),
      supabase.from("startup_school_programs").select("*").order("created_at", { ascending: false }),
      supabase.from("startup_school_content").select("*").order("created_at", { ascending: false }),
    ]);
    const { data: kyc } = await supabase.from("profiles").select("*").order("created_at", { ascending: false }).limit(100);
    const { data: pendingProj } = await supabase.from("projects").select("*").eq("moderation_status", "pending").order("created_at", { ascending: false });
    const { data: pendingProf } = await supabase.from("profiles").select("*").eq("is_verified", false).neq("kyc_status", "rejected").order("created_at", { ascending: false }).limit(100);
    const { data: svcReq } = await supabase.from("service_requests").select("*").order("created_at", { ascending: false }).limit(200);
    setLegalPages(legal || []);
    setBlogPosts(posts || []);
    setBlogCategories(cats || []);
    setFaqItems(faq || []);
    setResources(res || []);
    setMentors(mnt || []);
    setPrograms(prg || []);
    setSchoolContent(sc || []);
    setKycProfiles(kyc || []);
    setPendingProjects(pendingProj || []);
    setPendingProfiles(pendingProf || []);
    setServiceRequests(svcReq || []);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const saveLegalPage = async (item: Partial<LegalPage>) => {
    if (item.id) {
      const { error } = await supabase.from("legal_pages").update({
        title: item.title, content: item.content, meta_description: item.meta_description, is_published: item.is_published,
      }).eq("id", item.id);
      if (error) { toast.error(t("dashV2.admin.toasts.saveError")); return; }
    } else {
      const { error } = await supabase.from("legal_pages").insert({
        slug: item.slug!, title: item.title!, content: item.content!, meta_description: item.meta_description,
      });
      if (error) { toast.error(error.message); return; }
    }
    toast.success(t("dashV2.admin.toasts.legalSaved"));
    setEditOpen(false); fetchAll();
  };

  const saveBlogPost = async (item: Partial<BlogPost> & { tags_str?: string }) => {
    const slug = item.slug || item.title!.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const tags = item.tags_str ? item.tags_str.split(",").map((s: string) => s.trim()).filter(Boolean) : [];
    if (item.id) {
      const { error } = await supabase.from("blog_posts").update({
        title: item.title, slug, excerpt: item.excerpt, content: item.content,
        category_id: item.category_id || null, is_published: item.is_published,
        published_at: item.is_published ? item.published_at || new Date().toISOString() : null,
        meta_title: item.meta_title, meta_description: item.meta_description,
        reading_time_min: item.reading_time_min || 5,
        tags,
      }).eq("id", item.id);
      if (error) { toast.error(t("dashV2.admin.toasts.saveError")); return; }
    } else {
      const { error } = await supabase.from("blog_posts").insert({
        slug, title: item.title!, excerpt: item.excerpt, content: item.content!,
        author_id: user!.id, category_id: item.category_id || null,
        is_published: item.is_published || false,
        published_at: item.is_published ? new Date().toISOString() : null,
        meta_title: item.meta_title, meta_description: item.meta_description,
        reading_time_min: item.reading_time_min || 5,
        tags,
      });
      if (error) { toast.error(error.message); return; }
    }
    toast.success(t("dashV2.admin.toasts.blogSaved"));
    setEditOpen(false); fetchAll();
  };

  const saveFaqItem = async (item: Partial<FaqItem>) => {
    if (item.id) {
      const { error } = await supabase.from("faq_items").update({
        question: item.question, answer: item.answer, category: item.category,
        sort_order: item.sort_order, is_published: item.is_published,
      }).eq("id", item.id);
      if (error) { toast.error(t("dashV2.admin.toasts.saveError")); return; }
    } else {
      const { error } = await supabase.from("faq_items").insert({
        question: item.question!, answer: item.answer!, category: item.category || "general",
        sort_order: item.sort_order || 0,
      });
      if (error) { toast.error(error.message); return; }
    }
    toast.success(t("dashV2.admin.toasts.faqSaved"));
    setEditOpen(false); fetchAll();
  };

  const saveResource = async (item: Partial<ResourceItem>) => {
    if (item.id) {
      const { error } = await supabase.from("resources").update({
        title: item.title, description: item.description, content: item.content,
        resource_type: item.resource_type, target_role: item.target_role,
        is_published: item.is_published, sort_order: item.sort_order,
      }).eq("id", item.id);
      if (error) { toast.error(t("dashV2.admin.toasts.saveError")); return; }
    } else {
      const { error } = await supabase.from("resources").insert({
        title: item.title!, description: item.description, content: item.content,
        resource_type: item.resource_type || "guide", target_role: item.target_role,
        sort_order: item.sort_order || 0,
      });
      if (error) { toast.error(error.message); return; }
    }
    toast.success(t("dashV2.admin.toasts.resourceSaved"));
    setEditOpen(false); fetchAll();
  };

  const saveMentor = async (item: Partial<Mentor> & { specialty_str?: string }) => {
    const specialtyArr = item.specialty_str ? item.specialty_str.split(",").map((s: string) => s.trim()).filter(Boolean) : [];
    if (item.id) {
      const { error } = await supabase.from("mentors").update({
        user_id: item.user_id, company_name: item.company_name, bio: item.bio,
        achievements: item.achievements, specialty: specialtyArr,
        experience_years: item.experience_years || 0, hourly_rate: item.hourly_rate || 0,
        linkedin_url: item.linkedin_url, website_url: item.website_url,
        availability: item.availability, is_approved: item.is_approved, is_featured: item.is_featured,
      }).eq("id", item.id);
      if (error) { toast.error("Erreur: " + error.message); return; }
    } else {
      if (!item.user_id) { toast.error(t("dashV2.admin.toasts.userIdRequired")); return; }
      const { error } = await supabase.from("mentors").insert({
        user_id: item.user_id, company_name: item.company_name, bio: item.bio,
        achievements: item.achievements, specialty: specialtyArr,
        experience_years: item.experience_years || 0, hourly_rate: item.hourly_rate || 0,
        linkedin_url: item.linkedin_url, website_url: item.website_url,
        availability: item.availability || "available", is_approved: item.is_approved || false, is_featured: item.is_featured || false,
      });
      if (error) { toast.error("Erreur: " + error.message); return; }
    }
    toast.success(t("dashV2.admin.toasts.mentorSaved"));
    setEditOpen(false); fetchAll();
  };

  const saveProgram = async (item: Partial<Program> & { tags_str?: string }) => {
    const tagsArr = item.tags_str ? item.tags_str.split(",").map((s: string) => s.trim()).filter(Boolean) : [];
    if (item.id) {
      const { error } = await supabase.from("startup_school_programs").update({
        title: item.title, description: item.description, cover_image_url: item.cover_image_url,
        program_type: item.program_type, difficulty_level: item.difficulty_level,
        duration_hours: item.duration_hours || 0, modules_count: item.modules_count || 0,
        price: item.price || 0, tags: tagsArr,
        is_published: item.is_published, is_featured: item.is_featured,
        mentor_id: item.mentor_id || null,
      }).eq("id", item.id);
      if (error) { toast.error("Erreur: " + error.message); return; }
    } else {
      const { error } = await supabase.from("startup_school_programs").insert({
        title: item.title!, description: item.description, cover_image_url: item.cover_image_url,
        program_type: item.program_type || "course", difficulty_level: item.difficulty_level || "beginner",
        duration_hours: item.duration_hours || 0, modules_count: item.modules_count || 0,
        price: item.price || 0, tags: tagsArr,
        is_published: item.is_published || false, is_featured: item.is_featured || false,
        mentor_id: item.mentor_id || null,
      });
      if (error) { toast.error("Erreur: " + error.message); return; }
    }
    toast.success(t("dashV2.admin.toasts.programSaved"));
    setEditOpen(false); fetchAll();
  };

  const saveSchoolContent = async (item: Partial<SchoolContentItem> & { tags_str?: string }) => {
    const tagsArr = item.tags_str ? item.tags_str.split(",").map((s: string) => s.trim()).filter(Boolean) : [];
    if (item.id) {
      const { error } = await supabase.from("startup_school_content").update({
        title: item.title, excerpt: item.excerpt, content: item.content,
        cover_image_url: item.cover_image_url, content_type: item.content_type,
        category: item.category, video_url: item.video_url, tags: tagsArr,
        is_published: item.is_published, is_featured: item.is_featured,
        mentor_id: item.mentor_id || null,
      }).eq("id", item.id);
      if (error) { toast.error("Erreur: " + error.message); return; }
    } else {
      const { error } = await supabase.from("startup_school_content").insert({
        title: item.title!, excerpt: item.excerpt, content: item.content,
        cover_image_url: item.cover_image_url, content_type: item.content_type || "article",
        category: item.category || "general", video_url: item.video_url, tags: tagsArr,
        is_published: item.is_published || false, is_featured: item.is_featured || false,
        mentor_id: item.mentor_id || null, author_id: user?.id,
      });
      if (error) { toast.error("Erreur: " + error.message); return; }
    }
    toast.success(t("dashV2.admin.toasts.contentSaved"));
    setEditOpen(false); fetchAll();
  };

  const handleDelete = async (table: "legal_pages" | "blog_posts" | "faq_items" | "resources" | "mentors" | "startup_school_programs" | "startup_school_content", id: string) => {
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) { toast.error(t("dashV2.admin.toasts.deleteError")); return; }
    toast.success(t("dashV2.admin.toasts.deleted"));
    fetchAll();
  };

  const openEdit = (item: (Partial<LegalPage> | Partial<BlogPost> | Partial<FaqItem> | Partial<ResourceItem> | (Partial<Mentor> & { tags?: string[] }) | (Partial<Program> & { tags?: string[] }) | (Partial<SchoolContentItem> & { tags?: string[] })) & { specialty?: string[] }) => {
    setEditItem({ ...item, tags_str: item.tags?.join(", ") || "", specialty_str: item.specialty?.join(", ") || "" });
    setEditOpen(true);
  };

  const openNew = (type: AdminSection) => {
    const defaults: Record<string, Record<string, unknown>> = {
      legal: { _type: "legal", title: "", slug: "", content: "", meta_description: "", is_published: true },
      blog: { _type: "blog", title: "", slug: "", excerpt: "", content: "", category_id: "", is_published: false, meta_title: "", meta_description: "", tags_str: "", reading_time_min: 5 },
      faq: { _type: "faq", question: "", answer: "", category: "general", sort_order: 0, is_published: true },
      resources: { _type: "resources", title: "", description: "", content: "", resource_type: "guide", target_role: "", is_published: true, sort_order: 0 },
      mentors: { _type: "mentors", user_id: "", company_name: "", bio: "", achievements: "", specialty_str: "", experience_years: 0, hourly_rate: 0, linkedin_url: "", website_url: "", availability: "available", is_approved: false, is_featured: false },
      programs: { _type: "programs", title: "", description: "", cover_image_url: "", program_type: "course", difficulty_level: "beginner", duration_hours: 0, modules_count: 0, price: 0, tags_str: "", is_published: false, is_featured: false, mentor_id: "" },
      "school-content": { _type: "school-content", title: "", excerpt: "", content: "", cover_image_url: "", content_type: "article", category: "general", video_url: "", tags_str: "", is_published: false, is_featured: false, mentor_id: "" },
    };
    setEditItem(defaults[type]);
    setEditOpen(true);
  };

  const saveEdit = () => {
    if (!editItem) return;
    const tp = editItem._type;
    if (tp === "legal") saveLegalPage(editItem);
    else if (tp === "blog") saveBlogPost(editItem);
    else if (tp === "faq") saveFaqItem(editItem);
    else if (tp === "resources") saveResource(editItem);
    else if (tp === "mentors") saveMentor(editItem);
    else if (tp === "programs") saveProgram(editItem);
    else if (tp === "school-content") saveSchoolContent(editItem);
  };

  if (loading) {
    return <TabSkeleton />;
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-5xl">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-gold">
          <ShieldHalf className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">{t("dashV2.admin.title")}</h1>
          <p className="text-muted-foreground">{t("dashV2.admin.subtitle")}</p>
        </div>
      </div>

      {/* Section Tabs */}
      <div className="mb-6 flex flex-wrap gap-2">
        {sections.map(s => (
          <Button key={s.id} variant={section === s.id ? "default" : "outline"} size="sm"
            onClick={() => setSection(s.id)}
            className={section === s.id ? "bg-gradient-gold text-primary-foreground" : ""}>
            <s.icon className="mr-2 h-4 w-4" />{s.label}
          </Button>
        ))}
      </div>

      {section !== "moderation" && section !== "kyc" && (
        <div className="mb-4 flex justify-end">
          <Button size="sm" className="bg-gradient-gold text-primary-foreground" onClick={() => openNew(section)}>
            <Plus className="mr-2 h-4 w-4" /> {t("dashV2.admin.newBtn")}
          </Button>
        </div>
      )}

      {/* Content Lists */}
      <div className="space-y-2">
        {section === "moderation" && (
          <div className="space-y-6">
            <div>
              <h3 className="mb-3 font-display text-lg font-semibold text-foreground">
                {t("dashV2.admin.pendingProjects", { count: pendingProjects.length })}
              </h3>
              {pendingProjects.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("dashV2.admin.noPendingProjects")}</p>
              ) : pendingProjects.map((p) => (
                <div key={p.id} className="mb-2 flex items-start justify-between gap-3 rounded-lg border border-border bg-card p-4">
                  <div className="flex-1">
                    <h4 className="font-medium text-foreground">{p.title}</h4>
                    <p className="text-xs text-muted-foreground line-clamp-2">{p.description || "—"}</p>
                    <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
                      {p.sector && <span>{t("dashV2.admin.sector")} {p.sector}</span>}
                      {p.city && <span>· {p.city}</span>}
                      <span>· {new Date(p.created_at).toLocaleDateString("fr-FR")}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" className="text-green-600 border-green-600/30"
                      onClick={async () => {
                        const { error } = await supabase.from("projects").update({
                          moderation_status: "approved", moderated_at: new Date().toISOString(), moderated_by: user!.id,
                          is_active: true,
                        }).eq("id", p.id);
                        if (error) { toast.error(error.message); return; }
                        toast.success(t("dashV2.admin.toasts.projectApproved"));
                        fetchAll();
                      }}>
                      <Check className="mr-1 h-3 w-3" /> {t("dashV2.admin.approve")}
                    </Button>
                    <Button size="sm" variant="outline" className="text-destructive border-destructive/30"
                      onClick={async () => {
                        const { error } = await supabase.from("projects").update({
                          moderation_status: "rejected", moderated_at: new Date().toISOString(), moderated_by: user!.id,
                        }).eq("id", p.id);
                        if (error) { toast.error(error.message); return; }
                        toast.info(t("dashV2.admin.toasts.projectRejected"));
                        fetchAll();
                      }}>
                      <X className="mr-1 h-3 w-3" /> {t("dashV2.admin.reject")}
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div>
              <h3 className="mb-3 font-display text-lg font-semibold text-foreground">
                {t("dashV2.admin.pendingProfiles", { count: pendingProfiles.length })}
              </h3>
              {pendingProfiles.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("dashV2.admin.noPendingProfiles")}</p>
              ) : pendingProfiles.map((p) => (
                <div key={p.id} className="mb-2 flex items-start justify-between gap-3 rounded-lg border border-border bg-card p-4">
                  <div className="flex-1">
                    <h4 className="font-medium text-foreground">{p.full_name || t("dashV2.admin.noName")}</h4>
                    <p className="text-xs text-muted-foreground line-clamp-2">{p.bio || "—"}</p>
                    <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
                      {p.city && <span>{p.city}</span>}
                      <span>· {t("dashV2.admin.kycLabel")} {p.kyc_status}</span>
                      <span>· {new Date(p.created_at).toLocaleDateString("fr-FR")}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" className="text-green-600 border-green-600/30"
                      onClick={async () => {
                        const { error } = await supabase.from("profiles").update({ is_verified: true }).eq("id", p.id);
                        if (error) { toast.error(error.message); return; }
                        toast.success(t("dashV2.admin.toasts.profileApproved"));
                        fetchAll();
                      }}>
                      <Check className="mr-1 h-3 w-3" /> {t("dashV2.admin.approve")}
                    </Button>
                    <Button size="sm" variant="outline" className="text-destructive border-destructive/30"
                      onClick={async () => {
                        const { error } = await supabase.from("profiles").update({ kyc_status: "rejected", is_verified: false }).eq("id", p.id);
                        if (error) { toast.error(error.message); return; }
                        toast.info(t("dashV2.admin.toasts.profileRejected"));
                        fetchAll();
                      }}>
                      <X className="mr-1 h-3 w-3" /> {t("dashV2.admin.reject")}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {section === "legal" && legalPages.map(page => (
          <div key={page.id} className="flex items-center justify-between rounded-lg border border-border bg-card p-4">
            <div>
              <h3 className="font-medium text-foreground">{page.title}</h3>
              <p className="text-xs text-muted-foreground">/{page.slug}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={page.is_published ? "default" : "secondary"} className="text-xs">{page.is_published ? t("dashV2.admin.published") : t("dashV2.admin.draft")}</Badge>
              <Button size="icon" variant="ghost" aria-label={t("dashV2.admin.editTitle")} onClick={() => openEdit({ ...page, _type: "legal" })}><Edit2 className="h-4 w-4" /></Button>
              <Button size="icon" variant="ghost" className="text-destructive" aria-label="Supprimer" onClick={() => handleDelete("legal_pages", page.id)}><Trash2 className="h-4 w-4" /></Button>
            </div>
          </div>
        ))}

        {section === "blog" && blogPosts.map(post => (
          <div key={post.id} className="flex items-center justify-between rounded-lg border border-border bg-card p-4">
            <div>
              <h3 className="font-medium text-foreground">{post.title}</h3>
              <p className="text-xs text-muted-foreground">{post.published_at ? new Date(post.published_at).toLocaleDateString("fr-FR") : t("dashV2.admin.notPublished")}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={post.is_published ? "default" : "secondary"} className="text-xs">{post.is_published ? t("dashV2.admin.published") : t("dashV2.admin.draft")}</Badge>
              <Button size="icon" variant="ghost" aria-label={t("dashV2.admin.editTitle")} onClick={() => openEdit({ ...post, _type: "blog" })}><Edit2 className="h-4 w-4" /></Button>
              <Button size="icon" variant="ghost" className="text-destructive" aria-label="Supprimer" onClick={() => handleDelete("blog_posts", post.id)}><Trash2 className="h-4 w-4" /></Button>
            </div>
          </div>
        ))}

        {section === "faq" && faqItems.map(item => (
          <div key={item.id} className="flex items-center justify-between rounded-lg border border-border bg-card p-4">
            <div>
              <h3 className="font-medium text-foreground line-clamp-1">{item.question}</h3>
              <p className="text-xs text-muted-foreground">{item.category} · Ordre: {item.sort_order}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button size="icon" variant="ghost" aria-label={t("dashV2.admin.editTitle")} onClick={() => openEdit({ ...item, _type: "faq" })}><Edit2 className="h-4 w-4" /></Button>
              <Button size="icon" variant="ghost" className="text-destructive" aria-label="Supprimer" onClick={() => handleDelete("faq_items", item.id)}><Trash2 className="h-4 w-4" /></Button>
            </div>
          </div>
        ))}

        {section === "resources" && resources.map(res => (
          <div key={res.id} className="flex items-center justify-between rounded-lg border border-border bg-card p-4">
            <div>
              <h3 className="font-medium text-foreground">{res.title}</h3>
              <p className="text-xs text-muted-foreground">{res.resource_type} · {res.target_role || t("dashV2.admin.labels.all")}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={res.is_published ? "default" : "secondary"} className="text-xs">{res.is_published ? t("dashV2.admin.published") : t("dashV2.admin.draft")}</Badge>
              <Button size="icon" variant="ghost" aria-label={t("dashV2.admin.editTitle")} onClick={() => openEdit({ ...res, _type: "resources" })}><Edit2 className="h-4 w-4" /></Button>
              <Button size="icon" variant="ghost" className="text-destructive" aria-label="Supprimer" onClick={() => handleDelete("resources", res.id)}><Trash2 className="h-4 w-4" /></Button>
            </div>
          </div>
        ))}

        {section === "mentors" && mentors.map(m => (
          <div key={m.id} className="flex items-center justify-between rounded-lg border border-border bg-card p-4">
            <div>
              <h3 className="font-medium text-foreground">{m.company_name || "Mentor"}</h3>
              <p className="text-xs text-muted-foreground">
                {m.specialty?.slice(0, 3).join(", ")} · {m.experience_years} ans
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={m.is_approved ? "default" : "secondary"} className="text-xs">{m.is_approved ? t("dashV2.admin.approved") : t("dashV2.admin.pending")}</Badge>
              {m.is_featured && <Badge className="bg-gradient-gold text-primary-foreground text-xs">⭐</Badge>}
              <Button size="icon" variant="ghost" aria-label={t("dashV2.admin.editTitle")} onClick={() => openEdit({ ...m, _type: "mentors" })}><Edit2 className="h-4 w-4" /></Button>
              <Button size="icon" variant="ghost" className="text-destructive" aria-label="Supprimer" onClick={() => handleDelete("mentors", m.id)}><Trash2 className="h-4 w-4" /></Button>
            </div>
          </div>
        ))}

        {section === "programs" && programs.map(p => (
          <div key={p.id} className="flex items-center justify-between rounded-lg border border-border bg-card p-4">
            <div>
              <h3 className="font-medium text-foreground">{p.title}</h3>
              <p className="text-xs text-muted-foreground">{p.program_type} · {p.difficulty_level} · {p.duration_hours}h</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={p.is_published ? "default" : "secondary"} className="text-xs">{p.is_published ? t("dashV2.admin.published") : t("dashV2.admin.draft")}</Badge>
              {p.is_featured && <Badge className="bg-gradient-gold text-primary-foreground text-xs">⭐</Badge>}
              <Button size="icon" variant="ghost" aria-label={t("dashV2.admin.editTitle")} onClick={() => openEdit({ ...p, _type: "programs" })}><Edit2 className="h-4 w-4" /></Button>
              <Button size="icon" variant="ghost" className="text-destructive" aria-label="Supprimer" onClick={() => handleDelete("startup_school_programs", p.id)}><Trash2 className="h-4 w-4" /></Button>
            </div>
          </div>
        ))}

        {section === "school-content" && schoolContent.map(c => (
          <div key={c.id} className="flex items-center justify-between rounded-lg border border-border bg-card p-4">
            <div>
              <h3 className="font-medium text-foreground">{c.title}</h3>
              <p className="text-xs text-muted-foreground">{c.content_type} · {c.category}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={c.is_published ? "default" : "secondary"} className="text-xs">{c.is_published ? t("dashV2.admin.published") : t("dashV2.admin.draft")}</Badge>
              {c.is_featured && <Badge className="bg-gradient-gold text-primary-foreground text-xs">⭐</Badge>}
              <Button size="icon" variant="ghost" aria-label={t("dashV2.admin.editTitle")} onClick={() => openEdit({ ...c, _type: "school-content" })}><Edit2 className="h-4 w-4" /></Button>
              <Button size="icon" variant="ghost" className="text-destructive" aria-label="Supprimer" onClick={() => handleDelete("startup_school_content", c.id)}><Trash2 className="h-4 w-4" /></Button>
            </div>
          </div>
        ))}

        {section === "kyc" && (
          <div className="space-y-3">
            {kycProfiles.filter((p) => p.kyc_status && p.kyc_status !== "verified").length === 0 && (
              <p className="text-center text-muted-foreground py-8">{t("dashV2.admin.noKycPending")}</p>
            )}
            {kycProfiles.filter((p) => p.kyc_status === "submitted").map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded-lg border border-border bg-card p-4">
                <div>
                  <h3 className="font-medium text-foreground">{p.full_name || t("dashV2.admin.noName")}</h3>
                  <p className="text-xs text-muted-foreground">{p.city || "—"} · {t("dashV2.admin.kycSubmittedOn", { date: new Date(p.updated_at).toLocaleDateString("fr-FR") })}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-yellow-500/10 text-yellow-600 text-xs">{t("dashV2.admin.pending")}</Badge>
                  <Button size="sm" variant="outline" className="text-green-600 border-green-600/30"
                    onClick={async () => {
                      await supabase.from("profiles").update({ kyc_status: "verified", is_verified: true }).eq("id", p.id);
                      toast.success(t("dashV2.admin.toasts.kycVerified", { name: p.full_name || "Profil" }));
                      fetchAll();
                    }}
                  >{t("dashV2.admin.approve")}</Button>
                  <Button size="sm" variant="outline" className="text-destructive border-destructive/30"
                    onClick={async () => {
                      await supabase.from("profiles").update({ kyc_status: "rejected", is_verified: false }).eq("id", p.id);
                      toast.info(t("dashV2.admin.toasts.kycRejected", { name: p.full_name || "Profil" }));
                      fetchAll();
                    }}
                  >{t("dashV2.admin.reject")}</Button>
                </div>
              </div>
            ))}
            {kycProfiles.filter((p) => p.kyc_status === "pending").length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-semibold text-muted-foreground mb-2">{t("dashV2.admin.kycPendingCount", { count: kycProfiles.filter((p) => p.kyc_status === "pending").length })}</h4>
                {kycProfiles.filter((p) => p.kyc_status === "pending").slice(0, 10).map((p) => (
                  <div key={p.id} className="flex items-center justify-between rounded-lg border border-border/50 bg-card/50 p-3 mb-2">
                    <div>
                      <span className="text-sm text-foreground">{p.full_name || t("dashV2.admin.noName")}</span>
                      <span className="ml-2 text-xs text-muted-foreground">{p.city || ""}</span>
                    </div>
                    <Badge variant="secondary" className="text-xs">{t("dashV2.admin.notSubmitted")}</Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {section === "services" && (
          <div className="space-y-3">
            {serviceRequests.length === 0 && (
              <p className="text-center text-muted-foreground py-8">{t("premiumService.admin.empty")}</p>
            )}
            {serviceRequests.map((r) => {
              const statusBadge: Record<string, { label: string; cls: string }> = {
                pending: { label: t("premiumService.admin.statusPending"), cls: "bg-yellow-500/10 text-yellow-600" },
                in_progress: { label: t("premiumService.admin.statusInProgress"), cls: "bg-blue-500/10 text-blue-600" },
                done: { label: t("premiumService.admin.statusDone"), cls: "bg-green-500/10 text-green-600" },
                rejected: { label: t("premiumService.admin.statusRejected"), cls: "bg-destructive/10 text-destructive" },
              };
              const badge = statusBadge[r.status] || statusBadge.pending;
              const setStatus = async (status: string) => {
                const { error } = await supabase.from("service_requests").update({ status }).eq("id", r.id);
                if (error) { toast.error(error.message); return; }
                toast.success(t("premiumService.admin.updated"));
                fetchAll();
              };
              return (
                <div key={r.id} className="rounded-lg border border-border bg-card p-4 space-y-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="space-y-1">
                      <h3 className="font-semibold text-foreground">{r.full_name}</h3>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{r.email}</span>
                        {r.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{r.phone}</span>}
                        {r.company_name && <span className="flex items-center gap-1"><Building2 className="h-3 w-3" />{r.company_name}</span>}
                        <span>{new Date(r.created_at).toLocaleString("fr-FR")}</span>
                      </div>
                    </div>
                    <Badge className={`${badge.cls} text-xs`}>{badge.label}</Badge>
                  </div>
                  <div className="text-sm">
                    <Badge variant="secondary" className="text-xs mr-2">
                      {t(`premiumService.types.${r.service_type}`, { defaultValue: r.service_type })}
                    </Badge>
                    {r.message && <p className="mt-2 text-muted-foreground whitespace-pre-wrap">{r.message}</p>}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {r.status !== "in_progress" && (
                      <Button size="sm" variant="outline" onClick={() => setStatus("in_progress")}>{t("premiumService.admin.markInProgress")}</Button>
                    )}
                    {r.status !== "done" && (
                      <Button size="sm" variant="outline" className="text-green-600 border-green-600/30" onClick={() => setStatus("done")}>
                        <Check className="mr-1 h-3 w-3" />{t("premiumService.admin.markDone")}
                      </Button>
                    )}
                    {r.status !== "rejected" && (
                      <Button size="sm" variant="outline" className="text-destructive border-destructive/30" onClick={() => setStatus("rejected")}>
                        <X className="mr-1 h-3 w-3" />{t("premiumService.admin.markRejected")}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>


      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editItem?.id ? t("dashV2.admin.editTitle") : t("dashV2.admin.createTitle")}</DialogTitle>
          </DialogHeader>
          {editItem && (
            <div className="space-y-4">
              {editItem._type === "legal" && (
                <>
                  <div className="space-y-2"><Label>{t("dashV2.admin.labels.title")}</Label><Input value={editItem.title} onChange={e => setEditItem({ ...editItem, title: e.target.value })} /></div>
                  {!editItem.id && <div className="space-y-2"><Label>{t("dashV2.admin.labels.slug")}</Label><Input value={editItem.slug} onChange={e => setEditItem({ ...editItem, slug: e.target.value })} placeholder="mon-slug" /></div>}
                  <div className="space-y-2"><Label>{t("dashV2.admin.labels.metaDesc")}</Label><Input value={editItem.meta_description || ""} onChange={e => setEditItem({ ...editItem, meta_description: e.target.value })} /></div>
                  <div className="space-y-2"><Label>{t("dashV2.admin.labels.content")}</Label><Textarea value={editItem.content} onChange={e => setEditItem({ ...editItem, content: e.target.value })} rows={15} className="font-mono text-sm" /></div>
                  <div className="flex items-center gap-2"><Switch checked={editItem.is_published} onCheckedChange={v => setEditItem({ ...editItem, is_published: v })} /><Label>{t("dashV2.admin.labels.published")}</Label></div>
                </>
              )}

              {editItem._type === "blog" && (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2"><Label>{t("dashV2.admin.labels.title")}</Label><Input value={editItem.title} onChange={e => setEditItem({ ...editItem, title: e.target.value })} /></div>
                    <div className="space-y-2">
                      <Label>{t("dashV2.admin.labels.category")}</Label>
                      <Select value={editItem.category_id || ""} onValueChange={v => setEditItem({ ...editItem, category_id: v })}>
                        <SelectTrigger><SelectValue placeholder={t("dashV2.admin.labels.none")} /></SelectTrigger>
                        <SelectContent>{blogCategories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2"><Label>{t("dashV2.admin.labels.excerpt")}</Label><Textarea value={editItem.excerpt || ""} onChange={e => setEditItem({ ...editItem, excerpt: e.target.value })} rows={2} /></div>
                  <div className="space-y-2"><Label>{t("dashV2.admin.labels.content")}</Label><Textarea value={editItem.content} onChange={e => setEditItem({ ...editItem, content: e.target.value })} rows={12} className="font-mono text-sm" /></div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2"><Label>{t("dashV2.admin.labels.metaTitle")}</Label><Input value={editItem.meta_title || ""} onChange={e => setEditItem({ ...editItem, meta_title: e.target.value })} /></div>
                    <div className="space-y-2"><Label>{t("dashV2.admin.labels.tags")}</Label><Input value={editItem.tags_str || ""} onChange={e => setEditItem({ ...editItem, tags_str: e.target.value })} placeholder="startup, afrique" /></div>
                  </div>
                  <div className="space-y-2"><Label>{t("dashV2.admin.labels.metaDesc")}</Label><Input value={editItem.meta_description || ""} onChange={e => setEditItem({ ...editItem, meta_description: e.target.value })} /></div>
                  <div className="flex items-center gap-2"><Switch checked={editItem.is_published} onCheckedChange={v => setEditItem({ ...editItem, is_published: v })} /><Label>{t("dashV2.admin.labels.published")}</Label></div>
                </>
              )}

              {editItem._type === "faq" && (
                <>
                  <div className="space-y-2"><Label>{t("dashV2.admin.labels.question")}</Label><Input value={editItem.question} onChange={e => setEditItem({ ...editItem, question: e.target.value })} /></div>
                  <div className="space-y-2"><Label>{t("dashV2.admin.labels.answer")}</Label><Textarea value={editItem.answer} onChange={e => setEditItem({ ...editItem, answer: e.target.value })} rows={5} /></div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2"><Label>{t("dashV2.admin.labels.category")}</Label><Input value={editItem.category} onChange={e => setEditItem({ ...editItem, category: e.target.value })} /></div>
                    <div className="space-y-2"><Label>{t("dashV2.admin.labels.order")}</Label><Input type="number" value={editItem.sort_order} onChange={e => setEditItem({ ...editItem, sort_order: parseInt(e.target.value) || 0 })} /></div>
                  </div>
                  <div className="flex items-center gap-2"><Switch checked={editItem.is_published} onCheckedChange={v => setEditItem({ ...editItem, is_published: v })} /><Label>{t("dashV2.admin.labels.published")}</Label></div>
                </>
              )}

              {editItem._type === "resources" && (
                <>
                  <div className="space-y-2"><Label>{t("dashV2.admin.labels.title")}</Label><Input value={editItem.title} onChange={e => setEditItem({ ...editItem, title: e.target.value })} /></div>
                  <div className="space-y-2"><Label>{t("dashV2.admin.labels.description")}</Label><Textarea value={editItem.description || ""} onChange={e => setEditItem({ ...editItem, description: e.target.value })} rows={2} /></div>
                  <div className="space-y-2"><Label>{t("dashV2.admin.labels.content")}</Label><Textarea value={editItem.content || ""} onChange={e => setEditItem({ ...editItem, content: e.target.value })} rows={10} className="font-mono text-sm" /></div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>{t("dashV2.admin.labels.type")}</Label>
                      <Select value={editItem.resource_type} onValueChange={v => setEditItem({ ...editItem, resource_type: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="guide">Guide</SelectItem>
                          <SelectItem value="documentation">Documentation</SelectItem>
                          <SelectItem value="tool">{t("dashV2.admin.labels.tool")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>{t("dashV2.admin.labels.targetRole")}</Label>
                      <Select value={editItem.target_role || ""} onValueChange={v => setEditItem({ ...editItem, target_role: v })}>
                        <SelectTrigger><SelectValue placeholder={t("dashV2.admin.labels.all")} /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="startup">Startup</SelectItem>
                          <SelectItem value="talent">Talent</SelectItem>
                          <SelectItem value="investor">{t("dashV2.admin.labels.investisseur")}</SelectItem>
                          <SelectItem value="partner">{t("dashV2.admin.labels.partenaire")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex items-center gap-2"><Switch checked={editItem.is_published} onCheckedChange={v => setEditItem({ ...editItem, is_published: v })} /><Label>{t("dashV2.admin.labels.published")}</Label></div>
                </>
              )}

              {editItem._type === "mentors" && (
                <>
                  <div className="space-y-2"><Label>{t("dashV2.admin.labels.userId")}</Label><Input value={editItem.user_id} onChange={e => setEditItem({ ...editItem, user_id: e.target.value })} placeholder="uuid de l'utilisateur" /></div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2"><Label>{t("dashV2.admin.labels.company")}</Label><Input value={editItem.company_name || ""} onChange={e => setEditItem({ ...editItem, company_name: e.target.value })} /></div>
                    <div className="space-y-2"><Label>{t("dashV2.admin.labels.expYears")}</Label><Input type="number" value={editItem.experience_years} onChange={e => setEditItem({ ...editItem, experience_years: parseInt(e.target.value) || 0 })} /></div>
                  </div>
                  <div className="space-y-2"><Label>{t("dashV2.admin.labels.specialties")}</Label><Input value={editItem.specialty_str || ""} onChange={e => setEditItem({ ...editItem, specialty_str: e.target.value })} placeholder="Fintech, Marketing, Growth" /></div>
                  <div className="space-y-2"><Label>{t("dashV2.admin.labels.bio")}</Label><Textarea value={editItem.bio || ""} onChange={e => setEditItem({ ...editItem, bio: e.target.value })} rows={4} /></div>
                  <div className="space-y-2"><Label>{t("dashV2.admin.labels.achievements")}</Label><Textarea value={editItem.achievements || ""} onChange={e => setEditItem({ ...editItem, achievements: e.target.value })} rows={3} /></div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2"><Label>{t("dashV2.admin.labels.hourlyRate")}</Label><Input type="number" value={editItem.hourly_rate} onChange={e => setEditItem({ ...editItem, hourly_rate: parseInt(e.target.value) || 0 })} /></div>
                    <div className="space-y-2">
                      <Label>{t("dashV2.admin.labels.availability")}</Label>
                      <Select value={editItem.availability || "available"} onValueChange={v => setEditItem({ ...editItem, availability: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="available">{t("dashV2.admin.labels.available")}</SelectItem>
                          <SelectItem value="busy">{t("dashV2.admin.labels.busy")}</SelectItem>
                          <SelectItem value="unavailable">{t("dashV2.admin.labels.unavailable")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2"><Label>LinkedIn URL</Label><Input value={editItem.linkedin_url || ""} onChange={e => setEditItem({ ...editItem, linkedin_url: e.target.value })} /></div>
                    <div className="space-y-2"><Label>{t("dashV2.admin.labels.website")}</Label><Input value={editItem.website_url || ""} onChange={e => setEditItem({ ...editItem, website_url: e.target.value })} /></div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2"><Switch checked={editItem.is_approved} onCheckedChange={v => setEditItem({ ...editItem, is_approved: v })} /><Label>{t("dashV2.admin.approved")}</Label></div>
                    <div className="flex items-center gap-2"><Switch checked={editItem.is_featured} onCheckedChange={v => setEditItem({ ...editItem, is_featured: v })} /><Label>{t("dashV2.admin.labels.featured")}</Label></div>
                  </div>
                </>
              )}

              {editItem._type === "programs" && (
                <>
                  <div className="space-y-2"><Label>{t("dashV2.admin.labels.title")}</Label><Input value={editItem.title} onChange={e => setEditItem({ ...editItem, title: e.target.value })} /></div>
                  <div className="space-y-2"><Label>{t("dashV2.admin.labels.description")}</Label><Textarea value={editItem.description || ""} onChange={e => setEditItem({ ...editItem, description: e.target.value })} rows={4} /></div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>{t("dashV2.admin.labels.type")}</Label>
                      <Select value={editItem.program_type || "course"} onValueChange={v => setEditItem({ ...editItem, program_type: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="course">{t("dashV2.admin.labels.course")}</SelectItem>
                          <SelectItem value="masterclass">Masterclass</SelectItem>
                          <SelectItem value="workshop">{t("dashV2.admin.labels.workshop")}</SelectItem>
                          <SelectItem value="bootcamp">Bootcamp</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>{t("dashV2.admin.labels.level")}</Label>
                      <Select value={editItem.difficulty_level || "beginner"} onValueChange={v => setEditItem({ ...editItem, difficulty_level: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="beginner">{t("dashV2.admin.labels.beginner")}</SelectItem>
                          <SelectItem value="intermediate">{t("dashV2.admin.labels.intermediate")}</SelectItem>
                          <SelectItem value="advanced">{t("dashV2.admin.labels.advanced")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-2"><Label>{t("dashV2.admin.labels.durationHours")}</Label><Input type="number" value={editItem.duration_hours} onChange={e => setEditItem({ ...editItem, duration_hours: parseInt(e.target.value) || 0 })} /></div>
                    <div className="space-y-2"><Label>{t("dashV2.admin.labels.modulesCount")}</Label><Input type="number" value={editItem.modules_count} onChange={e => setEditItem({ ...editItem, modules_count: parseInt(e.target.value) || 0 })} /></div>
                    <div className="space-y-2"><Label>{t("dashV2.admin.labels.price")}</Label><Input type="number" value={editItem.price} onChange={e => setEditItem({ ...editItem, price: parseInt(e.target.value) || 0 })} /></div>
                  </div>
                  <div className="space-y-2"><Label>{t("dashV2.admin.labels.coverImage")}</Label><Input value={editItem.cover_image_url || ""} onChange={e => setEditItem({ ...editItem, cover_image_url: e.target.value })} /></div>
                  <div className="space-y-2"><Label>{t("dashV2.admin.labels.tagsCommas")}</Label><Input value={editItem.tags_str || ""} onChange={e => setEditItem({ ...editItem, tags_str: e.target.value })} placeholder="levée de fonds, pitch" /></div>
                  <div className="space-y-2">
                    <Label>{t("dashV2.admin.labels.associatedMentor")}</Label>
                    <Select value={editItem.mentor_id || ""} onValueChange={v => setEditItem({ ...editItem, mentor_id: v })}>
                      <SelectTrigger><SelectValue placeholder={t("dashV2.admin.labels.none")} /></SelectTrigger>
                      <SelectContent>
                        {mentors.filter(m => m.is_approved).map(m => (
                          <SelectItem key={m.id} value={m.id}>{m.company_name || m.id.slice(0, 8)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2"><Switch checked={editItem.is_published} onCheckedChange={v => setEditItem({ ...editItem, is_published: v })} /><Label>{t("dashV2.admin.labels.published")}</Label></div>
                    <div className="flex items-center gap-2"><Switch checked={editItem.is_featured} onCheckedChange={v => setEditItem({ ...editItem, is_featured: v })} /><Label>{t("dashV2.admin.labels.featured")}</Label></div>
                  </div>
                </>
              )}

              {editItem._type === "school-content" && (
                <>
                  <div className="space-y-2"><Label>{t("dashV2.admin.labels.title")}</Label><Input value={editItem.title} onChange={e => setEditItem({ ...editItem, title: e.target.value })} /></div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>{t("dashV2.admin.labels.contentType")}</Label>
                      <Select value={editItem.content_type || "article"} onValueChange={v => setEditItem({ ...editItem, content_type: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="article">{t("dashV2.admin.labels.article")}</SelectItem>
                          <SelectItem value="video">{t("dashV2.admin.labels.video")}</SelectItem>
                          <SelectItem value="podcast">{t("dashV2.admin.labels.podcast")}</SelectItem>
                          <SelectItem value="testimonial">{t("dashV2.admin.labels.testimonial")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2"><Label>{t("dashV2.admin.labels.contentCategory")}</Label><Input value={editItem.category || ""} onChange={e => setEditItem({ ...editItem, category: e.target.value })} placeholder="general, fundraising..." /></div>
                  </div>
                  <div className="space-y-2"><Label>{t("dashV2.admin.labels.excerpt")}</Label><Textarea value={editItem.excerpt || ""} onChange={e => setEditItem({ ...editItem, excerpt: e.target.value })} rows={2} /></div>
                  <div className="space-y-2"><Label>{t("dashV2.admin.labels.content")}</Label><Textarea value={editItem.content || ""} onChange={e => setEditItem({ ...editItem, content: e.target.value })} rows={10} className="font-mono text-sm" /></div>
                  <div className="space-y-2"><Label>{t("dashV2.admin.labels.videoUrl")}</Label><Input value={editItem.video_url || ""} onChange={e => setEditItem({ ...editItem, video_url: e.target.value })} placeholder="https://youtube.com/..." /></div>
                  <div className="space-y-2"><Label>{t("dashV2.admin.labels.coverImage")}</Label><Input value={editItem.cover_image_url || ""} onChange={e => setEditItem({ ...editItem, cover_image_url: e.target.value })} /></div>
                  <div className="space-y-2"><Label>{t("dashV2.admin.labels.tagsCommas")}</Label><Input value={editItem.tags_str || ""} onChange={e => setEditItem({ ...editItem, tags_str: e.target.value })} /></div>
                  <div className="space-y-2">
                    <Label>{t("dashV2.admin.labels.associatedMentor")}</Label>
                    <Select value={editItem.mentor_id || ""} onValueChange={v => setEditItem({ ...editItem, mentor_id: v })}>
                      <SelectTrigger><SelectValue placeholder={t("dashV2.admin.labels.none")} /></SelectTrigger>
                      <SelectContent>
                        {mentors.filter(m => m.is_approved).map(m => (
                          <SelectItem key={m.id} value={m.id}>{m.company_name || m.id.slice(0, 8)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2"><Switch checked={editItem.is_published} onCheckedChange={v => setEditItem({ ...editItem, is_published: v })} /><Label>{t("dashV2.admin.labels.published")}</Label></div>
                    <div className="flex items-center gap-2"><Switch checked={editItem.is_featured} onCheckedChange={v => setEditItem({ ...editItem, is_featured: v })} /><Label>{t("dashV2.admin.labels.featured")}</Label></div>
                  </div>
                </>
              )}

              <Button onClick={saveEdit} className="w-full bg-gradient-gold text-primary-foreground font-semibold">
                <Save className="mr-2 h-4 w-4" /> {t("dashV2.admin.saveBtn")}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default AdminTab;
