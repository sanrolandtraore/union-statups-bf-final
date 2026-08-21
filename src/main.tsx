import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./i18n";
import { ThemeProvider } from "./hooks/useTheme";

// ── Correctif défensif : "removeChild"/"insertBefore" NotFoundError ────────
// Bug connu et documenté de l'écosystème React 18 : quand une bibliothèque à
// portails DOM (Radix UI, utilisé partout sur cette plateforme pour les menus
// déroulants, Select, Dialog, Tooltip...) retire un nœud de son propre côté
// au même instant où React tente, lui aussi, de retirer ou d'insérer un nœud
// dans la même zone de l'arbre (ex. : un re-rendu global — changement de
// langue, de thème, mise à jour d'un statut — survenant pendant qu'un menu
// est en train de se fermer), les deux se disputent le même nœud DOM et le
// navigateur lève "Failed to execute 'removeChild'/'insertBefore' on 'Node':
// ... is not a child of this node", qui fait planter toute l'application
// (capturé jusqu'ici par ErrorBoundary). Cette page est un exemple précis
// que nous avons déjà corrigé (LanguageSwitcher, ThemeSwitcher, KYCSection,
// KYCDialog), mais le même risque existe partout où un composant Radix
// (Select, DropdownMenu, Dialog, Tooltip...) peut se fermer pendant qu'un
// autre re-rendu a lieu ailleurs sur la page — impossible à garantir à 100%
// dans une application de cette taille au cas par cas.
//
// Correctif recommandé par l'équipe React elle-même pour cette classe de bug
// (https://github.com/facebook/react/issues/11538) : rendre ces deux méthodes
// DOM défensives — si le nœud à retirer/positionner n'est déjà plus un enfant
// du nœud parent, on ignore l'appel silencieusement au lieu de planter.
if (typeof Node !== "undefined" && Node.prototype) {
  const originalRemoveChild = Node.prototype.removeChild;
  Node.prototype.removeChild = function <T extends Node>(this: Node, child: T): T {
    if (child.parentNode !== this) {
      if (import.meta.env.DEV) {
        console.warn("[removeChild] Nœud déjà retiré, appel ignoré au lieu de planter.", child);
      }
      return child;
    }
    return originalRemoveChild.call(this, child) as T;
  };

  const originalInsertBefore = Node.prototype.insertBefore;
  Node.prototype.insertBefore = function <T extends Node>(this: Node, newNode: T, referenceNode: Node | null): T {
    if (referenceNode && referenceNode.parentNode !== this) {
      if (import.meta.env.DEV) {
        console.warn("[insertBefore] Nœud de référence déjà retiré, insertion en fin de liste.", referenceNode);
      }
      return originalInsertBefore.call(this, newNode, null) as T;
    }
    return originalInsertBefore.call(this, newNode, referenceNode) as T;
  };
}

createRoot(document.getElementById("root")!).render(
  <ThemeProvider>
    <App />
  </ThemeProvider>
);
