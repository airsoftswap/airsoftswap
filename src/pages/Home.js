import React, { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useApp } from '../App'

const ETAT = { 'Neuf': 'b-neuf', 'Très bon état': 'b-tbe', 'Bon état': 'b-be', 'État correct': 'b-ec' }
const EMOJI = { AEG: '🔫', GBB: '🔫', Sniper: '🎯', Équipement: '🦺', Accessoire: '🔭', Pièces: '⚙️' }
const CATS = [
  { name: 'Tout', slug: 'Tout', emoji: '🎯' },
  { name: 'AEG', slug: 'AEG', emoji: '🔫' },
  { name: 'GBB', slug: 'GBB', emoji: '🔫' },
  { name: 'Sniper', slug: 'Sniper', emoji: '🎯' },
  { name: 'Équipement', slug: 'Équipement', emoji: '🦺' },
  { name: 'Accessoires', slug: 'Accessoire', emoji: '🔭' },
  { name: 'Pièces', slug: 'Pièces', emoji: '⚙️' },
]
const TICKER = [
  'Max_92 vient de poster une annonce',
  '3 ventes réalisées aujourd\'hui',
  '25 000+ membres sur AirsoftSwap',
  '124 annonces en ligne maintenant',
  'Communauté vérifiée et sécurisée',
  'Tactical31 vient de vendre son M4',
  'AirsoftPro13 a reçu un avis 5 étoiles',
]
const ACTIVITY = [
  { user: 'Tactical31', action: 'a publié une nouvelle annonce', time: '2 min', live: true },
  { user: 'Max_92', action: 'a rejoint AirsoftSwap', time: '5 min', live: true },
  { user: 'Soldier75', action: 'a vendu son HK416D VFC', time: '12 min', live: false },
  { user: 'AirsoftPro13', action: 'a laissé un avis 5★ à Nico75', time: '18 min', live: false },
  { user: 'Dark_Airsoft', action: 'a publié une nouvelle annonce', time: '25 min', live: false },
]

function CountUp({ to }) {
  const [v, setV] = useState(0)
  const done = useRef(false)
  useEffect(() => {
    if (done.current) return; done.current = true
    const step = Math.ceil(to / 40)
    let cur = 0
    const iv = setInterval(() => { cur = Math.min(cur + step, to); setV(cur); if (cur >= to) clearInterval(iv) }, 45)
    return () => clearInterval(iv)
  }, [to])
  return <>{v.toLocaleString('fr-FR')}</>
}

function AnnCard({ a, navigate, favs, toggleFav }) {
  const initials = a.profiles?.username?.slice(0, 2).toUpperCase() || '??'
  const isFav = favs.includes(a.id)
  return (
    <div className="ann-card" onClick={() => navigate(`/annonces/${a.id}`)}>
      <div className="ai">
        {a.images && a.images.length > 0
          ? <img src={a.images[0]} alt={a.titre} />
          : <span style={{ fontSize: 52 }}>{EMOJI[a.categorie] || '🔫'}</span>}
        <button className={`fav-btn ${isFav ? 'on' : ''}`} onClick={e => { e.stopPropagation(); toggleFav(a.id) }}>
          <i className={`ti ${isFav ? 'ti-heart-filled' : 'ti-heart'}`} style={{ fontSize: 13, color: isFav ? 'var(--red)' : 'var(--text3)' }}></i>
        </button>
      </div>
      <div className="ab">
        <div style={{ marginBottom: 6 }}><span className={`badge ${ETAT[a.etat] || 'b-be'}`}>{a.etat}</span></div>
        <div className="at">{a.titre}</div>
        <div className="ap">{Number(a.prix).toFixed(2)} €</div>
        <div className="al"><i className="ti ti-map-pin" style={{ fontSize: 11 }}></i>{a.ville || 'France'}</div>
        <div className="af">
          <div className="as"><div className="av">{initials}</div>{a.profiles?.username || 'Anonyme'}</div>
          {a.profiles?.note_moyenne > 0 && <div className="ar">★ {Number(a.profiles.note_moyenne).toFixed(1)}</div>}
        </div>
      </div>
    </div>
  )
}

function ProfilPopup({ user, onClose, navigate }) {
  if (!user) return null
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, backdropFilter: 'blur(4px)' }} onClick={onClose}>
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden', width: '100%', maxWidth: 340, position: 'relative' }} onClick={e => e.stopPropagation()}>
        {/* Barre verte en haut */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, var(--g), transparent)' }}></div>
        {/* Header */}
        <div style={{ padding: '20px 20px 16px', display: 'flex', gap: 14, alignItems: 'flex-start', borderBottom: '1px solid var(--border)' }}>
          <div style={{ width: 64, height: 64, borderRadius: 12, background: 'var(--gs)', border: '2px solid var(--gg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 800, color: 'var(--g)', fontFamily: 'var(--fh)', flexShrink: 0 }}>
            {user.username?.slice(0, 2).toUpperCase() || '??'}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--fh)', fontSize: 20, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '-.3px', marginBottom: 5, color: 'var(--text)' }}>{user.username}</div>
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 6 }}>
              <span style={{ background: 'var(--gs)', border: '1px solid var(--gg)', color: 'var(--g)', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4, fontFamily: 'var(--fh)', textTransform: 'uppercase', letterSpacing: '.5px' }}>✓ Vérifié</span>
              {user.nb_ventes >= 10 && <span style={{ background: 'rgba(200,150,42,.12)', border: '1px solid rgba(200,150,42,.3)', color: 'var(--amber)', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4, fontFamily: 'var(--fh)', textTransform: 'uppercase', letterSpacing: '.5px' }}>⭐ Top vendeur</span>}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text3)' }}>
              <span style={{ color: 'var(--amber)', fontSize: 13 }}>{'★'.repeat(Math.round(user.note_moyenne || 0))}</span>
              <span>{user.note_moyenne ? Number(user.note_moyenne).toFixed(1) : '—'} <span style={{ color: 'var(--text3)' }}>({user.nb_avis || 0} avis)</span></span>
            </div>
          </div>
        </div>
        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', borderBottom: '1px solid var(--border)' }}>
          {[
            { v: user.nb_annonces || 0, l: 'Annonces' },
            { v: user.nb_ventes || 0, l: 'Ventes' },
            { v: user.anciennete || '—', l: 'Membre' },
          ].map((s, i) => (
            <div key={i} style={{ padding: '12px 8px', textAlign: 'center', borderRight: i < 2 ? '1px solid var(--border)' : 'none' }}>
              <div style={{ fontFamily: 'var(--fh)', fontSize: 22, fontWeight: 800, color: 'var(--g)', lineHeight: 1 }}>{s.v}</div>
              <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 3, textTransform: 'uppercase', letterSpacing: '.5px' }}>{s.l}</div>
            </div>
          ))}
        </div>
        {/* Boutons */}
        <div style={{ padding: '14px 16px', display: 'flex', gap: 8 }}>
          <button onClick={() => { navigate(`/profil/${user.id}`); onClose() }}
            style={{ flex: 2, padding: '10px', background: 'var(--g)', color: '#fff', border: 'none', borderRadius: 8, fontFamily: 'var(--fh)', fontSize: 14, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.5px', cursor: 'pointer' }}>
            Voir le profil
          </button>
          <button onClick={onClose}
            style={{ flex: 1, padding: '9px', background: 'transparent', color: 'var(--text2)', border: '1px solid var(--border2)', borderRadius: 8, fontFamily: 'var(--fh)', fontSize: 13, fontWeight: 600, textTransform: 'uppercase', cursor: 'pointer' }}>
            Fermer
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Home() {
  const navigate = useNavigate()
  const { favs, toggleFav, user, setShowAuth } = useApp()
  const [annonces, setAnnonces] = useState([])
  const [stats, setStats] = useState({ ann: 0, mem: 0 })
  const [catCounts, setCatCounts] = useState({})
  const [loading, setLoading] = useState(true)
  const [popupUser, setPopupUser] = useState(null)

  useEffect(() => { load() }, [])

  const load = async () => {
    const [{ data: ann }, { count: ac }, { count: mc }, venteRes] = await Promise.all([
      supabase.from('annonces').select('*, profiles(username, note_moyenne)').order('created_at', { ascending: false }).limit(8),
      supabase.from('annonces').select('*', { count: 'exact', head: true }),
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('profiles').select('nb_ventes'),
    ])
    const totalVentes = venteRes.data?.reduce((s, p) => s + (p.nb_ventes || 0), 0) || 0
    setAnnonces(ann || [])
    setStats({ ann: ac || 0, mem: mc || 0, ventes: totalVentes })
    const cats = ['AEG', 'GBB', 'Sniper', 'Équipement', 'Accessoire', 'Pièces']
    const counts = {}
    await Promise.all(cats.map(async c => {
      const { count } = await supabase.from('annonces').select('*', { count: 'exact', head: true }).eq('categorie', c)
      counts[c] = count || 0
    }))
    setCatCounts(counts)
    setLoading(false)
  }

  return (
    <div>
      {/* HERO — Ghillie sniper plein fond + overlay kaki */}
      <div style={{ position: 'relative', height: 480, overflow: 'hidden', display: 'flex', alignItems: 'center' }}>
        {/* Image ghillie sniper */}
        <div style={{ position: 'absolute', inset: 0 }}>
          <img src="https://images.unsplash.com/photo-1585503418537-88331351ad99?w=1600&q=80" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', filter: 'brightness(.25) saturate(.4) sepia(.15)' }} />
        </div>
        {/* Overlay dégradé latéral */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, var(--bg) 35%, rgba(10,11,9,.6) 60%, rgba(10,11,9,.2) 100%)' }}></div>
        {/* Teinte kaki */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(107,140,58,.12) 0%, transparent 50%)' }}></div>
        {/* Grille subtile */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(107,140,58,.04) 1px, transparent 1px), linear-gradient(90deg, rgba(107,140,58,.04) 1px, transparent 1px)', backgroundSize: '40px 40px', pointerEvents: 'none' }}></div>
        {/* Ligne kaki en bas */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent, var(--g), transparent)' }}></div>
        {/* Contenu */}
        <div style={{ position: 'relative', zIndex: 2, padding: '0 60px', maxWidth: 580 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 11, fontWeight: 600, letterSpacing: '2px', color: 'var(--g)', textTransform: 'uppercase', marginBottom: 14 }}>
            <span style={{ width: 16, height: 2, background: 'var(--g)', display: 'inline-block' }}></span>
            Marketplace française #1
            <span style={{ width: 40, height: 1, background: 'linear-gradient(90deg, var(--g), transparent)', display: 'inline-block' }}></span>
          </div>
          <h1 style={{ fontFamily: 'var(--fh)', fontSize: 62, fontWeight: 800, lineHeight: .9, letterSpacing: '-1px', textTransform: 'uppercase', marginBottom: 14 }}>
            La marketplace<br /><span style={{ color: 'var(--g)' }}>Airsoft</span><br />française
          </h1>
          <p style={{ fontSize: 15, color: 'var(--text2)', marginBottom: 26, lineHeight: 1.65, maxWidth: 420 }}>Achetez, vendez et échangez vos répliques entre passionnés en toute confiance.</p>
          <div style={{ display: 'flex', gap: 12 }}>
            <button className="btn btn-acc" onClick={() => navigate('/annonces')}>Voir les annonces →</button>
            <button className="btn btn-out" onClick={() => user ? navigate('/publier') : setShowAuth(true)}>Publier une annonce</button>
          </div>
        </div>
      </div>

      {/* STATS */}
      <div className="stats-bar">
        {[
          { val: <CountUp to={stats.mem} />, lab: 'Membres' },
          { val: <CountUp to={stats.ann} />, lab: 'Annonces en ligne' },
          { val: <CountUp to={0} />, lab: 'Ventes réussies' },
          { val: <>100<span className="acc">%</span></>, lab: 'Gratuit' },
        ].map((s, i) => (
          <div key={i} className="stat">
            <div className="stat-val">{s.val}</div>
            <div className="stat-lab">{s.lab}</div>
          </div>
        ))}
      </div>

      {/* CATS */}
      <div className="section" style={{ paddingBottom: 16 }}>
        <div className="sec-head">
          <div className="sec-title">Catégories populaires</div>
          <div className="sec-more" onClick={() => navigate('/annonces')}>Voir tout <i className="ti ti-chevron-right"></i></div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 10 }}>
          {CATS.map(cat => (
            <div key={cat.slug}
              onClick={() => navigate(`/annonces?cat=${cat.slug}`)}
              style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', cursor: 'pointer', transition: 'all .2s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--g)'; e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,.4)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none' }}>
              <div style={{ height: 90, background: 'var(--bg3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 42, position: 'relative' }}>
                {cat.emoji}
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, var(--g), transparent)' }}></div>
              </div>
              <div style={{ padding: '10px 8px' }}>
                <div style={{ fontFamily: 'var(--fh)', fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.5px', color: 'var(--text2)', textAlign: 'center' }}>{cat.name}</div>
                <div style={{ fontSize: 10, color: 'var(--text3)', textAlign: 'center', marginTop: 2 }}>{catCounts[cat.slug] || 0} annonces</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ANNONCES */}
      <div style={{ background: 'var(--bg2)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div className="section" style={{ paddingBottom: 4 }}>
          <div className="sec-head">
            <div className="sec-title">Annonces récentes</div>
            <div className="sec-more" onClick={() => navigate('/annonces')}>Voir tout <i className="ti ti-chevron-right"></i></div>
          </div>
        </div>
        <div style={{ padding: '0 20px 24px' }}>
          {loading ? <div className="loader"><div className="spin"></div></div>
            : annonces.length === 0
              ? <div className="empty"><i className="ti ti-mood-empty"></i><p>Aucune annonce — soyez le premier !</p><button className="btn btn-acc" style={{ marginTop: 16 }} onClick={() => user ? navigate('/publier') : setShowAuth(true)}>Publier</button></div>
              : <div className="ann-grid">{annonces.map(a => <AnnCard key={a.id} a={a} navigate={navigate} favs={favs} toggleFav={toggleFav} />)}</div>
          }
        </div>
      </div>

      {/* POPUP PROFIL */}
      {popupUser && <ProfilPopup user={popupUser} onClose={() => setPopupUser(null)} navigate={navigate} />}

      {/* ACTIVITE + WHY */}
      <div className="section">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
          <div>
            <div className="sec-title" style={{ marginBottom: 16 }}>Activité récente</div>
            <div>
              {ACTIVITY.map((a, i) => (
                <div key={i} className="act-item">
                  <div className="act-av" style={{ cursor: 'pointer' }}
                    onClick={() => setPopupUser({ username: a.user, nb_ventes: 5, nb_annonces: 12, note_moyenne: 4.8, nb_avis: 23, anciennete: '1 an' })}>
                    {a.user.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="act-text">
                    <strong style={{ cursor: 'pointer', color: 'var(--g)' }}
                      onClick={() => setPopupUser({ username: a.user, nb_ventes: 5, nb_annonces: 12, note_moyenne: 4.8, nb_avis: 23, anciennete: '1 an' })}>
                      {a.user}
                    </strong> {a.action}
                  </div>
                  {a.live && <div className="act-live"></div>}
                  <div className="act-time">{a.time}</div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="sec-title" style={{ marginBottom: 16 }}>Pourquoi AirsoftSwap ?</div>
            <div className="why-grid">
              <div className="why-card"><div className="why-ico">🎯</div><div className="why-title">100% Airsoft</div><div className="why-desc">Par des passionnés, pour des passionnés.</div></div>
              <div className="why-card"><div className="why-ico">🤝</div><div className="why-title">Entre particuliers</div><div className="why-desc">Vendez directement sans intermédiaire.</div></div>
              <div className="why-card"><div className="why-ico">🔒</div><div className="why-title">Comptes vérifiés</div><div className="why-desc">Email confirmé avant de publier.</div></div>
              <div className="why-card"><div className="why-ico">⚡</div><div className="why-title">Rapide & gratuit</div><div className="why-desc">Une annonce en 2 minutes. Zéro frais.</div></div>
            </div>
            <div className="trust-box">
              {[
                ['Email vérifié', 'obligatoire pour publier'],
                ['Avis authentiques', 'après échange prouvé uniquement'],
                ['Signalement', 'en 1 clic — traité sous 24h'],
                ['RGPD', 'données protégées'],
              ].map(([t, s], i) => (
                <div key={i} className="trust-item">
                  <div className="trust-chk">✓</div>
                  <div className="trust-text"><strong>{t}</strong> {s}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
