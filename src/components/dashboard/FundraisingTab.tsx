import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  TrendingUp, Plus, Search, MapPin, Users,
  Building2, Target, Send, Loader2, Upload,
  Edit, Trash2, MessageSquare, Clock, CheckCircle, XCircle, Rocket,
} from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type FundraisingCampaign = Database["public"]["Tables"]["fundraising_campaigns"]["Row"];

const SECTORS = ["fintech", "healthtech", "edtech", "saas", "marketplace", "deeptech", "greentech", "foodtech", "proptech", "legaltech", "insurtech", "other"];
const STAGES = ["pre-seed", "seed", "series-a", "series-b", "series-c", "growth"];

const FundraisingTab = () => {
  const { t } = useTranslation();
  const { user, role } = useAuth();
  const queryClient = useQueryClient();
  const isStartup = role === "startup" || role === "admin";
  const isInvestor = role === "investor" || role === "admin";

  const [activeView, setActiveView] = useState(isStartup ? "my-campaigns" : "browse");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showInterestDialog, setShowInterestDialog] = useState<string | null>(null);
  const [editingCampaign, setEditingCampaign] = useState<FundraisingCampaign | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSector, setFilterSector] = useState("");
  const [filterStage, setFilterStage] = useState("");

  // Form state for campaign creation/edit
  const [form, setForm] = useState({
    title: "", description: "", sector: "", stage: "pre-seed",
    target_amount: "", min_ticket: "", valuation: "", equity_offered: "",
    company_name: "", city: "", team_size: "", revenue_monthly: "",
    traction: "", use_of_funds: "", timeline: "",
  });

  // Interest form
  const [interestForm, setInterestForm] = useState({ message: "", proposed_amount: "" });

  // Pitch deck (upload de fichier, remplace l'ancien champ URL en texte libre)
  const [pitchDeckFile, setPitchDeckFile] = useState<File | null>(null);
  const [uploadingDeck, setUploadingDeck] = useState(false);
  const PITCH_DECK_TYPES = ["application/pdf", "application/vnd.ms-powerpoint", "application/vnd.openxmlformats-officedocument.presentationml.presentation"];
  const MAX_PITCH_DECK_SIZE = 20 * 1024 * 1024;

  const handlePitchDeckChange = (file: File | null) => {
    if (!file) return setPitchDeckFile(null);
    if (!PITCH_DECK_TYPES.includes(file.type)) return toast.error("Format non supporté. Utilisez PDF, PPT ou PPTX.");
    if (file.size > MAX_PITCH_DECK_SIZE) return toast.error("Fichier trop volumineux. Taille maximale : 20 Mo.");
    setPitchDeckFile(file);
  };

  const viewPitchDeck = async (path: string) => {
    const { data, error } = await supabase.storage.from("pitch-decks").createSignedUrl(path, 300);
    if (error || !data) return toast.error("Impossible d'ouvrir le pitch deck");
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  };

  const resetForm = () => setForm({
    title: "", description: "", sector: "", stage: "pre-seed",
    target_amount: "", min_ticket: "", valuation: "", equity_offered: "",
    company_name: "", city: "", team_size: "", revenue_monthly: "",
    traction: "", use_of_funds: "", timeline: "",
  });

  // Fetch my campaigns (startup view)
  const { data: myCampaigns = [] } = useQuery({
    queryKey: ["my-fundraising-campaigns", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from("fundraising_campaigns")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!user && isStartup,
  });

  // Fetch interests on my campaigns
  const { data: myInterests = [] } = useQuery({
    queryKey: ["my-campaign-interests", user?.id],
    queryFn: async () => {
      if (!user || myCampaigns.length === 0) return [];
      const campaignIds = myCampaigns.map((c) => c.id);
      const { data } = await supabase
        .from("fundraising_interests")
        .select("*")
        .in("campaign_id", campaignIds)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!user && isStartup && myCampaigns.length > 0,
  });

  // Fetch all active campaigns (investor browse)
  const { data: allCampaigns = [] } = useQuery({
    queryKey: ["all-fundraising-campaigns", searchQuery, filterSector, filterStage],
    queryFn: async () => {
      let query = supabase
        .from("fundraising_campaigns")
        .select("*")
        .eq("status", "active")
        .order("is_featured", { ascending: false })
        .order("created_at", { ascending: false });

      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,company_name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,sector.ilike.%${searchQuery}%`);
      }
      if (filterSector) query = query.eq("sector", filterSector);
      if (filterStage) query = query.eq("stage", filterStage);

      const { data } = await query.limit(50);
      return data || [];
    },
  });

  // Fetch my interests (investor view)
  const { data: sentInterests = [] } = useQuery({
    queryKey: ["my-sent-interests", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from("fundraising_interests")
        .select("*, fundraising_campaigns(*)")
        .eq("investor_user_id", user.id)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!user && isInvestor,
  });

  // Create/update campaign mutation
  const saveCampaign = useMutation({
    mutationFn: async (isEdit: boolean) => {
      let pitchDeckPath = isEdit ? editingCampaign?.pitch_deck_url ?? null : null;

      if (pitchDeckFile) {
        setUploadingDeck(true);
        const extension = pitchDeckFile.name.split(".").pop()?.toLowerCase() || "pdf";
        const path = `${user!.id}/${crypto.randomUUID()}.${extension}`;
        const { error: uploadError } = await supabase.storage
          .from("pitch-decks")
          .upload(path, pitchDeckFile, { cacheControl: "3600", upsert: false, contentType: pitchDeckFile.type });
        setUploadingDeck(false);
        if (uploadError) throw uploadError;
        // Remplace l'ancien fichier une fois le nouveau confirmé
        if (isEdit && editingCampaign?.pitch_deck_url) {
          await supabase.storage.from("pitch-decks").remove([editingCampaign.pitch_deck_url]);
        }
        pitchDeckPath = path;
      }

      const payload = {
        user_id: user!.id,
        title: form.title,
        description: form.description || null,
        sector: form.sector || null,
        stage: form.stage,
        target_amount: parseInt(form.target_amount) || 0,
        min_ticket: parseInt(form.min_ticket) || 0,
        valuation: form.valuation ? parseInt(form.valuation) : null,
        equity_offered: form.equity_offered ? parseFloat(form.equity_offered) : null,
        company_name: form.company_name || null,
        city: form.city || null,
        team_size: form.team_size ? parseInt(form.team_size) : null,
        revenue_monthly: parseInt(form.revenue_monthly) || 0,
        traction: form.traction || null,
        use_of_funds: form.use_of_funds || null,
        timeline: form.timeline || null,
        pitch_deck_url: pitchDeckPath,
      };

      if (isEdit && editingCampaign) {
        const { error } = await supabase
          .from("fundraising_campaigns")
          .update(payload)
          .eq("id", editingCampaign.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("fundraising_campaigns")
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(t("fundraising.saved"));
      queryClient.invalidateQueries({ queryKey: ["my-fundraising-campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["all-fundraising-campaigns"] });
      setShowCreateDialog(false);
      setEditingCampaign(null);
      setPitchDeckFile(null);
      resetForm();
    },
    onError: () => { setUploadingDeck(false); toast.error(t("fundraising.saveError")); },
  });

  // Delete campaign
  const deleteCampaign = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("fundraising_campaigns").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(t("fundraising.deleted"));
      queryClient.invalidateQueries({ queryKey: ["my-fundraising-campaigns"] });
    },
  });

  // Express interest mutation
  const expressInterest = useMutation({
    mutationFn: async (campaignId: string) => {
      const { error } = await supabase.from("fundraising_interests").insert({
        campaign_id: campaignId,
        investor_user_id: user!.id,
        message: interestForm.message || null,
        proposed_amount: interestForm.proposed_amount ? parseInt(interestForm.proposed_amount) : null,
      });
      if (error) {
        if (error.code === "23505") throw new Error("already_interested");
        throw error;
      }
    },
    onSuccess: () => {
      toast.success(t("fundraising.interestSent"));
      queryClient.invalidateQueries({ queryKey: ["my-sent-interests"] });
      queryClient.invalidateQueries({ queryKey: ["my-campaign-interests"] });
      setShowInterestDialog(null);
      setInterestForm({ message: "", proposed_amount: "" });
    },
    onError: (err: Error) => {
      if (err.message === "already_interested") {
        toast.error(t("fundraising.alreadyInterested"));
      } else {
        toast.error(t("fundraising.interestError"));
      }
    },
  });

  const openEdit = (campaign: FundraisingCampaign) => {
    setForm({
      title: campaign.title || "",
      description: campaign.description || "",
      sector: campaign.sector || "",
      stage: campaign.stage || "pre-seed",
      target_amount: String(campaign.target_amount || ""),
      min_ticket: String(campaign.min_ticket || ""),
      valuation: campaign.valuation ? String(campaign.valuation) : "",
      equity_offered: campaign.equity_offered ? String(campaign.equity_offered) : "",
      company_name: campaign.company_name || "",
      city: campaign.city || "",
      team_size: campaign.team_size ? String(campaign.team_size) : "",
      revenue_monthly: String(campaign.revenue_monthly || ""),
      traction: campaign.traction || "",
      use_of_funds: campaign.use_of_funds || "",
      timeline: campaign.timeline || "",
    });
    setPitchDeckFile(null);
    setEditingCampaign(campaign);
    setShowCreateDialog(true);
  };

  const formatAmount = (val: number) => {
    if (val >= 1000000) return `${(val / 1000000).toFixed(val % 1000000 === 0 ? 0 : 1)}M FCFA`;
    if (val >= 1000) return `${(val / 1000).toFixed(0)}K FCFA`;
    return `${val.toLocaleString("fr-FR")} FCFA`;
  };

  const alreadyInterestedIds = new Set(sentInterests.map((i) => i.campaign_id));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-primary" />
            {t("fundraising.title")}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{t("fundraising.subtitle")}</p>
        </div>
        {isStartup && (
          <Button onClick={() => { resetForm(); setPitchDeckFile(null); setEditingCampaign(null); setShowCreateDialog(true); }} className="bg-gradient-gold text-primary-foreground">
            <Plus className="h-4 w-4 mr-2" />
            {t("fundraising.createCampaign")}
          </Button>
        )}
      </div>

      {/* View Tabs */}
      <Tabs value={activeView} onValueChange={setActiveView}>
        <TabsList>
          {isStartup && <TabsTrigger value="my-campaigns">{t("fundraising.myCampaigns")}</TabsTrigger>}
          <TabsTrigger value="browse">{t("fundraising.browse")}</TabsTrigger>
          {isInvestor && <TabsTrigger value="my-interests">{t("fundraising.myInterests")}</TabsTrigger>}
        </TabsList>

        {/* MY CAMPAIGNS (Startup view) */}
        {isStartup && (
          <TabsContent value="my-campaigns" className="space-y-4">
            {myCampaigns.length === 0 ? (
              <Card className="border-dashed border-border">
                <CardContent className="py-16 text-center">
                  <Rocket className="mx-auto mb-4 h-12 w-12 text-muted-foreground/30" />
                  <p className="text-lg font-medium text-foreground">{t("fundraising.noCampaigns")}</p>
                  <p className="text-sm text-muted-foreground mt-1">{t("fundraising.noCampaignsDesc")}</p>
                  <Button className="mt-4 bg-gradient-gold text-primary-foreground" onClick={() => { resetForm(); setPitchDeckFile(null); setShowCreateDialog(true); }}>
                    <Plus className="h-4 w-4 mr-2" /> {t("fundraising.createFirst")}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              myCampaigns.map((campaign) => {
                const progress = campaign.target_amount > 0
                  ? Math.min((campaign.raised_so_far / campaign.target_amount) * 100, 100)
                  : 0;
                const interests = myInterests.filter((i) => i.campaign_id === campaign.id);

                return (
                  <Card key={campaign.id} className="border-border/50">
                    <CardContent className="p-6">
                      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-display text-lg font-bold text-foreground">{campaign.title}</h3>
                            <Badge variant={campaign.status === "active" ? "default" : "secondary"} className="text-xs">
                              {campaign.status}
                            </Badge>
                            {campaign.is_featured && <Badge className="bg-primary/10 text-primary text-xs border-0">⭐</Badge>}
                          </div>
                          {campaign.company_name && (
                            <p className="text-sm text-muted-foreground flex items-center gap-1 mb-1">
                              <Building2 className="h-3.5 w-3.5" /> {campaign.company_name}
                              {campaign.city && <><MapPin className="h-3.5 w-3.5 ml-2" /> {campaign.city}</>}
                            </p>
                          )}
                          <div className="flex flex-wrap gap-2 mt-2">
                            {campaign.sector && <Badge variant="outline" className="text-xs">{campaign.sector}</Badge>}
                            {campaign.stage && <Badge variant="outline" className="text-xs border-primary/20 text-primary">{campaign.stage}</Badge>}
                          </div>
                          {campaign.description && (
                            <p className="text-sm text-muted-foreground mt-3 line-clamp-2">{campaign.description}</p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => openEdit(campaign)}>
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => deleteCampaign.mutate(campaign.id)} className="text-destructive hover:text-destructive">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>

                      {/* Progress */}
                      <div className="mt-4 space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">{t("fundraising.raised")}</span>
                          <span className="font-semibold text-foreground">
                            {formatAmount(campaign.raised_so_far)} / {formatAmount(campaign.target_amount)}
                          </span>
                        </div>
                        <Progress value={progress} className="h-2" />
                      </div>

                      {/* Interests received */}
                      {interests.length > 0 && (
                        <div className="mt-4 border-t border-border/50 pt-4">
                          <p className="text-sm font-medium text-foreground mb-2 flex items-center gap-1">
                            <MessageSquare className="h-4 w-4 text-primary" />
                            {interests.length} {t("fundraising.interestsReceived")}
                          </p>
                          <div className="space-y-2">
                            {interests.map((interest) => (
                              <div key={interest.id} className="flex items-center justify-between rounded-lg bg-muted/50 p-3 text-sm">
                                <div>
                                  {interest.proposed_amount && (
                                    <span className="font-semibold text-foreground">{formatAmount(interest.proposed_amount)}</span>
                                  )}
                                  {interest.message && (
                                    <p className="text-muted-foreground text-xs mt-0.5 line-clamp-1">{interest.message}</p>
                                  )}
                                </div>
                                <Badge variant={interest.status === "pending" ? "secondary" : interest.status === "accepted" ? "default" : "outline"} className="text-xs">
                                  {interest.status}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })
            )}
          </TabsContent>
        )}

        {/* BROWSE (Investor view) */}
        <TabsContent value="browse" className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col gap-3 md:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t("fundraising.searchPlaceholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterSector} onValueChange={setFilterSector}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder={t("fundraising.allSectors")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("fundraising.allSectors")}</SelectItem>
                {SECTORS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterStage} onValueChange={setFilterStage}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder={t("fundraising.allStages")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("fundraising.allStages")}</SelectItem>
                {STAGES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {allCampaigns.length === 0 ? (
            <Card className="border-dashed border-border">
              <CardContent className="py-16 text-center">
                <Search className="mx-auto mb-4 h-12 w-12 text-muted-foreground/30" />
                <p className="text-lg font-medium text-foreground">{t("fundraising.noCampaignsFound")}</p>
                <p className="text-sm text-muted-foreground mt-1">{t("fundraising.noCampaignsFoundDesc")}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {allCampaigns.map((campaign) => {
                const progress = campaign.target_amount > 0
                  ? Math.min((campaign.raised_so_far / campaign.target_amount) * 100, 100)
                  : 0;
                const isOwn = campaign.user_id === user?.id;
                const alreadyInterested = alreadyInterestedIds.has(campaign.id);

                return (
                  <Card key={campaign.id} className="group border-border/50 hover:border-primary/30 transition-all hover:shadow-lg hover:shadow-primary/5">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          {campaign.is_featured && <Badge className="bg-primary/10 text-primary text-xs border-0 mb-1">⭐ {t("fundraising.featured")}</Badge>}
                          <h3 className="font-display text-base font-bold text-foreground line-clamp-2">{campaign.title}</h3>
                        </div>
                        <Badge variant="outline" className="text-xs border-primary/20 text-primary shrink-0 ml-2">{campaign.stage}</Badge>
                      </div>

                      {campaign.company_name && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mb-2">
                          <Building2 className="h-3 w-3" /> {campaign.company_name}
                          {campaign.city && <><MapPin className="h-3 w-3 ml-1" /> {campaign.city}</>}
                        </p>
                      )}

                      {campaign.description && (
                        <p className="text-sm text-muted-foreground line-clamp-3 mb-3">{campaign.description}</p>
                      )}

                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {campaign.sector && <Badge variant="secondary" className="text-xs">{campaign.sector}</Badge>}
                        {campaign.team_size && (
                          <Badge variant="secondary" className="text-xs">
                            <Users className="h-3 w-3 mr-1" /> {campaign.team_size}
                          </Badge>
                        )}
                      </div>

                      {/* Financial info */}
                      <div className="space-y-2 mb-3 rounded-lg bg-muted/50 p-3">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">{t("fundraising.target")}</span>
                          <span className="font-semibold text-foreground">{formatAmount(campaign.target_amount)}</span>
                        </div>
                        {campaign.valuation && (
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">{t("fundraising.valuation")}</span>
                            <span className="font-semibold text-foreground">{formatAmount(campaign.valuation)}</span>
                          </div>
                        )}
                        {campaign.min_ticket > 0 && (
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">{t("fundraising.minTicket")}</span>
                            <span className="font-semibold text-foreground">{formatAmount(campaign.min_ticket)}</span>
                          </div>
                        )}
                        {campaign.equity_offered && (
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">{t("fundraising.equity")}</span>
                            <span className="font-semibold text-foreground">{campaign.equity_offered}%</span>
                          </div>
                        )}
                      </div>

                      <Progress value={progress} className="h-1.5 mb-3" />
                      <p className="text-xs text-muted-foreground mb-3">
                        {formatAmount(campaign.raised_so_far)} / {formatAmount(campaign.target_amount)}
                      </p>

                      {isInvestor && !isOwn && (
                        <Button
                          size="sm"
                          className={alreadyInterested ? "" : "bg-gradient-gold text-primary-foreground"}
                          variant={alreadyInterested ? "secondary" : "default"}
                          disabled={alreadyInterested}
                          onClick={() => setShowInterestDialog(campaign.id)}
                        >
                          {alreadyInterested ? (
                            <><CheckCircle className="h-3.5 w-3.5 mr-1" /> {t("fundraising.interestSentLabel")}</>
                          ) : (
                            <><Send className="h-3.5 w-3.5 mr-1" /> {t("fundraising.expressInterest")}</>
                          )}
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* MY INTERESTS (Investor view) */}
        {isInvestor && (
          <TabsContent value="my-interests" className="space-y-4">
            {sentInterests.length === 0 ? (
              <Card className="border-dashed border-border">
                <CardContent className="py-16 text-center">
                  <Target className="mx-auto mb-4 h-12 w-12 text-muted-foreground/30" />
                  <p className="text-lg font-medium text-foreground">{t("fundraising.noInterests")}</p>
                  <p className="text-sm text-muted-foreground mt-1">{t("fundraising.noInterestsDesc")}</p>
                </CardContent>
              </Card>
            ) : (
              sentInterests.map((interest) => {
                const campaign = interest.fundraising_campaigns;
                return (
                  <Card key={interest.id} className="border-border/50">
                    <CardContent className="p-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <h4 className="font-semibold text-foreground">{campaign?.title || "—"}</h4>
                        <p className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
                          {campaign?.company_name && <span className="flex items-center gap-1"><Building2 className="h-3 w-3" />{campaign.company_name}</span>}
                          {campaign?.sector && <Badge variant="secondary" className="text-xs">{campaign.sector}</Badge>}
                          <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{new Date(interest.created_at).toLocaleDateString("fr-FR")}</span>
                        </p>
                        {interest.message && <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{interest.message}</p>}
                      </div>
                      <div className="flex items-center gap-3">
                        {interest.proposed_amount && (
                          <span className="font-semibold text-foreground text-sm">{formatAmount(interest.proposed_amount)}</span>
                        )}
                        <Badge
                          variant={interest.status === "accepted" ? "default" : interest.status === "rejected" ? "destructive" : "secondary"}
                          className="text-xs"
                        >
                          {interest.status === "accepted" && <CheckCircle className="h-3 w-3 mr-1" />}
                          {interest.status === "rejected" && <XCircle className="h-3 w-3 mr-1" />}
                          {interest.status === "pending" && <Clock className="h-3 w-3 mr-1" />}
                          {interest.status}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </TabsContent>
        )}
      </Tabs>

      {/* Create/Edit Campaign Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={(v) => { if (!v) { setShowCreateDialog(false); setEditingCampaign(null); } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">
              {editingCampaign ? t("fundraising.editCampaign") : t("fundraising.createCampaign")}
            </DialogTitle>
            <DialogDescription>{t("fundraising.campaignFormDesc")}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5 col-span-2">
                <Label>{t("fundraising.campaignTitle")} *</Label>
                <Input value={form.title} onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))} placeholder={t("fundraising.campaignTitlePlaceholder")} />
              </div>
              <div className="space-y-1.5">
                <Label>{t("fundraising.companyName")}</Label>
                <Input value={form.company_name} onChange={(e) => setForm(f => ({ ...f, company_name: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>{t("fundraising.city")}</Label>
                <Input value={form.city} onChange={(e) => setForm(f => ({ ...f, city: e.target.value }))} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>{t("fundraising.description")}</Label>
              <Textarea value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} rows={4} placeholder={t("fundraising.descPlaceholder")} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>{t("fundraising.sectorLabel")}</Label>
                <Select value={form.sector} onValueChange={(v) => setForm(f => ({ ...f, sector: v }))}>
                  <SelectTrigger><SelectValue placeholder={t("fundraising.selectSector")} /></SelectTrigger>
                  <SelectContent>
                    {SECTORS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>{t("fundraising.stageLabel")}</Label>
                <Select value={form.stage} onValueChange={(v) => setForm(f => ({ ...f, stage: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STAGES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>{t("fundraising.targetAmount")} * (FCFA)</Label>
                <Input type="number" value={form.target_amount} onChange={(e) => setForm(f => ({ ...f, target_amount: e.target.value }))} placeholder="500000" />
              </div>
              <div className="space-y-1.5">
                <Label>{t("fundraising.minTicketLabel")} (FCFA)</Label>
                <Input type="number" value={form.min_ticket} onChange={(e) => setForm(f => ({ ...f, min_ticket: e.target.value }))} placeholder="25000" />
              </div>
              <div className="space-y-1.5">
                <Label>{t("fundraising.valuationLabel")} (FCFA)</Label>
                <Input type="number" value={form.valuation} onChange={(e) => setForm(f => ({ ...f, valuation: e.target.value }))} placeholder="5000000" />
              </div>
              <div className="space-y-1.5">
                <Label>{t("fundraising.equityLabel")} (%)</Label>
                <Input type="number" step="0.1" value={form.equity_offered} onChange={(e) => setForm(f => ({ ...f, equity_offered: e.target.value }))} placeholder="15" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>{t("fundraising.teamSize")}</Label>
                <Input type="number" value={form.team_size} onChange={(e) => setForm(f => ({ ...f, team_size: e.target.value }))} placeholder="5" />
              </div>
              <div className="space-y-1.5">
                <Label>{t("fundraising.monthlyRevenue")} (FCFA)</Label>
                <Input type="number" value={form.revenue_monthly} onChange={(e) => setForm(f => ({ ...f, revenue_monthly: e.target.value }))} placeholder="10000" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>{t("fundraising.tractionLabel")}</Label>
              <Textarea value={form.traction} onChange={(e) => setForm(f => ({ ...f, traction: e.target.value }))} rows={2} placeholder={t("fundraising.tractionPlaceholder")} />
            </div>

            <div className="space-y-1.5">
              <Label>{t("fundraising.useOfFunds")}</Label>
              <Textarea value={form.use_of_funds} onChange={(e) => setForm(f => ({ ...f, use_of_funds: e.target.value }))} rows={2} placeholder={t("fundraising.useOfFundsPlaceholder")} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>{t("fundraising.timelineLabel")}</Label>
                <Input value={form.timeline} onChange={(e) => setForm(f => ({ ...f, timeline: e.target.value }))} placeholder="Q2 2026" />
              </div>
              <div className="space-y-1.5">
                <Label>Pitch Deck</Label>
                <div className="rounded-lg border border-dashed border-border p-3">
                  <label className="flex cursor-pointer items-center gap-2 text-sm">
                    <Upload className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      {pitchDeckFile ? pitchDeckFile.name : "PDF, PPT ou PPTX — max 20 Mo"}
                    </span>
                    <input
                      type="file"
                      className="sr-only"
                      accept="application/pdf,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation"
                      onChange={(e) => handlePitchDeckChange(e.target.files?.[0] || null)}
                    />
                  </label>
                  {!pitchDeckFile && editingCampaign?.pitch_deck_url && (
                    <button
                      type="button"
                      className="mt-2 text-xs text-primary hover:underline"
                      onClick={() => viewPitchDeck(editingCampaign.pitch_deck_url!)}
                    >
                      Voir le fichier actuel
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => { setShowCreateDialog(false); setEditingCampaign(null); setPitchDeckFile(null); }}>
                {t("fundraising.cancel")}
              </Button>
              <Button
                className="bg-gradient-gold text-primary-foreground"
                onClick={() => saveCampaign.mutate(!!editingCampaign)}
                disabled={!form.title || !form.target_amount || saveCampaign.isPending || uploadingDeck}
              >
                {(saveCampaign.isPending || uploadingDeck) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingCampaign ? t("fundraising.update") : t("fundraising.publish")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Express Interest Dialog */}
      <Dialog open={!!showInterestDialog} onOpenChange={(v) => { if (!v) setShowInterestDialog(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">{t("fundraising.expressInterest")}</DialogTitle>
            <DialogDescription>{t("fundraising.interestDesc")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label>{t("fundraising.proposedAmount")} (FCFA)</Label>
              <Input
                type="number"
                value={interestForm.proposed_amount}
                onChange={(e) => setInterestForm(f => ({ ...f, proposed_amount: e.target.value }))}
                placeholder="100000"
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t("fundraising.interestMessage")}</Label>
              <Textarea
                value={interestForm.message}
                onChange={(e) => setInterestForm(f => ({ ...f, message: e.target.value }))}
                rows={3}
                placeholder={t("fundraising.interestMessagePlaceholder")}
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowInterestDialog(null)}>{t("fundraising.cancel")}</Button>
              <Button
                className="bg-gradient-gold text-primary-foreground"
                onClick={() => showInterestDialog && expressInterest.mutate(showInterestDialog)}
                disabled={expressInterest.isPending}
              >
                {expressInterest.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                <Send className="h-4 w-4 mr-2" /> {t("fundraising.send")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FundraisingTab;
