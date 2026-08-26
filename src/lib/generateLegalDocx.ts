import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from "docx";

export type LegalDocType = "nda" | "shareholders_agreement" | "term_sheet" | "vesting" | "freelance_contract" | "investor_convention";

export const LEGAL_DOC_LABELS: Record<LegalDocType, string> = {
  nda: "Accord de Confidentialité (NDA)",
  shareholders_agreement: "Pacte d'Actionnaires",
  term_sheet: "Term Sheet",
  vesting: "Convention de Vesting",
  freelance_contract: "Contrat Freelance",
  investor_convention: "Convention Investisseur",
};

const H1 = (text: string) => new Paragraph({ text, heading: HeadingLevel.HEADING_2, spacing: { before: 280, after: 120 } });
const P = (text: string) => new Paragraph({ children: [new TextRun({ text })], spacing: { after: 140 }, alignment: AlignmentType.JUSTIFIED });
const Bold = (text: string) => new Paragraph({ children: [new TextRun({ text, bold: true })], spacing: { after: 140 } });
const fmt = (n: number) => n.toLocaleString("fr-FR") + " FCFA";
const DISCLAIMER = "Document généré automatiquement à titre de point de départ de négociation. Il ne constitue pas un conseil juridique et doit être relu par un avocat avant toute signature.";

const titleBlock = (title: string, subtitle: string) => [
  new Paragraph({ text: title, heading: HeadingLevel.TITLE, alignment: AlignmentType.CENTER, spacing: { after: 80 } }),
  new Paragraph({ children: [new TextRun({ text: subtitle, italics: true, size: 20 })], alignment: AlignmentType.CENTER, spacing: { after: 300 } }),
];

const signatureBlock = (nameA: string, nameB: string) => [
  new Paragraph({ text: "", spacing: { before: 500 } }),
  new Paragraph({ children: [new TextRun({ text: nameA, bold: true })], spacing: { after: 400 } }),
  new Paragraph({ text: "Signature : _______________________     Date : _______________" }),
  new Paragraph({ text: "", spacing: { before: 300 } }),
  new Paragraph({ children: [new TextRun({ text: nameB, bold: true })], spacing: { after: 400 } }),
  new Paragraph({ text: "Signature : _______________________     Date : _______________" }),
  new Paragraph({ text: "", spacing: { before: 500 } }),
  new Paragraph({ children: [new TextRun({ text: DISCLAIMER, italics: true, color: "C00000", size: 18 })] }),
];

export interface NdaParams { partyA: string; partyB: string; purpose: string; durationYears: number; }
export interface ShareholdersParams { companyName: string; shareholders: { name: string; percentage: number }[]; }
export interface TermSheetParams { companyName: string; investorName: string; preMoneyValuation: number; investmentAmount: number; instrument: string; boardSeats: string; }
export interface VestingParams { companyName: string; beneficiaryName: string; totalEquityPercentage: number; vestingYears: number; cliffMonths: number; }
export interface FreelanceParams { companyName: string; freelancerName: string; missionDescription: string; durationMonths: number; dailyRate: number; }
export interface InvestorConventionParams { companyName: string; investorName: string; infoRights: boolean; proRataRights: boolean; boardObserver: boolean; }

function buildNda(p: NdaParams, dateLabel: string): Document {
  return new Document({ sections: [{ properties: { page: { margin: { top: 1134, bottom: 1134, left: 1134, right: 1134 } } }, children: [
    ...titleBlock("ACCORD DE CONFIDENTIALITÉ (NDA)", `Conclu le ${dateLabel}`),
    P(`Entre ${p.partyA} (la "Partie Divulgatrice") et ${p.partyB} (la "Partie Réceptrice"), collectivement les "Parties".`),
    H1("1. Objet"),
    P(`Les Parties souhaitent échanger des informations confidentielles dans le cadre suivant : ${p.purpose}. Le présent accord définit les conditions de protection de ces informations.`),
    H1("2. Définition des informations confidentielles"),
    P(`Est considérée comme confidentielle toute information, technique, commerciale, financière ou stratégique, communiquée par écrit, oralement ou par tout autre moyen, désignée comme telle ou dont le caractère confidentiel est raisonnablement déductible des circonstances.`),
    H1("3. Obligations de la Partie Réceptrice"),
    P(`La Partie Réceptrice s'engage à : (a) ne pas divulguer les informations confidentielles à des tiers sans accord écrit préalable de la Partie Divulgatrice ; (b) n'utiliser ces informations qu'aux fins prévues par le présent accord ; (c) protéger ces informations avec le même niveau de précaution que ses propres informations confidentielles, et à minima avec une diligence raisonnable.`),
    H1("4. Exceptions"),
    P(`Les obligations ci-dessus ne s'appliquent pas aux informations : déjà publiques sans faute de la Partie Réceptrice ; déjà connues de la Partie Réceptrice avant divulgation ; reçues légitimement d'un tiers non lié par une obligation de confidentialité ; ou dont la divulgation est exigée par la loi ou une autorité compétente.`),
    H1("5. Durée"),
    P(`Le présent accord prend effet à la date de signature et les obligations de confidentialité restent en vigueur pendant une durée de ${p.durationYears} an(s) à compter de cette date, y compris en cas de résiliation anticipée des discussions entre les Parties.`),
    H1("6. Droit applicable"),
    P(`Le présent accord est soumis au droit burkinabè et aux Actes uniformes OHADA applicables. Tout litige sera porté devant les juridictions compétentes de Ouagadougou, à défaut de résolution amiable.`),
    ...signatureBlock(p.partyA, p.partyB),
  ]}] });
}

function buildShareholdersAgreement(p: ShareholdersParams, dateLabel: string): Document {
  const shareholdersList = p.shareholders.map((s) => `- ${s.name} : ${s.percentage}%`).join("\n");
  return new Document({ sections: [{ properties: { page: { margin: { top: 1134, bottom: 1134, left: 1134, right: 1134 } } }, children: [
    ...titleBlock("PACTE D'ACTIONNAIRES", `${p.companyName} — Conclu le ${dateLabel}`),
    P(`Le présent pacte est conclu entre les actionnaires de ${p.companyName} (la "Société"), dont la répartition du capital à la date de signature est la suivante :`),
    ...p.shareholders.map((s) => new Paragraph({ children: [new TextRun({ text: `${s.name} — ${s.percentage}%` })], spacing: { after: 80 } })),
    H1("1. Objet"),
    P(`Le présent pacte a pour objet d'organiser les relations entre les actionnaires de la Société, notamment en matière de gouvernance, de cession de titres et de sortie.`),
    H1("2. Gouvernance"),
    P(`Les décisions stratégiques de la Société (levée de fonds, cession d'actifs significatifs, modification des statuts, nomination des dirigeants) requièrent l'accord préalable des actionnaires représentant au moins la majorité qualifiée définie par les statuts et le droit OHADA applicable (Acte uniforme relatif au droit des sociétés commerciales).`),
    H1("3. Restrictions de cession — Droit de préemption"),
    P(`Tout actionnaire souhaitant céder tout ou partie de ses titres doit préalablement les proposer aux autres actionnaires, au prorata de leur participation, selon les modalités de prix et de délai définies en annexe. À défaut d'exercice de ce droit de préemption dans le délai imparti, l'actionnaire cédant peut céder ses titres au tiers acquéreur identifié, aux mêmes conditions.`),
    H1("4. Clause de sortie conjointe (Tag-Along)"),
    P(`En cas de cession par un actionnaire majoritaire d'une participation significative à un tiers, les autres actionnaires disposent du droit de céder leurs propres titres au même tiers acquéreur, aux mêmes conditions de prix et de paiement.`),
    H1("5. Clause de sortie forcée (Drag-Along)"),
    P(`En cas d'offre d'acquisition portant sur la totalité du capital de la Société acceptée par les actionnaires représentant la majorité qualifiée définie en annexe, les actionnaires minoritaires s'engagent à céder leurs titres aux mêmes conditions.`),
    H1("6. Non-concurrence et confidentialité"),
    P(`Chaque actionnaire dirigeant s'engage à ne pas exercer d'activité concurrente à celle de la Société pendant la durée de sa participation au capital et pendant une période de douze (12) mois après la cession de ses titres, et à préserver la confidentialité des informations relatives à la Société.`),
    H1("7. Durée et droit applicable"),
    P(`Le présent pacte est conclu pour la durée de vie de la Société, sauf résiliation anticipée par accord unanime des Parties. Il est soumis au droit burkinabè et aux Actes uniformes OHADA relatifs au droit des sociétés commerciales et du groupement d'intérêt économique.`),
    new Paragraph({ text: "", spacing: { before: 400 } }),
    new Paragraph({ children: [new TextRun({ text: DISCLAIMER, italics: true, color: "C00000", size: 18 })] }),
  ]}] });
}

function buildTermSheet(p: TermSheetParams, dateLabel: string): Document {
  const postMoney = p.preMoneyValuation + p.investmentAmount;
  return new Document({ sections: [{ properties: { page: { margin: { top: 1134, bottom: 1134, left: 1134, right: 1134 } } }, children: [
    ...titleBlock("TERM SHEET", `${p.companyName} × ${p.investorName} — ${dateLabel}`),
    P(`Le présent document résume les principaux termes envisagés pour un investissement de ${p.investorName} (l'"Investisseur") dans ${p.companyName} (la "Société"). Il est non contraignant, à l'exception des clauses de confidentialité et d'exclusivité, et sera suivi de la documentation juridique définitive en cas d'accord.`),
    H1("1. Montant et instrument"),
    P(`Instrument : ${p.instrument}. Montant de l'investissement : ${fmt(p.investmentAmount)}.`),
    H1("2. Valorisation"),
    P(`Valorisation pré-money : ${fmt(p.preMoneyValuation)}. Valorisation post-money : ${fmt(postMoney)}.`),
    H1("3. Gouvernance"),
    P(`Composition du conseil / droits de gouvernance envisagés : ${p.boardSeats}.`),
    H1("4. Droits préférentiels usuels"),
    P(`Sous réserve de la documentation définitive, l'Investisseur bénéficiera des droits usuels suivants : droit d'information périodique, droit de préemption (pro-rata) lors des tours de financement ultérieurs, et préférence de liquidation en cas d'événement de liquidité.`),
    H1("5. Conditions suspensives"),
    P(`L'investissement est conditionné à la réalisation d'un audit (due diligence) juridique, financier et opérationnel satisfaisant pour l'Investisseur, ainsi qu'à la négociation et signature de la documentation juridique définitive (pacte d'actionnaires, bulletin de souscription).`),
    H1("6. Exclusivité"),
    P(`La Société s'engage à ne pas solliciter ni négocier avec d'autres investisseurs potentiels pendant une période de quarante-cinq (45) jours à compter de la signature du présent Term Sheet.`),
    H1("7. Droit applicable"),
    P(`Le présent Term Sheet et la documentation définitive qui en découlera seront soumis au droit burkinabè et aux Actes uniformes OHADA applicables.`),
    ...signatureBlock(p.companyName, p.investorName),
  ]}] });
}

function buildVesting(p: VestingParams, dateLabel: string): Document {
  return new Document({ sections: [{ properties: { page: { margin: { top: 1134, bottom: 1134, left: 1134, right: 1134 } } }, children: [
    ...titleBlock("CONVENTION DE VESTING", `${p.companyName} — Conclu le ${dateLabel}`),
    P(`La présente convention est conclue entre ${p.companyName} (la "Société") et ${p.beneficiaryName} (le "Bénéficiaire"), et définit les modalités d'acquisition progressive de sa participation au capital.`),
    H1("1. Participation attribuée"),
    P(`Le Bénéficiaire se voit attribuer, sous réserve de l'acquisition progressive décrite ci-après, une participation représentant ${p.totalEquityPercentage}% du capital de la Société à la date de signature (sous réserve de dilution lors des tours de financement ultérieurs).`),
    H1("2. Période d'acquisition (Vesting)"),
    P(`La participation s'acquiert de manière linéaire sur une période de ${p.vestingYears} an(s) à compter de la date d'entrée en fonction du Bénéficiaire, sous réserve du maintien de sa collaboration avec la Société pendant cette période.`),
    H1("3. Falaise (Cliff)"),
    P(`Aucune part de la participation attribuée n'est acquise avant l'expiration d'une période de ${p.cliffMonths} mois suivant la date d'entrée en fonction (la "Falaise"). À l'issue de cette période, la fraction correspondante de la participation s'acquiert immédiatement, puis le solde s'acquiert de manière linéaire mensuelle jusqu'au terme de la période de vesting.`),
    H1("4. Départ anticipé"),
    P(`En cas de cessation de la collaboration du Bénéficiaire avec la Société avant le terme de la période de vesting, seule la fraction de participation effectivement acquise à la date de cessation est définitivement conservée par le Bénéficiaire. La fraction non acquise fait retour à la Société ou au pool disponible pour attribution future, selon les modalités prévues par les statuts et le pacte d'actionnaires.`),
    H1("5. Accélération"),
    P(`Les parties peuvent convenir de clauses d'accélération du vesting en cas de changement de contrôle de la Société, à définir séparément dans le pacte d'actionnaires applicable.`),
    H1("6. Droit applicable"),
    P(`La présente convention est soumise au droit burkinabè et aux Actes uniformes OHADA relatifs au droit des sociétés commerciales.`),
    ...signatureBlock(p.companyName, p.beneficiaryName),
  ]}] });
}

function buildFreelanceContract(p: FreelanceParams, dateLabel: string): Document {
  const totalEstimate = p.dailyRate * 20 * p.durationMonths;
  return new Document({ sections: [{ properties: { page: { margin: { top: 1134, bottom: 1134, left: 1134, right: 1134 } } }, children: [
    ...titleBlock("CONTRAT DE PRESTATION DE SERVICES (FREELANCE)", `${p.companyName} × ${p.freelancerName} — ${dateLabel}`),
    P(`Entre ${p.companyName} (le "Client") et ${p.freelancerName} (le "Prestataire"), intervenant en qualité de prestataire indépendant.`),
    H1("1. Objet de la mission"),
    P(`${p.missionDescription}`),
    H1("2. Durée"),
    P(`La mission est conclue pour une durée de ${p.durationMonths} mois à compter de la date de signature, renouvelable par accord écrit des parties.`),
    H1("3. Rémunération"),
    P(`Le Prestataire est rémunéré sur la base d'un taux journalier de ${fmt(p.dailyRate)}, soit une estimation indicative de ${fmt(totalEstimate)} sur la durée totale de la mission (base 20 jours/mois), payable mensuellement sur présentation de facture, dans un délai de trente (30) jours.`),
    H1("4. Statut du Prestataire"),
    P(`Le Prestataire exerce sa mission en toute indépendance, sans lien de subordination avec le Client. Il demeure seul responsable de ses obligations fiscales et sociales liées à son statut d'indépendant ou d'entrepreneur individuel.`),
    H1("5. Propriété intellectuelle"),
    P(`Sauf stipulation contraire, les livrables créés par le Prestataire dans le cadre strict de la mission décrite à l'Article 1 sont cédés au Client à compter du paiement intégral des sommes dues, dans les conditions prévues par l'Accord de Bangui instituant l'OAPI.`),
    H1("6. Confidentialité"),
    P(`Le Prestataire s'engage à préserver la confidentialité de toute information relative au Client dont il aurait connaissance dans le cadre de la mission, pendant toute sa durée et pendant les deux (2) années suivant son terme.`),
    H1("7. Résiliation"),
    P(`Chaque partie peut résilier le présent contrat moyennant un préavis écrit de quinze (15) jours, sans préjudice du paiement des prestations déjà réalisées.`),
    H1("8. Droit applicable"),
    P(`Le présent contrat est soumis au droit burkinabè. Tout litige sera, à défaut de résolution amiable, porté devant les juridictions compétentes de Ouagadougou.`),
    ...signatureBlock(p.companyName, p.freelancerName),
  ]}] });
}

function buildInvestorConvention(p: InvestorConventionParams, dateLabel: string): Document {
  const rights: string[] = [];
  if (p.infoRights) rights.push("Droit d'information périodique (reporting financier trimestriel a minima)");
  if (p.proRataRights) rights.push("Droit de préemption pro-rata lors des tours de financement ultérieurs");
  if (p.boardObserver) rights.push("Droit d'observateur au conseil de gouvernance de la Société, sans droit de vote");
  return new Document({ sections: [{ properties: { page: { margin: { top: 1134, bottom: 1134, left: 1134, right: 1134 } } }, children: [
    ...titleBlock("CONVENTION INVESTISSEUR", `${p.companyName} × ${p.investorName} — ${dateLabel}`),
    P(`La présente convention (parfois appelée "side letter") est conclue entre ${p.companyName} (la "Société") et ${p.investorName} (l'"Investisseur"), en complément de la documentation d'investissement principale, et précise certains droits spécifiques accordés à l'Investisseur.`),
    H1("1. Droits accordés"),
    ...(rights.length > 0 ? rights.map((r) => new Paragraph({ children: [new TextRun({ text: `- ${r}` })], spacing: { after: 100 } })) : [P("Aucun droit spécifique complémentaire n'est accordé au-delà de la documentation d'investissement principale.")]),
    H1("2. Confidentialité"),
    P(`L'Investisseur s'engage à préserver la confidentialité des informations non-publiques auxquelles il accède dans le cadre de l'exercice des droits ci-dessus, et à ne les utiliser qu'aux fins du suivi de son investissement.`),
    H1("3. Articulation avec la documentation principale"),
    P(`En cas de contradiction entre la présente convention et le pacte d'actionnaires ou la documentation d'investissement principale, les dispositions les plus favorables à l'ensemble des actionnaires, ou à défaut celles du pacte d'actionnaires, prévalent.`),
    H1("4. Droit applicable"),
    P(`La présente convention est soumise au droit burkinabè et aux Actes uniformes OHADA applicables.`),
    ...signatureBlock(p.companyName, p.investorName),
  ]}] });
}

export type LegalDocParams =
  | { type: "nda"; data: NdaParams }
  | { type: "shareholders_agreement"; data: ShareholdersParams }
  | { type: "term_sheet"; data: TermSheetParams }
  | { type: "vesting"; data: VestingParams }
  | { type: "freelance_contract"; data: FreelanceParams }
  | { type: "investor_convention"; data: InvestorConventionParams };

export async function generateLegalDocBlob(input: LegalDocParams, dateLabel: string): Promise<Blob> {
  let doc: Document;
  switch (input.type) {
    case "nda": doc = buildNda(input.data, dateLabel); break;
    case "shareholders_agreement": doc = buildShareholdersAgreement(input.data, dateLabel); break;
    case "term_sheet": doc = buildTermSheet(input.data, dateLabel); break;
    case "vesting": doc = buildVesting(input.data, dateLabel); break;
    case "freelance_contract": doc = buildFreelanceContract(input.data, dateLabel); break;
    case "investor_convention": doc = buildInvestorConvention(input.data, dateLabel); break;
  }
  return Packer.toBlob(doc);
}
