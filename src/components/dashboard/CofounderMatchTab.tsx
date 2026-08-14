import { TabSkeleton } from "@/components/ui/loading-skeletons";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import { Handshake, MapPin, Brain, Heart, Eye, ShieldCheck, Wand2, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import ProfileDetailDialog from "./ProfileDetailDialog";
import { toast } from "sonner";

interface CofounderMatch {
  user_id: string;
  score: number;
  skills_complementarity: number;
  personality_fit: number;
  product_vision: number;
  risk_tolerance: number;
  reason: string;
  profile: { full_name: string | null; city: string | null; avatar_url: string | null; bio: string | null };
  role: string;
  roleProfile: Record<string, unknown> | null;
  projects: { title: string; sector: string | null; description: string | null }[];
}

const factorConfig: { key: "skills_complementarity" | "personality_fit" | "product_vision" | "risk_tolerance"; label: string; icon: typeof Brain; color: string }[] = [
  { key: "skills_complementarity", label: "Compétences", icon: Brain, color: "text-blue-400" },
  { key: "personality_fit", label: "Personnalité", icon: Heart, color: "text-pink-400" },
  { key: "product_vision", label: "Vision", icon: Eye, color: "text-emerald-400" },
  { key: "risk_tolerance", label: "Risque", icon: ShieldCheck, color: "text-amber-400" },
];

const CofounderMatchTab = () => {
  const { session } = useAuth();
  const [matches, setMatches] = useState<CofounderMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchMatches = async () => {
    if (!session) return;
    setLoading(true);
    setMessage(null);
    try {
      const { data, error } = await supabase.functions.invoke("ai-cofounder-match", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (error) throw error;
      if (data.error) {
        toast.error(data.error);
        setMatches([]);
      } else {
        setMatches(data.matches || []);
        setMessage(data.message || null);
      }
    } catch (err) {
      console.error("Cofounder match error:", err);
      toast.error("Erreur lors de l'analyse IA");
    }
    setLoading(false);
  };

  useEffect(() => { fetchMatches(); }, [session]);

  const getScoreColor = (score: number) => {
    if (score >= 70) return "text-green-400";
    if (score >= 40) return "text-primary";
    return "text-muted-foreground";
  };

  const roleLabels: Record<string, string> = {
    talent: "Talent", startup: "Startup", investor: "Investisseur", partner: "Partenaire",
  };

  if (loading) {
    return <TabSkeleton />;
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-4xl">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
            <Handshake className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">Co-fondateur IA</h1>
            <p className="text-muted-foreground">Détection automatique de co-fondateurs compatibles</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={fetchMatches} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Relancer
        </Button>
      </div>

      {/* Factors legend */}
      <div className="mb-6 grid grid-cols-2 gap-2 rounded-xl border border-border bg-card p-4 sm:grid-cols-4">
        {factorConfig.map(f => (
          <div key={f.key} className="flex items-center gap-2 text-xs">
            <f.icon className={`h-4 w-4 ${f.color}`} />
            <span className="text-muted-foreground">{f.label} /25</span>
          </div>
        ))}
      </div>

      {message && matches.length === 0 && (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <Wand2 className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <p className="text-lg text-muted-foreground">{message}</p>
        </div>
      )}

      <div className="space-y-4">
        {matches.map((match, i) => (
          <motion.div
            key={match.user_id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="cursor-pointer rounded-xl border border-border bg-card p-6 transition-colors hover:border-primary/30"
            onClick={() => { setSelectedUserId(match.user_id); setDialogOpen(true); }}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="mb-3 flex items-center gap-3">
                  {match.profile.avatar_url ? (
                    <img src={match.profile.avatar_url} alt="" className="h-12 w-12 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-lg font-bold text-foreground">
                      {(match.profile.full_name || "?")[0]?.toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h3 className="font-display text-lg font-semibold text-foreground">
                      {match.profile.full_name || "Anonyme"}
                    </h3>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">{roleLabels[match.role] || match.role}</Badge>
                      {match.profile.city && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" /> {match.profile.city}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* AI reason */}
                <p className="mb-3 text-sm text-foreground/80 italic">"{match.reason}"</p>

                {/* Factor scores */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-4">
                  {factorConfig.map(f => {
                    const value = match[f.key];
                    return (
                      <div key={f.key} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className={f.color}>{f.label}</span>
                          <span className="font-medium text-foreground">{value}/25</span>
                        </div>
                        <Progress value={(value / 25) * 100} className="h-1.5" />
                      </div>
                    );
                  })}
                </div>

                {/* Projects */}
                {match.projects.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {match.projects.map((p, j) => (
                      <Badge key={j} variant="outline" className="text-xs">
                        {p.title}{p.sector ? ` · ${p.sector}` : ""}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Total score */}
              <div className="text-right">
                <div className={`font-display text-3xl font-bold ${getScoreColor(match.score)}`}>
                  {match.score}%
                </div>
                <p className="text-xs text-muted-foreground">compatibilité</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <ProfileDetailDialog open={dialogOpen} onOpenChange={setDialogOpen} userId={selectedUserId} />
    </motion.div>
  );
};

export default CofounderMatchTab;
