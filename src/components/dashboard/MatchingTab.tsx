import { TabSkeleton } from "@/components/ui/loading-skeletons";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { motion } from "framer-motion";
import { Target, MapPin, Briefcase, UsersRound, BarChart3, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import ProfileDetailDialog from "./ProfileDetailDialog";
import PaywallGuard from "@/components/paywall/PaywallGuard";

interface MatchResult {
  score: number;
  matchType: "talent" | "startup";
  user_id?: string;
  profile: { full_name: string | null; city: string | null; avatar_url: string | null; bio: string | null } | null;
  title?: string | null;
  skills?: string[] | null;
  experience_years?: number | null;
  availability?: string | null;
  company_name?: string | null;
  sector?: string | null;
  looking_for?: string[] | null;
  funding_stage?: string | null;
  team_size?: number | null;
  pitch?: string | null;
}

const MatchingTab = () => {
  const { session } = useAuth();
  const { isPro } = useSubscription();
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    if (!session) return;
    const fetchMatches = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke("match-profiles", {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (error) throw error;
        setMatches(data.matches || []);
        setMessage(data.message || null);
      } catch (err) {
        console.error("Matching error:", err);
        setMessage("Erreur lors du chargement des matchs");
      }
      setLoading(false);
    };
    fetchMatches();
  }, [session]);

  const getScoreColor = (score: number) => {
    if (score >= 70) return "text-green-400";
    if (score >= 40) return "text-primary";
    return "text-muted-foreground";
  };

  if (loading) {
    return <TabSkeleton />;
  }

  // Show first 3 matches for free, rest behind paywall
  const freePreviewCount = isPro ? matches.length : 3;
  const visibleMatches = matches.slice(0, freePreviewCount);
  const lockedMatches = matches.slice(freePreviewCount);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-4xl">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-gold">
          <Target className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">Matching</h1>
          <p className="text-muted-foreground">Profils compatibles triés par score</p>
        </div>
      </div>

      {message && matches.length === 0 && (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <Target className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <p className="text-lg text-muted-foreground">{message}</p>
        </div>
      )}

      <div className="space-y-4">
        {visibleMatches.map((match, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="cursor-pointer rounded-xl border border-border bg-card p-6 transition-colors hover:border-primary/30"
            onClick={() => { if (match.user_id) { setSelectedUserId(match.user_id); setDialogOpen(true); } }}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="mb-2 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-sm font-bold text-foreground">
                    {(match.profile?.full_name || match.company_name || "?")[0]?.toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-semibold text-foreground">
                      {match.matchType === "startup" ? match.company_name : match.profile?.full_name || "Anonyme"}
                    </h3>
                    {match.matchType === "talent" && match.title && (
                      <p className="text-sm text-muted-foreground">{match.title}</p>
                    )}
                    {match.matchType === "startup" && match.sector && (
                      <p className="text-sm text-muted-foreground">{match.sector}</p>
                    )}
                  </div>
                </div>

                {match.profile?.city && (
                  <p className="mb-2 flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="h-3 w-3" /> {match.profile.city}
                  </p>
                )}

                {match.matchType === "startup" && match.pitch && (
                  <p className="mb-3 text-sm text-foreground/80">{match.pitch}</p>
                )}

                {match.matchType === "startup" && match.looking_for && match.looking_for.length > 0 && (
                  <div className="mb-2 flex flex-wrap gap-1">
                    <Briefcase className="mr-1 h-4 w-4 text-muted-foreground" />
                    {match.looking_for.map((item, j) => (
                      <Badge key={j} variant="secondary" className="text-xs">{item}</Badge>
                    ))}
                  </div>
                )}

                {match.matchType === "talent" && match.skills && match.skills.length > 0 && (
                  <div className="mb-2 flex flex-wrap gap-1">
                    {match.skills.map((skill, j) => (
                      <Badge key={j} variant="secondary" className="text-xs">{skill}</Badge>
                    ))}
                  </div>
                )}

                <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                  {match.matchType === "talent" && match.experience_years && (
                    <span className="flex items-center gap-1"><BarChart3 className="h-3 w-3" /> {match.experience_years} ans</span>
                  )}
                  {match.matchType === "startup" && match.team_size && (
                    <span className="flex items-center gap-1"><UsersRound className="h-3 w-3" /> {match.team_size} membres</span>
                  )}
                  {match.matchType === "startup" && match.funding_stage && (
                    <span>{match.funding_stage}</span>
                  )}
                  {match.matchType === "talent" && match.availability && (
                    <span>{match.availability}</span>
                  )}
                </div>
              </div>

              {/* Score - show detailed only for pro */}
              <div className="ml-4 text-right">
                <div className={`font-display text-2xl font-bold ${getScoreColor(match.score)}`}>
                  {isPro ? `${match.score}%` : "??"}
                </div>
                <p className="text-xs text-muted-foreground">
                  {isPro ? "compatibilité" : <Lock className="inline h-3 w-3" />}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Locked matches paywall */}
      {lockedMatches.length > 0 && (
        <div className="mt-6">
          <PaywallGuard allowed={false} feature="le matching détaillé" blur={true}>
            <div className="space-y-4">
              {lockedMatches.slice(0, 3).map((match, i) => (
                <div key={i} className="rounded-xl border border-border bg-card p-6">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-secondary" />
                    <div className="flex-1">
                      <div className="h-4 w-32 rounded bg-secondary" />
                      <div className="mt-2 h-3 w-24 rounded bg-secondary" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </PaywallGuard>
        </div>
      )}

      <ProfileDetailDialog open={dialogOpen} onOpenChange={setDialogOpen} userId={selectedUserId} />
    </motion.div>
  );
};

export default MatchingTab;
