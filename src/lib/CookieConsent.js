// src/components/CookieConsent.js
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom"; // retire cette ligne si tu n'utilises pas react-router
import { getConsent, setConsent, loadGA } from "./analytics";

// Tokens AirsoftSwap
const KAKI = "#86AD4A";
const KAKI_DARK = "#6B8C3A";
const NEAR_BLACK = "#0A0B09";

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // On n'affiche le bandeau que si aucun choix n'a encore été fait
    if (!getConsent()) setVisible(true);
  }, []);

  const accept = () => {
    setConsent("accepted");
    loadGA();
    setVisible(false);
  };

  const refuse = () => {
    setConsent("refused");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div style={styles.overlay} role="dialog" aria-live="polite" aria-label="Consentement aux cookies">
      <div style={styles.banner}>
        <div style={styles.textBlock}>
          <p style={styles.title}>🍪 Cookies & mesure d'audience</p>
          <p style={styles.text}>
            AirsoftSwap utilise des cookies de mesure d'audience (Google Analytics) pour
            comprendre l'usage du site. Ils ne sont déposés qu'avec ton accord. Les cookies
            strictement nécessaires au fonctionnement (connexion, session) restent toujours actifs.{" "}
            <Link to="/legal/confidentialite" style={styles.link}>
              En savoir plus
            </Link>
          </p>
        </div>
        <div style={styles.buttons}>
          <button style={styles.refuse} onClick={refuse}>
            Refuser
          </button>
          <button style={styles.accept} onClick={accept}>
            Accepter
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    display: "flex",
    justifyContent: "center",
    padding: "16px",
    pointerEvents: "none",
  },
  banner: {
    pointerEvents: "auto",
    width: "100%",
    maxWidth: "900px",
    background: NEAR_BLACK,
    border: `1px solid ${KAKI_DARK}`,
    borderRadius: "10px",
    boxShadow: "0 8px 30px rgba(0,0,0,0.5)",
    padding: "18px 20px",
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: "16px",
    fontFamily: "'Barlow', sans-serif",
  },
  textBlock: { flex: "1 1 320px", minWidth: "260px" },
  title: {
    fontFamily: "'Barlow Condensed', sans-serif",
    fontSize: "18px",
    fontWeight: 600,
    color: KAKI,
    margin: "0 0 6px",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  text: { fontSize: "14px", lineHeight: 1.5, color: "#cfd3c8", margin: 0 },
  link: { color: KAKI, textDecoration: "underline" },
  buttons: { display: "flex", gap: "10px", flex: "0 0 auto" },
  refuse: {
    background: "transparent",
    color: "#cfd3c8",
    border: "1px solid #3a3d34",
    borderRadius: "6px",
    padding: "10px 18px",
    fontSize: "14px",
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "'Barlow', sans-serif",
  },
  accept: {
    background: KAKI,
    color: NEAR_BLACK,
    border: "none",
    borderRadius: "6px",
    padding: "10px 22px",
    fontSize: "14px",
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "'Barlow', sans-serif",
  },
};
