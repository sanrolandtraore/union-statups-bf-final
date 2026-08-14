import { describe, it, expect } from "vitest";
import { formatCFA, dealStatusLabels } from "@/types/syndicate";

describe("formatCFA", () => {
  it("formate un montant simple avec le symbole de la devise XOF", () => {
    const result = formatCFA(1000);
    // Intl.NumberFormat peut utiliser un espace insécable — on normalise avant de comparer.
    expect(result.replace(/\s/g, " ")).toContain("1 000");
    expect(result).toMatch(/F\s?CFA|XOF/i);
  });

  it("ne montre jamais de décimales (maximumFractionDigits: 0)", () => {
    const result = formatCFA(1234567.89);
    expect(result).not.toMatch(/[,.]\d/);
  });

  it("gère zéro correctement", () => {
    const result = formatCFA(0);
    expect(result.replace(/\s/g, " ")).toContain("0");
  });

  it("gère les grands montants (plusieurs millions)", () => {
    const result = formatCFA(50_000_000);
    expect(result.replace(/\s/g, " ")).toContain("50 000 000");
  });

  it("gère les montants négatifs sans planter", () => {
    expect(() => formatCFA(-1000)).not.toThrow();
  });
});

describe("dealStatusLabels", () => {
  it("fournit un libellé pour chaque statut de deal connu", () => {
    expect(dealStatusLabels.open).toBe("Ouvert");
    expect(dealStatusLabels.funded).toBe("Financé");
    expect(dealStatusLabels.closed).toBe("Clôturé");
  });
});
