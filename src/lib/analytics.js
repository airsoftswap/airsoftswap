// src/utils/analytics.js
// Charge Google Analytics UNIQUEMENT après consentement de l'utilisateur (RGPD).
// Tant que l'user n'a pas accepté, AUCUN cookie / tracker GA n'est posé.

const GA_ID = "G-9GFK2HGY7K";
const CONSENT_KEY = "airsoftswap_cookie_consent"; // "accepted" | "refused"

// Lit le choix stocké ("accepted", "refused" ou null si pas encore choisi)
export function getConsent() {
  try {
    return localStorage.getItem(CONSENT_KEY);
  } catch {
    return null;
  }
}

// Enregistre le choix de l'utilisateur
export function setConsent(value) {
  try {
    localStorage.setItem(CONSENT_KEY, value);
  } catch {
    /* localStorage indisponible (navigation privée stricte) : on ignore */
  }
}

// Injecte et initialise GA. Idempotent : ne se charge qu'une seule fois.
export function loadGA() {
  if (typeof window === "undefined") return;
  if (window.__gaLoaded) return;
  window.__gaLoaded = true;

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  function gtag() {
    window.dataLayer.push(arguments);
  }
  window.gtag = gtag;
  gtag("js", new Date());
  // anonymize_ip : limite l'IP collectée, attendu par la CNIL
  gtag("config", GA_ID, { anonymize_ip: true });
}

// À appeler au démarrage de l'app : recharge GA si l'user avait déjà accepté
export function initAnalytics() {
  if (getConsent() === "accepted") {
    loadGA();
  }
}
