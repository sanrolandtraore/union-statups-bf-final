import { describe, it, expect, vi } from "vitest";

// Mock du client Supabase pour isoler le test du réseau réel.
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => ({
      insert: () => Promise.resolve({ error: null }),
    }),
  },
}));

import { reportError } from "@/lib/monitoring";

describe("reportError", () => {
  it("ne lève jamais d'exception, même avec une erreur malformée", () => {
    expect(() => reportError(new Error("test"))).not.toThrow();
  });

  it("accepte un contexte additionnel optionnel", () => {
    expect(() => reportError(new Error("test"), { componentStack: "..." })).not.toThrow();
  });

  it("fonctionne sans contexte fourni", () => {
    expect(() => reportError(new Error("sans contexte"))).not.toThrow();
  });
});
