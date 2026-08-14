import { TabSkeleton } from "@/components/ui/loading-skeletons";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { MessageSquareMore, Check, X, Clock, Star } from "lucide-react";
import ProfileDetailDialog from "./ProfileDetailDialog";
import UpgradeDialog from "@/components/paywall/UpgradeDialog";

interface ContactRequest {
  id: string;
  sender_id: string;
  receiver_id: string;
  message: string | null;
  status: string;
  created_at: string;
  senderName?: string;
  receiverName?: string;
}

const ContactsTab = () => {
  const { user } = useAuth();
  const { limits, usage } = useSubscription();
  const [received, setReceived] = useState<ContactRequest[]>([]);
  const [sent, setSent] = useState<ContactRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  const contactsUsed = usage["contact_request"] || 0;
  const contactsLimit = limits.contacts_per_month;
  const contactsRemaining = contactsLimit === -1 ? "∞" : Math.max(0, contactsLimit - contactsUsed);

  const fetchContacts = async () => {
    if (!user) return;
    setLoading(true);

    const [{ data: receivedData }, { data: sentData }, { data: profiles }] = await Promise.all([
      supabase.from("contact_requests").select("*").eq("receiver_id", user.id).order("created_at", { ascending: false }),
      supabase.from("contact_requests").select("*").eq("sender_id", user.id).order("created_at", { ascending: false }),
      supabase.from("profiles").select("user_id, full_name"),
    ]);

    const nameMap = new Map((profiles || []).map(p => [p.user_id, p.full_name || "Anonyme"]));

    setReceived((receivedData || []).map(r => ({
      ...r,
      senderName: nameMap.get(r.sender_id) || "Anonyme",
    })));
    setSent((sentData || []).map(s => ({
      ...s,
      receiverName: nameMap.get(s.receiver_id) || "Anonyme",
    })));
    setLoading(false);
  };

  useEffect(() => { fetchContacts(); }, [user]);

  const handleUpdateStatus = async (requestId: string, status: "accepted" | "declined") => {
    const { error } = await supabase
      .from("contact_requests")
      .update({ status })
      .eq("id", requestId);
    if (error) {
      toast.error("Erreur lors de la mise à jour");
    } else {
      toast.success(status === "accepted" ? "Contact accepté !" : "Demande déclinée");
      fetchContacts();
    }
  };

  const statusIcon = (status: string) => {
    if (status === "pending") return <Clock className="h-4 w-4 text-primary" />;
    if (status === "accepted") return <Check className="h-4 w-4 text-green-400" />;
    return <X className="h-4 w-4 text-destructive" />;
  };

  const statusLabel = (status: string) => {
    if (status === "pending") return "En attente";
    if (status === "accepted") return "Accepté";
    return "Décliné";
  };

  if (loading) {
    return <TabSkeleton />;
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-3xl">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-gold">
          <MessageSquareMore className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">Contacts</h1>
          <p className="text-muted-foreground">Gérez vos demandes de mise en relation</p>
        </div>
      </div>

      {/* Usage indicator */}
      <div className="mb-6 flex items-center justify-between rounded-xl border border-border bg-card px-5 py-3">
        <div className="flex items-center gap-2 text-sm">
          <MessageSquareMore className="h-4 w-4 text-primary" />
          <span className="text-foreground">Demandes ce mois</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-foreground">
            {contactsUsed} / {contactsLimit === -1 ? "∞" : contactsLimit}
          </span>
          {contactsLimit !== -1 && contactsRemaining === 0 && (
            <Button
              size="sm"
              onClick={() => setUpgradeOpen(true)}
              className="bg-gradient-gold text-primary-foreground text-xs"
            >
              <Star className="mr-1 h-3 w-3" /> Débloquer
            </Button>
          )}
        </div>
      </div>

      {/* Received requests */}
      <div className="mb-8">
        <h2 className="mb-4 font-display text-lg font-semibold text-foreground">Demandes reçues</h2>
        {received.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-6 text-center text-muted-foreground">
            Aucune demande reçue
          </div>
        ) : (
          <div className="space-y-3">
            {received.map((req) => (
              <div key={req.id} className="flex items-center gap-4 rounded-xl border border-border bg-card p-4">
                <button
                  onClick={() => { setSelectedUserId(req.sender_id); setDialogOpen(true); }}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-bold text-foreground hover:ring-2 hover:ring-primary/50"
                >
                  {req.senderName?.[0]?.toUpperCase() || "?"}
                </button>
                <div className="flex-1 min-w-0">
                  <button
                    onClick={() => { setSelectedUserId(req.sender_id); setDialogOpen(true); }}
                    className="font-medium text-foreground hover:text-primary"
                  >
                    {req.senderName}
                  </button>
                  {req.message && <p className="truncate text-sm text-muted-foreground">{req.message}</p>}
                  <p className="text-xs text-muted-foreground">{new Date(req.created_at).toLocaleDateString("fr-FR")}</p>
                </div>
                <div className="flex items-center gap-2">
                  {req.status === "pending" ? (
                    <>
                      <Button size="sm" variant="outline" onClick={() => handleUpdateStatus(req.id, "declined")}>
                        <X className="h-4 w-4" />
                      </Button>
                      <Button size="sm" className="bg-gradient-gold text-primary-foreground" onClick={() => handleUpdateStatus(req.id, "accepted")}>
                        <Check className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <div className="flex items-center gap-1 text-xs">
                      {statusIcon(req.status)}
                      <span className="text-muted-foreground">{statusLabel(req.status)}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sent requests */}
      <div>
        <h2 className="mb-4 font-display text-lg font-semibold text-foreground">Demandes envoyées</h2>
        {sent.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-6 text-center text-muted-foreground">
            Aucune demande envoyée
          </div>
        ) : (
          <div className="space-y-3">
            {sent.map((req) => (
              <div key={req.id} className="flex items-center gap-4 rounded-xl border border-border bg-card p-4">
                <button
                  onClick={() => { setSelectedUserId(req.receiver_id); setDialogOpen(true); }}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-bold text-foreground hover:ring-2 hover:ring-primary/50"
                >
                  {req.receiverName?.[0]?.toUpperCase() || "?"}
                </button>
                <div className="flex-1 min-w-0">
                  <button
                    onClick={() => { setSelectedUserId(req.receiver_id); setDialogOpen(true); }}
                    className="font-medium text-foreground hover:text-primary"
                  >
                    {req.receiverName}
                  </button>
                  {req.message && <p className="truncate text-sm text-muted-foreground">{req.message}</p>}
                  <p className="text-xs text-muted-foreground">{new Date(req.created_at).toLocaleDateString("fr-FR")}</p>
                </div>
                <div className="flex items-center gap-1 text-xs">
                  {statusIcon(req.status)}
                  <span className="text-muted-foreground">{statusLabel(req.status)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ProfileDetailDialog open={dialogOpen} onOpenChange={setDialogOpen} userId={selectedUserId} />
      <UpgradeDialog open={upgradeOpen} onOpenChange={setUpgradeOpen} feature="les demandes de contact" />
    </motion.div>
  );
};

export default ContactsTab;
