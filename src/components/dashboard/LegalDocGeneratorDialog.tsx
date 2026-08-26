import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Scale, Download, Plus, Trash2 } from "lucide-react";
import { generateLegalDocBlob, LEGAL_DOC_LABELS, type LegalDocType } from "@/lib/generateLegalDocx";

interface Props {
  onClose: () => void;
}

const LegalDocGeneratorDialog = ({ onClose }: Props) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [docType, setDocType] = useState<LegalDocType>("nda");
  const [generating, setGenerating] = useState(false);

  const [companyName, setCompanyName] = useState("");
  const [otherPartyName, setOtherPartyName] = useState("");

  const [purpose, setPurpose] = useState("");
  const [ndaDuration, setNdaDuration] = useState("2");

  const [shareholders, setShareholders] = useState([{ name: "", percentage: "" }]);

  const [preMoney, setPreMoney] = useState("");
  const [investmentAmount, setInvestmentAmount] = useState("");
  const [instrument, setInstrument] = useState("Actions de préférence");
  const [boardSeats, setBoardSeats] = useState("");

  const [equityPct, setEquityPct] = useState("");
  const [vestingYears, setVestingYears] = useState("4");
  const [cliffMonths, setCliffMonths] = useState("12");

  const [missionDescription, setMissionDescription] = useState("");
  const [durationMonths, setDurationMonths] = useState("3");
  const [dailyRate, setDailyRate] = useState("");

  const [infoRights, setInfoRights] = useState(true);
  const [proRataRights, setProRataRights] = useState(true);
  const [boardObserver, setBoardObserver] = useState(false);

  const addShareholder = () => setShareholders([...shareholders, { name: "", percentage: "" }]);
  const removeShareholder = (i: number) => setShareholders(shareholders.filter((_, idx) => idx !== i));
  const updateShareholder = (i: number, field: "name" | "percentage", value: string) => {
    const next = [...shareholders];
    next[i] = { ...next[i], [field]: value };
    setShareholders(next);
  };

  const isValid = (() => {
    if (!companyName.trim()) return false;
    switch (docType) {
      case "nda": return otherPartyName.trim() && purpose.trim();
      case "shareholders_agreement": return shareholders.every((s) => s.name.trim() && Number(s.percentage) > 0);
      case "term_sheet": return otherPartyName.trim() && Number(preMoney) > 0 && Number(investmentAmount) > 0;
      case "vesting": return otherPartyName.trim() && Number(equityPct) > 0;
      case "freelance_contract": return otherPartyName.trim() && missionDescription.trim() && Number(dailyRate) > 0;
      case "investor_convention": return otherPartyName.trim();
      default: return false;
    }
  })();

  const handleGenerate = async () => {
    if (!isValid || !user) return;
    setGenerating(true);
    try {
      const dateLabel = new Date().toLocaleDateString("fr-FR", { year: "numeric", month: "long", day: "numeric" });
      let params: Parameters<typeof generateLegalDocBlob>[0];
      let partyB = otherPartyName.trim();

      switch (docType) {
        case "nda":
          params = { type: "nda", data: { partyA: companyName.trim(), partyB, purpose: purpose.trim(), durationYears: Number(ndaDuration) } };
          break;
        case "shareholders_agreement":
          params = { type: "shareholders_agreement", data: { companyName: companyName.trim(), shareholders: shareholders.map((s) => ({ name: s.name.trim(), percentage: Number(s.percentage) })) } };
          partyB = shareholders.map((s) => s.name).join(", ");
          break;
        case "term_sheet":
          params = { type: "term_sheet", data: { companyName: companyName.trim(), investorName: partyB, preMoneyValuation: Number(preMoney), investmentAmount: Number(investmentAmount), instrument, boardSeats: boardSeats.trim() || "À définir" } };
          break;
        case "vesting":
          params = { type: "vesting", data: { companyName: companyName.trim(), beneficiaryName: partyB, totalEquityPercentage: Number(equityPct), vestingYears: Number(vestingYears), cliffMonths: Number(cliffMonths) } };
          break;
        case "freelance_contract":
          params = { type: "freelance_contract", data: { companyName: companyName.trim(), freelancerName: partyB, missionDescription: missionDescription.trim(), durationMonths: Number(durationMonths), dailyRate: Number(dailyRate) } };
          break;
        case "investor_convention":
          params = { type: "investor_convention", data: { companyName: companyName.trim(), investorName: partyB, infoRights, proRataRights, boardObserver } };
          break;
      }

      const blob = await generateLegalDocBlob(params, dateLabel);

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${LEGAL_DOC_LABELS[docType].replace(/[^a-zA-Z0-9]+/g, "-")}-${companyName.replace(/\s+/g, "-")}.docx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      const storagePath = `${user.id}/${crypto.randomUUID()}.docx`;
      await supabase.storage.from("legal-documents").upload(storagePath, blob, {
        contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });

      await supabase.from("legal_documents").insert({
        creator_user_id: user.id,
        document_type: docType,
        party_a_name: companyName.trim(),
        party_b_name: partyB,
        params: params.data as unknown as Record<string, unknown>,
        storage_path: storagePath,
      });

      toast({ title: "Document généré", description: "Téléchargé et sauvegardé dans votre historique." });
      onClose();
    } catch (e) {
      toast({ title: "Erreur", description: (e as Error).message, variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && !generating && onClose()}>
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Scale className="h-5 w-5 text-primary" /> Générateur juridique OHADA</DialogTitle>
          <DialogDescription>Point de départ de négociation, à faire relire par un conseil juridique avant signature.</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <Label className="text-xs">Type de document</Label>
            <Select value={docType} onValueChange={(v) => setDocType(v as LegalDocType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(LEGAL_DOC_LABELS) as LegalDocType[]).map((t) => (
                  <SelectItem key={t} value={t}>{LEGAL_DOC_LABELS[t]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs">{docType === "shareholders_agreement" ? "Nom de la société" : "Votre société / vous-même"}</Label>
            <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Ex: Union'S SARL" />
          </div>

          {docType === "nda" && (
            <>
              <div><Label className="text-xs">Autre partie</Label><Input value={otherPartyName} onChange={(e) => setOtherPartyName(e.target.value)} placeholder="Nom" /></div>
              <div><Label className="text-xs">Objet des échanges</Label><Textarea value={purpose} onChange={(e) => setPurpose(e.target.value)} rows={2} placeholder="Ex: discussions en vue d'un partenariat commercial" /></div>
              <div><Label className="text-xs">Durée de confidentialité (années)</Label><Input type="number" value={ndaDuration} onChange={(e) => setNdaDuration(e.target.value)} /></div>
            </>
          )}

          {docType === "shareholders_agreement" && (
            <div className="space-y-2">
              <Label className="text-xs">Actionnaires et répartition</Label>
              {shareholders.map((s, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <Input value={s.name} onChange={(e) => updateShareholder(i, "name", e.target.value)} placeholder="Nom" className="flex-1" />
                  <Input type="number" value={s.percentage} onChange={(e) => updateShareholder(i, "percentage", e.target.value)} placeholder="%" className="w-20" />
                  {shareholders.length > 1 && (
                    <Button size="icon" variant="ghost" onClick={() => removeShareholder(i)} className="h-9 w-9 shrink-0"><Trash2 className="h-3.5 w-3.5" /></Button>
                  )}
                </div>
              ))}
              <Button size="sm" variant="outline" onClick={addShareholder}><Plus className="h-3.5 w-3.5 mr-1" /> Ajouter un actionnaire</Button>
            </div>
          )}

          {docType === "term_sheet" && (
            <>
              <div><Label className="text-xs">Investisseur</Label><Input value={otherPartyName} onChange={(e) => setOtherPartyName(e.target.value)} placeholder="Nom" /></div>
              <div><Label className="text-xs">Valorisation pré-money (FCFA)</Label><Input type="number" value={preMoney} onChange={(e) => setPreMoney(e.target.value)} /></div>
              <div><Label className="text-xs">Montant investi (FCFA)</Label><Input type="number" value={investmentAmount} onChange={(e) => setInvestmentAmount(e.target.value)} /></div>
              <div><Label className="text-xs">Instrument</Label><Input value={instrument} onChange={(e) => setInstrument(e.target.value)} placeholder="Actions de préférence / SAFE / Obligations convertibles" /></div>
              <div><Label className="text-xs">Gouvernance (sièges au conseil)</Label><Input value={boardSeats} onChange={(e) => setBoardSeats(e.target.value)} placeholder="Ex: 1 siège pour l'investisseur" /></div>
            </>
          )}

          {docType === "vesting" && (
            <>
              <div><Label className="text-xs">Bénéficiaire</Label><Input value={otherPartyName} onChange={(e) => setOtherPartyName(e.target.value)} placeholder="Nom" /></div>
              <div><Label className="text-xs">% du capital attribué</Label><Input type="number" value={equityPct} onChange={(e) => setEquityPct(e.target.value)} /></div>
              <div><Label className="text-xs">Durée de vesting (années)</Label><Input type="number" value={vestingYears} onChange={(e) => setVestingYears(e.target.value)} /></div>
              <div><Label className="text-xs">Falaise / cliff (mois)</Label><Input type="number" value={cliffMonths} onChange={(e) => setCliffMonths(e.target.value)} /></div>
            </>
          )}

          {docType === "freelance_contract" && (
            <>
              <div><Label className="text-xs">Freelance</Label><Input value={otherPartyName} onChange={(e) => setOtherPartyName(e.target.value)} placeholder="Nom" /></div>
              <div><Label className="text-xs">Description de la mission</Label><Textarea value={missionDescription} onChange={(e) => setMissionDescription(e.target.value)} rows={2} /></div>
              <div><Label className="text-xs">Durée (mois)</Label><Input type="number" value={durationMonths} onChange={(e) => setDurationMonths(e.target.value)} /></div>
              <div><Label className="text-xs">Taux journalier (FCFA)</Label><Input type="number" value={dailyRate} onChange={(e) => setDailyRate(e.target.value)} /></div>
            </>
          )}

          {docType === "investor_convention" && (
            <>
              <div><Label className="text-xs">Investisseur</Label><Input value={otherPartyName} onChange={(e) => setOtherPartyName(e.target.value)} placeholder="Nom" /></div>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={infoRights} onChange={(e) => setInfoRights(e.target.checked)} /> Droit d'information périodique</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={proRataRights} onChange={(e) => setProRataRights(e.target.checked)} /> Droit de préemption pro-rata</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={boardObserver} onChange={(e) => setBoardObserver(e.target.checked)} /> Observateur au conseil</label>
            </>
          )}

          <Button className="w-full mt-2" onClick={handleGenerate} disabled={!isValid || generating}>
            <Download className="h-4 w-4 mr-2" /> {generating ? "Génération…" : "Générer et télécharger (.docx)"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LegalDocGeneratorDialog;
