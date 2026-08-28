import jsPDF from "jspdf";

interface ChecklistItem { item: string; status: "ok" | "warning" | "missing"; note: string; }

export interface DueDiligenceReportData {
  startup_name: string;
  overall_score: number;
  finance_score: number;
  market_score: number;
  team_score: number;
  risk_score: number;
  compliance_score: number;
  financial_analysis: string;
  market_analysis: string;
  team_analysis: string;
  risk_flags: string[];
  compliance_checklist: ChecklistItem[];
  recommendations: string[];
  created_at: string;
}

const STATUS_LABEL: Record<string, string> = { ok: "OK", warning: "À vérifier", missing: "Manquant" };
const STATUS_COLOR: Record<string, [number, number, number]> = { ok: [16, 150, 90], warning: [200, 140, 20], missing: [190, 40, 40] };

export function generateDueDiligencePdf(report: DueDiligenceReportData): void {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const marginX = 18;
  const pageWidth = doc.internal.pageSize.getWidth();
  const contentWidth = pageWidth - marginX * 2;
  let y = 20;

  const ensureSpace = (needed: number) => {
    if (y + needed > 280) { doc.addPage(); y = 20; }
  };

  const addTitle = (text: string) => {
    ensureSpace(12);
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(20, 20, 20);
    doc.text(text, marginX, y);
    y += 8;
  };

  const addParagraph = (text: string, size = 10) => {
    doc.setFontSize(size);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(60, 60, 60);
    const lines = doc.splitTextToSize(text, contentWidth);
    ensureSpace(lines.length * 5 + 4);
    doc.text(lines, marginX, y);
    y += lines.length * 5 + 4;
  };

  const addBullet = (text: string) => {
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(60, 60, 60);
    const lines = doc.splitTextToSize(`•  ${text}`, contentWidth - 4);
    ensureSpace(lines.length * 5 + 2);
    doc.text(lines, marginX, y);
    y += lines.length * 5 + 2;
  };

  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(20, 20, 20);
  doc.text("RAPPORT DE DUE DILIGENCE", marginX, y);
  y += 8;
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(90, 90, 90);
  doc.text(report.startup_name, marginX, y);
  y += 6;
  doc.setFontSize(9);
  doc.text(`Généré le ${new Date(report.created_at).toLocaleDateString("fr-FR", { year: "numeric", month: "long", day: "numeric" })}`, marginX, y);
  y += 12;

  doc.setFontSize(28);
  doc.setFont("helvetica", "bold");
  const scoreColor: [number, number, number] = report.overall_score >= 70 ? [16, 150, 90] : report.overall_score >= 50 ? [200, 140, 20] : [190, 40, 40];
  doc.setTextColor(...scoreColor);
  doc.text(`${report.overall_score}/100`, marginX, y);
  y += 4;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(120, 120, 120);
  doc.text("Score global", marginX, y);
  y += 10;

  const subScores: [string, number][] = [
    ["Finances", report.finance_score], ["Marché", report.market_score], ["Équipe", report.team_score],
    ["Risque", report.risk_score], ["Conformité OHADA", report.compliance_score],
  ];
  doc.setFontSize(9);
  subScores.forEach(([label, score], i) => {
    const x = marginX + (i % 5) * (contentWidth / 5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(40, 40, 40);
    doc.text(`${score}/20`, x, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(120, 120, 120);
    doc.text(label, x, y + 4);
  });
  y += 14;

  addTitle("Analyse financière");
  addParagraph(report.financial_analysis);

  addTitle("Analyse de marché");
  addParagraph(report.market_analysis);

  addTitle("Analyse de l'équipe");
  addParagraph(report.team_analysis);

  addTitle("Signaux de risque");
  report.risk_flags.forEach((f) => addBullet(f));
  y += 3;

  addTitle("Grille de conformité OHADA");
  report.compliance_checklist.forEach((c) => {
    ensureSpace(10);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 30, 30);
    doc.text(c.item, marginX, y);
    doc.setTextColor(...STATUS_COLOR[c.status]);
    doc.text(STATUS_LABEL[c.status], pageWidth - marginX, y, { align: "right" });
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    const noteLines = doc.splitTextToSize(c.note, contentWidth);
    doc.text(noteLines, marginX, y);
    y += noteLines.length * 4.5 + 4;
  });

  addTitle("Recommandations");
  report.recommendations.forEach((r) => addBullet(r));

  y += 6;
  ensureSpace(14);
  doc.setFontSize(8);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(150, 150, 150);
  const disclaimer = "Ce rapport est généré automatiquement à partir des informations déclaratives disponibles sur la plateforme et, le cas échéant, d'un document complémentaire fourni. Il ne remplace pas une due diligence juridique, comptable et financière menée par des professionnels avant toute décision d'investissement.";
  doc.text(doc.splitTextToSize(disclaimer, contentWidth), marginX, y);

  doc.save(`Due-Diligence-${report.startup_name.replace(/\s+/g, "-")}.pdf`);
}
