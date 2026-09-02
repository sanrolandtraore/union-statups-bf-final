import jsPDF from "jspdf";

export interface CertificateData {
  studentName: string;
  programTitle: string;
  certificateNumber: string;
  issuedAt: string;
}

export function generateCertificatePdf(data: CertificateData): void {
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "landscape" });
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();

  // Cadre décoratif
  doc.setDrawColor(212, 160, 40);
  doc.setLineWidth(1.2);
  doc.rect(10, 10, w - 20, h - 20);
  doc.setLineWidth(0.4);
  doc.rect(13, 13, w - 26, h - 26);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(150, 120, 30);
  doc.text("UNION'S — STARTUP SCHOOL", w / 2, 32, { align: "center" });

  doc.setFontSize(28);
  doc.setTextColor(20, 20, 20);
  doc.text("Certificat de Réussite", w / 2, 50, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.setTextColor(90, 90, 90);
  doc.text("Ce certificat est décerné à", w / 2, 68, { align: "center" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(20, 20, 20);
  doc.text(data.studentName, w / 2, 82, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.setTextColor(90, 90, 90);
  doc.text("pour avoir complété avec succès le programme", w / 2, 96, { align: "center" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(20, 20, 20);
  doc.text(data.programTitle, w / 2, 108, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(120, 120, 120);
  const dateLabel = new Date(data.issuedAt).toLocaleDateString("fr-FR", { year: "numeric", month: "long", day: "numeric" });
  doc.text(`Délivré le ${dateLabel}`, w / 2, h - 28, { align: "center" });
  doc.text(`N° de certificat : ${data.certificateNumber}`, w / 2, h - 22, { align: "center" });

  doc.setFontSize(8);
  doc.setTextColor(160, 160, 160);
  doc.text("La validité de ce certificat peut être vérifiée sur union-s.com avec le numéro ci-dessus.", w / 2, h - 16, { align: "center" });

  doc.save(`Certificat-${data.programTitle.replace(/\s+/g, "-")}.pdf`);
}
