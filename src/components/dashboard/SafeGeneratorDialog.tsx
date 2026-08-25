import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { FileText, Download } from "lucide-react";
import { generateSafeBlob } from "@/lib/generateSafeDocx";

interface Props {
  campaignId?: string;
  defaultCompanyName?: string;
  onClose: () => void;
}

const SafeGeneratorDialog = ({ campaignId, defaultCompanyName, onClose }: Props) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [companyLegalName, setCompanyLegalName] = useState(defaultCompanyName || "");
  const [investorName, setInvestorName] = useState("");
  const [purchaseAmount, setPurchaseAmount] = useState("");
  const [useCap, setUseCap] = useState(true);
  const [valuationCap, setValuationCap] = useState("");
  const [useDiscount, setUseDiscount] = useState(false);
  const [discountRate, setDiscountRate] = useState("20");
  const [hasMfn, setHasMfn] = useState(true);
  const [generating, setGenerating] = useState(false);

  const isValid = companyLegalName.trim() && investorName.trim() && Number(purchaseAmount) > 0
    && (!useCap || Number(valuationCap) > 0)
    && (!useDiscount || (Number(discountRate) > 0 && Number(discountRate) < 100));

  const handleGenerate = async () => {
    if (!isValid || !user) return;
    setGenerating(true);
    try {
      const params = {
        companyLegalName: companyLegalName.trim(),
        investorName: investorName.trim(),
        purchaseAmount: Number(purchaseAmount),
        valuationCap: useCap ? Number(valuationCap) : null,
        discountRate: useDiscount ? Number(discountRate) / 100 : null,
        hasMfn,
        governingLaw: "droit burkinabè et Actes uniformes OHADA",
        dateLabel: new Date().toLocaleDateString("fr-FR", { year: "numeric", month: "long", day: "numeric" }),
      };

      const blob = await generateSafeBlob(params);

      // Téléchargement immédiat
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `SAFE-${companyLegalName.replace(/\s+/g, "-")}.docx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      // Sauvegarde en base + storage pour historique
      const storagePath = `${user.id}/${crypto.randomUUID()}.docx`;
      await supabase.storage.from("safe-documents").upload(storagePath, blob, {
        contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });

      await supabase.from("safe_agreements").insert({
        campaign_id: campaignId || null,
        startup_user_id: user.id,
        company_legal_name: params.companyLegalName,
        investor_name: params.investorName,
        purchase_amount: params.purchaseAmount,
        valuation_cap: params.valuationCap,
        discount_rate: params.discountRate,
        has_mfn: params.hasMfn,
        governing_law: params.governingLaw,
        storage_path: storagePath,
        status: "generated",
      });

      toast({ title: "SAFE généré", description: "Le document a été téléchargé et sauvegardé dans votre historique." });
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
          <DialogTitle className="flex items-center gap-2"><FileText className="h-5 w-5 text-primary" /> Générer un SAFE</DialogTitle>
          <DialogDescription>
            Simple Agreement for Future Equity — instrument standard créé par Y Combinator, variante post-money. Point de départ de négociation, à faire relire par un conseil juridique.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <Label className="text-xs">Nom légal de la société</Label>
            <Input value={companyLegalName} onChange={(e) => setCompanyLegalName(e.target.value)} placeholder="Ex: Union'S SARL" />
          </div>
          <div>
            <Label className="text-xs">Nom de l'investisseur</Label>
            <Input value={investorName} onChange={(e) => setInvestorName(e.target.value)} placeholder="Ex: Jean Dupont ou Fonds XYZ" />
          </div>
          <div>
            <Label className="text-xs">Montant de l'investissement (FCFA)</Label>
            <Input type="number" value={purchaseAmount} onChange={(e) => setPurchaseAmount(e.target.value)} placeholder="5000000" />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <Checkbox checked={useCap} onCheckedChange={(v) => setUseCap(!!v)} id="cap" />
            <Label htmlFor="cap" className="text-sm cursor-pointer">Inclure un plafond de valorisation (recommandé)</Label>
          </div>
          {useCap && (
            <Input type="number" value={valuationCap} onChange={(e) => setValuationCap(e.target.value)} placeholder="Plafond en FCFA, ex: 100000000" />
          )}

          <div className="flex items-center gap-2 pt-1">
            <Checkbox checked={useDiscount} onCheckedChange={(v) => setUseDiscount(!!v)} id="discount" />
            <Label htmlFor="discount" className="text-sm cursor-pointer">Inclure une décote (%)</Label>
          </div>
          {useDiscount && (
            <Input type="number" value={discountRate} onChange={(e) => setDiscountRate(e.target.value)} placeholder="20" />
          )}

          <div className="flex items-center gap-2 pt-1">
            <Checkbox checked={hasMfn} onCheckedChange={(v) => setHasMfn(!!v)} id="mfn" />
            <Label htmlFor="mfn" className="text-sm cursor-pointer">Clause Nation la Plus Favorisée (MFN)</Label>
          </div>

          <Button className="w-full mt-2" onClick={handleGenerate} disabled={!isValid || generating}>
            <Download className="h-4 w-4 mr-2" /> {generating ? "Génération…" : "Générer et télécharger (.docx)"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SafeGeneratorDialog;
