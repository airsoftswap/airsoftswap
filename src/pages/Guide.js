import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const SECTIONS = [
  {
    label: 'ACHETER', sub: 'en 4 étapes', steps: [
      { ic: 'ti-search', t: 'Parcourez les annonces', d: 'Filtrez par catégorie et trouvez la réplique ou l\u2019équipement qui vous plaît.' },
      { ic: 'ti-message', t: 'Contactez le vendeur', d: 'Posez vos questions directement via la messagerie sécurisée.' },
      { ic: 'ti-heart-handshake', t: 'Convenez de la vente', d: 'Prix, remise en main propre ou envoi : tout se décide entre vous.' },
      { ic: 'ti-star', t: 'Confirmez & évaluez', d: 'Confirmez la transaction puis laissez un avis au vendeur.' },
    ]
  },
  {
    label: 'VENDRE', sub: 'en 4 étapes', steps: [
      { ic: 'ti-photo-plus', t: 'Publiez votre annonce', d: 'Ajoutez photos, description, prix et catégorie en quelques clics.' },
      { ic: 'ti-message', t: 'Répondez aux acheteurs', d: 'Échangez via la messagerie et répondez aux questions.' },
      { ic: 'ti-package', t: 'Finalisez la vente', d: 'Convenez des modalités de paiement et de remise.' },
      { ic: 'ti-shield-check', t: 'Recevez un avis', d: 'Confirmez la vente et gagnez en réputation sur votre profil.' },
    ]
  },
  {
    label: 'LES AVIS', sub: 'comment ça marche', steps: [
      { ic: 'ti-messages', t: 'Discussion', d: 'Acheteur et vendeur échangent dans la conversation liée à l\u2019annonce.' },
      { ic: 'ti-circle-check', t: 'Double confirmation', d: 'Chacun clique « J\u2019ai vendu / acheté » et certifie la transaction sur l\u2019honneur.' },
      { ic: 'ti-lock-open', t: 'Évaluation débloquée', d: 'Une fois les deux confirmations faites, la notation s\u2019active.' },
      { ic: 'ti-star', t: 'Note + commentaire', d: 'Laissez une note et un avis : il apparaît sur le profil du membre.' },
    ]
  },
]

export default function Guide() {
  const navigate = useNavigate()
  useEffect(() => { window.scrollTo(0, 0) }, [])
  return (
    <div className="guide-wrap">
      <h1 className="guide-h1">Comment ça marche&nbsp;?</h1>
      <p className="guide-lead">AirsoftSwap met en relation les passionnés pour acheter, vendre et échanger des répliques en toute confiance. Voici comment ça se passe, étape par étape.</p>

      {SECTIONS.map((sec, si) => (
        <div key={si} className="guide-sec">
          <div className="guide-sec-head">
            <span className="guide-slash">//</span>
            <span className="guide-sec-title">{sec.label}</span>
            <span className="guide-sec-sub">{sec.sub}</span>
          </div>
          <div className="guide-row">
            {sec.steps.map((s, i) => (
              <div key={i} className="guide-card">
                <div className="guide-num">{i + 1}</div>
                <div className="guide-ico"><i className={`ti ${s.ic}`}></i></div>
                <div className="guide-title">{s.t}</div>
                <div className="guide-desc">{s.d}</div>
                <div className="guide-line"></div>
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="guide-tip">
        <i className="ti ti-shield-check"></i>
        <div className="guide-tip-txt"><b>100% entre particuliers, sans frais.</b> Les avis ne sont possibles qu'après une vraie transaction confirmée par les deux membres — pour garder des notes fiables et honnêtes.</div>
      </div>

      <div className="guide-cta">
        <button className="btn btn-acc" onClick={() => navigate('/annonces')}>Voir les annonces →</button>
        <button className="btn btn-out" onClick={() => navigate('/publier')}>Publier une annonce</button>
      </div>
    </div>
  )
}
