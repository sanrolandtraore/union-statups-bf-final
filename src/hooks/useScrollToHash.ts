import { useEffect } from "react";
import { useLocation } from "react-router-dom";

// Hauteur approximative de la navbar fixe, pour ne pas masquer le haut
// de la section ciblée derrière elle.
const NAVBAR_OFFSET = 72;

/**
 * React Router ne scrolle pas automatiquement vers un fragment d'URL
 * (#features, #faq, ...) lors d'une navigation SPA — contrairement au
 * comportement natif du navigateur pour une vraie page HTML. Ce hook
 * reproduit ce comportement : à chaque changement de route/hash, si un
 * hash est présent, on scrolle jusqu'à l'élément correspondant dès qu'il
 * est monté dans le DOM.
 */
export function useScrollToHash() {
  const { hash, pathname } = useLocation();

  useEffect(() => {
    if (!hash) return;

    const id = hash.replace("#", "");
    let attempts = 0;
    const maxAttempts = 20;

    const tryScroll = () => {
      const el = document.getElementById(id);
      if (el) {
        const top = el.getBoundingClientRect().top + window.scrollY - NAVBAR_OFFSET;
        window.scrollTo({ top, behavior: "smooth" });
        return;
      }
      attempts += 1;
      if (attempts < maxAttempts) {
        // La section visée peut ne pas encore être montée (lazy sections,
        // images en cours de mise en page) : on retente brièvement.
        setTimeout(tryScroll, 100);
      }
    };

    // Laisse le temps au reste de la page de se monter avant de scroller.
    const initial = setTimeout(tryScroll, 50);
    return () => clearTimeout(initial);
  }, [hash, pathname]);
}
