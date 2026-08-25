import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from "docx";

export interface SafeParams {
  companyLegalName: string;
  investorName: string;
  purchaseAmount: number;
  valuationCap: number | null;
  discountRate: number | null; // ex: 0.20 pour 20%
  hasMfn: boolean;
  governingLaw: string;
  dateLabel: string; // ex: "24 août 2026"
}

const fmtFcfa = (n: number) => n.toLocaleString("fr-FR") + " FCFA";
const fmtPct = (n: number) => `${Math.round(n * 100)}%`;

const H1 = (text: string) => new Paragraph({ text, heading: HeadingLevel.HEADING_2, spacing: { before: 280, after: 120 } });
const P = (text: string) => new Paragraph({ children: [new TextRun({ text })], spacing: { after: 140 }, alignment: AlignmentType.JUSTIFIED });
const Bold = (text: string) => new Paragraph({ children: [new TextRun({ text, bold: true })], spacing: { after: 140 } });

/**
 * Génère un SAFE (Simple Agreement for Future Equity) au format "post-money",
 * la variante standard depuis la révision 2018 de l'instrument créé par
 * Y Combinator en 2013. Structure et mécanique fidèles à l'instrument
 * original, rédigées en français et adaptées au contexte juridique
 * OHADA / Burkina Faso (le SAFE original est pensé pour une C-Corp
 * Delaware ; toute émission réelle doit être validée par un conseil
 * juridique local avant signature).
 */
export function buildSafeDocument(params: SafeParams): Document {
  const { companyLegalName, investorName, purchaseAmount, valuationCap, discountRate, hasMfn, governingLaw, dateLabel } = params;

  const conversionMechanics: Paragraph[] = [];
  if (valuationCap && discountRate) {
    conversionMechanics.push(P(`Lors d'un Tour de Financement Qualifiant, ce SAFE convertit en actions de préférence au prix le plus favorable à l'Investisseur entre (a) le prix implicite par action correspondant au Plafond de Valorisation de ${fmtFcfa(valuationCap)}, et (b) le prix par action du tour multiplié par (1 − ${fmtPct(discountRate)}).`));
  } else if (valuationCap) {
    conversionMechanics.push(P(`Lors d'un Tour de Financement Qualifiant, ce SAFE convertit en actions de préférence au prix implicite par action correspondant à un Plafond de Valorisation de ${fmtFcfa(valuationCap)} (valorisation post-money).`));
  } else if (discountRate) {
    conversionMechanics.push(P(`Lors d'un Tour de Financement Qualifiant, ce SAFE convertit en actions de préférence au prix par action du tour multiplié par (1 − ${fmtPct(discountRate)}), sans plafond de valorisation.`));
  } else {
    conversionMechanics.push(P(`Lors d'un Tour de Financement Qualifiant, ce SAFE convertit en actions de préférence au prix par action du tour, sans plafond de valorisation ni décote.`));
  }

  const doc = new Document({
    sections: [
      {
        properties: { page: { margin: { top: 1134, bottom: 1134, left: 1134, right: 1134 } } },
        children: [
          new Paragraph({
            text: "SIMPLE AGREEMENT FOR FUTURE EQUITY (SAFE)",
            heading: HeadingLevel.TITLE,
            alignment: AlignmentType.CENTER,
            spacing: { after: 80 },
          }),
          new Paragraph({
            children: [new TextRun({ text: "Variante post-money — inspirée de l'instrument standard créé par Y Combinator (2013, révisé 2018)", italics: true, size: 20 })],
            alignment: AlignmentType.CENTER,
            spacing: { after: 300 },
          }),

          P(`Le présent SAFE ("Contrat") est conclu à la date du ${dateLabel} entre :`),
          Bold(`${companyLegalName}`),
          P(`(la "Société"), et`),
          Bold(`${investorName}`),
          P(`(l'"Investisseur").`),

          H1("1. Investissement"),
          P(`En contrepartie du paiement par l'Investisseur d'un montant de ${fmtFcfa(purchaseAmount)} (le "Montant de l'Investissement") à la date du présent Contrat, la Société émet au bénéfice de l'Investisseur le droit d'obtenir un certain nombre d'actions de préférence de la Société, selon les modalités décrites ci-après.`),

          H1("2. Événement déclencheur — Tour de Financement Qualifiant"),
          P(`Si la Société procède à un Tour de Financement Qualifiant (une levée de fonds par émission d'actions de préférence, à des fins principalement de levée de capitaux, d'un montant total minimum jugé significatif par les parties) avant la résiliation du présent Contrat, celui-ci convertit automatiquement en actions de préférence de la même catégorie que celle émise lors de ce tour, selon les modalités de conversion décrites à l'Article 3.`),

          H1("3. Modalités de conversion"),
          ...conversionMechanics,
          P(`Le nombre d'actions émises à l'Investisseur est égal au Montant de l'Investissement divisé par le Prix de Conversion par Action déterminé conformément à l'alinéa ci-dessus.`),

          H1("4. Événement de Liquidité"),
          P(`En cas de Fusion-Acquisition ou de Dissolution de la Société avant conversion du présent SAFE, l'Investisseur a le droit de recevoir, au choix de la Société, soit (a) le Montant de l'Investissement, soit (b) le montant qu'il aurait perçu si le SAFE avait été converti en actions ordinaires immédiatement avant l'événement, selon le montant le plus élevé, sous réserve de la priorité de paiement applicable aux autres SAFE et instruments similaires en circulation.`),

          H1("5. Absence de droits de vote et de dividendes avant conversion"),
          P(`Le présent SAFE ne confère à l'Investisseur aucun droit de vote, aucun droit à dividende, ni aucune qualité d'actionnaire de la Société tant qu'il n'a pas été converti en actions conformément aux Articles 2 et 3.`),

          H1("6. Clause de la Nation la Plus Favorisée (MFN)"),
          P(hasMfn
            ? `Si la Société émet un ou plusieurs autres SAFE ou instruments convertibles avant la conversion ou la résiliation du présent Contrat, à des conditions plus favorables à l'investisseur concerné, la Société en informe l'Investisseur, qui peut alors choisir d'adopter ces conditions plus favorables pour le présent Contrat.`
            : `Les parties conviennent de ne pas inclure de clause de la Nation la Plus Favorisée dans le présent Contrat.`),

          H1("7. Déclarations et garanties de la Société"),
          P(`La Société déclare et garantit qu'elle est dûment constituée et existe valablement, qu'elle dispose du pouvoir et de l'autorité nécessaires pour conclure le présent Contrat, et que la conclusion du présent Contrat ne contrevient à aucun engagement contractuel existant significatif.`),

          H1("8. Déclarations et garanties de l'Investisseur"),
          P(`L'Investisseur déclare qu'il dispose des pouvoirs nécessaires pour conclure le présent Contrat et qu'il a été en mesure d'obtenir les informations qu'il jugeait nécessaires sur la Société avant de procéder à l'investissement.`),

          H1("9. Droit applicable"),
          P(`Le présent Contrat est soumis au droit suivant : ${governingLaw}. Les parties reconnaissent que l'instrument SAFE a été conçu à l'origine pour des sociétés de droit américain (Delaware C-Corp) ; son adaptation à une autre forme sociale ou juridiction requiert la validation d'un conseil juridique local avant signature, notamment au regard des dispositions de l'Acte uniforme OHADA relatif au droit des sociétés commerciales applicables à l'émission d'actions de préférence.`),

          H1("10. Divers"),
          P(`Le présent Contrat constitue l'intégralité de l'accord entre les parties concernant son objet. Toute modification doit être constatée par écrit et signée par les deux parties. Le présent Contrat n'est cessible par l'Investisseur qu'avec l'accord préalable écrit de la Société, sauf cession à une société affiliée.`),

          new Paragraph({ text: "", spacing: { before: 500 } }),
          new Paragraph({
            children: [new TextRun({ text: `${companyLegalName}`, bold: true })],
            spacing: { after: 400 },
          }),
          new Paragraph({ text: "Signature : _______________________     Date : _______________" }),
          new Paragraph({ text: "", spacing: { before: 300 } }),
          new Paragraph({
            children: [new TextRun({ text: `${investorName}`, bold: true })],
            spacing: { after: 400 },
          }),
          new Paragraph({ text: "Signature : _______________________     Date : _______________" }),

          new Paragraph({ text: "", spacing: { before: 500 } }),
          new Paragraph({
            children: [new TextRun({
              text: "Document généré automatiquement à titre de point de départ de négociation. Il ne constitue pas un conseil juridique et doit être relu par un avocat avant toute signature, en particulier pour son adaptation à la forme juridique et à la juridiction réelles de la Société.",
              italics: true, color: "C00000", size: 18,
            })],
          }),
        ],
      },
    ],
  });

  return doc;
}

export async function generateSafeBlob(params: SafeParams): Promise<Blob> {
  const doc = buildSafeDocument(params);
  return Packer.toBlob(doc);
}
