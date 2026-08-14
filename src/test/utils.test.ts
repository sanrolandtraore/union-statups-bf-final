import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";

describe("cn", () => {
  it("fusionne plusieurs chaînes de classes", () => {
    expect(cn("text-sm", "font-bold")).toBe("text-sm font-bold");
  });

  it("résout les conflits Tailwind en gardant la dernière classe", () => {
    // tailwind-merge doit garder uniquement la dernière classe de padding en conflit
    expect(cn("p-2", "p-4")).toBe("p-4");
  });

  it("ignore les valeurs falsy (conditions ternaires courantes en JSX)", () => {
    const isActive = false;
    expect(cn("base", isActive && "active")).toBe("base");
  });

  it("inclut les classes conditionnelles vraies", () => {
    const isActive = true;
    expect(cn("base", isActive && "active")).toBe("base active");
  });

  it("gère un appel sans arguments", () => {
    expect(cn()).toBe("");
  });
});
