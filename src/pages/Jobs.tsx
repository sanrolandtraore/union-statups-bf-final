import { CardSkeleton } from "@/components/ui/loading-skeletons";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Briefcase, Search, Plus } from "lucide-react";
import { motion } from "framer-motion";
import Navbar from "@/components/landing/Navbar";
import BackButton from "@/components/ui/back-button";
import CreateJobDialog from "@/components/jobs/CreateJobDialog";
import JobCard from "@/components/jobs/JobCard";

import type { Database } from "@/integrations/supabase/types";

type Job = Database["public"]["Tables"]["jobs"]["Row"];
type JobType = Database["public"]["Enums"]["job_type"];

const jobTypeLabels: Record<string, string> = {
  emploi: "Emploi",
  mission: "Mission freelance",
  stage: "Stage",
  cofounder: "Co-fondateur",
  advisory: "Advisory",
};

const PAGE_SIZE = 20;

const Jobs = () => {
  const { role } = useAuth();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [showCreate, setShowCreate] = useState(false);

  const fetchJobs = async (page = 0) => {
    if (page === 0) setLoading(true); else setLoadingMore(true);
    let query = supabase.from("jobs").select("*").eq("is_active", true).order("created_at", { ascending: false });
    
    if (typeFilter !== "all") {
      query = query.eq("job_type", typeFilter as JobType);
    }

    const { data, error } = await query.range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);
    if (error) {
      toast.error("Erreur lors du chargement des offres");
    } else {
      setJobs((prev) => (page === 0 ? (data || []) : [...prev, ...(data || [])]));
      setHasMore((data || []).length === PAGE_SIZE);
    }
    setLoading(false);
    setLoadingMore(false);
  };

  useEffect(() => {
    fetchJobs(0);
  }, [typeFilter]);

  const loadMore = () => fetchJobs(Math.ceil(jobs.length / PAGE_SIZE));

  const filteredJobs = jobs.filter((j) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      j.title?.toLowerCase().includes(s) ||
      j.company_name?.toLowerCase().includes(s) ||
      j.sector?.toLowerCase().includes(s) ||
      j.city?.toLowerCase().includes(s) ||
      (j.skills_required || []).some((sk: string) => sk.toLowerCase().includes(s))
    );
  });

  const canPost = role === "startup" || role === "admin";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto max-w-6xl px-4 pt-24 pb-16">
        <BackButton fallbackTo="/" />
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">
              <Briefcase className="mr-3 inline h-8 w-8 text-primary" />
              Startup Jobs
            </h1>
            <p className="mt-2 text-muted-foreground">
              Emplois, missions, stages et opportunités co-fondateur dans l'écosystème startup
            </p>
          </div>
          {canPost && (
            <Button onClick={() => setShowCreate(true)} className="bg-gradient-gold text-primary-foreground">
              <Plus className="mr-2 h-4 w-4" /> Publier une offre
            </Button>
          )}
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher par titre, compétence, ville..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Type d'offre" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les types</SelectItem>
              <SelectItem value="emploi">Emploi</SelectItem>
              <SelectItem value="mission">Mission freelance</SelectItem>
              <SelectItem value="stage">Stage</SelectItem>
              <SelectItem value="cofounder">Co-fondateur</SelectItem>
              <SelectItem value="advisory">Advisory</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Stats */}
        <div className="mb-6 flex gap-2 flex-wrap">
          {Object.entries(jobTypeLabels).map(([key, label]) => {
            const count = jobs.filter((j) => j.job_type === key).length;
            return (
              <Badge key={key} variant={typeFilter === key ? "default" : "outline"} className="cursor-pointer" onClick={() => setTypeFilter(typeFilter === key ? "all" : key)}>
                {label} ({count})
              </Badge>
            );
          })}
        </div>

        {/* Job list */}
        {loading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-12 text-center">
            <Briefcase className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="text-lg font-semibold text-foreground">Aucune offre trouvée</h3>
            <p className="text-muted-foreground">
              {canPost ? "Soyez le premier à publier une offre !" : "Revenez bientôt pour de nouvelles opportunités."}
            </p>
          </div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2">
              {filteredJobs.map((job, i) => (
                <motion.div key={job.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <JobCard job={job} onApply={() => navigate(`/jobs/${job.id}`)} />
                </motion.div>
              ))}
            </div>
            {hasMore && (
              <div className="mt-6 flex justify-center">
                <Button variant="outline" onClick={loadMore} disabled={loadingMore}>
                  {loadingMore ? "Chargement..." : "Charger plus d'offres"}
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      <CreateJobDialog open={showCreate} onOpenChange={setShowCreate} onCreated={fetchJobs} />
    </div>
  );
};

export default Jobs;
