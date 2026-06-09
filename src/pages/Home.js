import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useApp } from '../App'

const ETAT = { 'Neuf': 'b-neuf', 'Très bon état': 'b-tbe', 'Bon état': 'b-be', 'État correct': 'b-ec' }
const EMOJI = { AEG: '🔫', GBB: '🔫', Sniper: '🎯', Équipement: '🦺', Accessoire: '🔭', Pièces: '⚙️' }
const CAT_BADGE = {
  Tout: '/cat/tout.jpg',
  AEG: '/cat/aeg.jpg',
  GBB: '/cat/gbb.jpg',
  Sniper: '/cat/sniper.jpg',
  'Équipement': '/cat/equipement.jpg',
  Accessoire: '/cat/accessoire.jpg',
  'Pièces': '/cat/pieces.jpg',
}
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
function timeAgo(d) {
  if (!d) return ''
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000)
  if (s < 60) return "à l'instant"
  const m = Math.floor(s / 60); if (m < 60) return `${m} min`
  const h = Math.floor(m / 60); if (h < 24) return `${h} h`
  const j = Math.floor(h / 24); return `${j} j`
}

function CountUp({ to }) {
  const [v, setV] = useState(0)
  useEffect(() => {
    const target = Number(to) || 0
    if (target <= 0) { setV(0); return }
    let cur = 0
    const step = Math.max(1, Math.ceil(target / 40))
    const iv = setInterval(() => { cur = Math.min(cur + step, target); setV(cur); if (cur >= target) clearInterval(iv) }, 45)
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
        {a.sold_at && <span style={{ position: 'absolute', top: 8, left: 8, background: 'var(--red)', color: '#fff', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 800, fontSize: 11, letterSpacing: 1, padding: '3px 9px', borderRadius: 5, textTransform: 'uppercase', zIndex: 2, boxShadow: '0 2px 6px rgba(0,0,0,.4)' }}>Vendu</span>}
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
          <div className="as"><div className="av" style={{ overflow: 'hidden' }}>{a.profiles?.avatar_url ? <img src={a.profiles.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials}</div>{a.profiles?.username || 'Anonyme'}</div>
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
        <div style={{ padding: '22px 20px 18px' }}>
          <div style={{ display: 'flex', gap: 13, alignItems: 'center', marginBottom: 14 }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--gs)', border: '2px solid var(--g)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 19, fontWeight: 800, color: 'var(--g)', fontFamily: 'var(--fh)', flexShrink: 0, overflow: 'hidden' }}>
              {user.avatar_url
                ? <img src={user.avatar_url} alt={user.username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : (user.username?.slice(0, 2).toUpperCase() || '??')}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: 'var(--fh)', fontSize: 19, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '-.3px', color: 'var(--text)' }}>{user.username}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>
                <i className="ti ti-calendar" style={{ fontSize: 12 }}></i>
                Membre depuis {user.since ? new Date(user.since).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }) : '—'}
              </div>
            </div>
          </div>
          <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 9, padding: '10px', textAlign: 'center', marginBottom: 10 }}>
            {user.note_moyenne > 0 ? (
              <>
                <div style={{ color: 'var(--amber)', fontSize: 16, letterSpacing: 1 }}>{'★'.repeat(Math.round(user.note_moyenne))}{'☆'.repeat(5 - Math.round(user.note_moyenne))}</div>
                <div style={{ fontSize: 13, marginTop: 2 }}><b>{Number(user.note_moyenne).toFixed(1)}</b></div>
              </>
            ) : <div style={{ color: 'var(--text3)', fontSize: 13 }}>Nouveau vendeur</div>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px', marginBottom: 14 }}>
            <i className="ti ti-shield-check" style={{ fontSize: 22, color: '#A3E635', flexShrink: 0 }}></i>
            <div>
              <div style={{ fontFamily: 'var(--fh)', fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.5px', color: '#A3E635' }}>Vendeur confirmé</div>
              <div style={{ fontSize: 11, color: 'var(--text3)' }}>{user.nb_ventes || 0} vente{(user.nb_ventes || 0) > 1 ? 's' : ''} réalisée{(user.nb_ventes || 0) > 1 ? 's' : ''}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => { if (user.id) { navigate(`/profil/${user.id}`); onClose() } }}
              style={{ flex: 2, padding: '11px', background: 'var(--g)', color: '#fff', border: 'none', borderRadius: 8, fontFamily: 'var(--fh)', fontSize: 14, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.5px', cursor: 'pointer' }}>
              Voir le profil
            </button>
            <button onClick={onClose}
              style={{ flex: 1, padding: '10px', background: 'transparent', color: 'var(--text2)', border: '1px solid var(--border2)', borderRadius: 8, fontFamily: 'var(--fh)', fontSize: 13, fontWeight: 600, textTransform: 'uppercase', cursor: 'pointer' }}>
              Fermer
          </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Home() {
  const navigate = useNavigate()
  const { favs, toggleFav, user, setShowAuth } = useApp()
  const [annonces, setAnnonces] = useState([])
  const [stats, setStats] = useState({ ann: 0, mem: 0, ventes: 0 })
  const [catCounts, setCatCounts] = useState({})
  const [loading, setLoading] = useState(true)
  const [popupUser, setPopupUser] = useState(null)
  const [soldAnn, setSoldAnn] = useState([])

  useEffect(() => { load() }, [])

  const mapAct = (a, sale) => ({
    user: a.profiles?.username || 'Anonyme',
    action: sale ? `a vendu « ${a.titre} »` : `a publié « ${a.titre} »`,
    sale: !!sale,
    ts: sale ? a.sold_at : a.created_at,
    time: timeAgo(sale ? a.sold_at : a.created_at),
    avatar: a.profiles?.avatar_url,
    note: a.profiles?.note_moyenne || 0,
    uid: a.profiles?.id,
    nb_ventes: a.profiles?.nb_ventes || 0,
    since: a.profiles?.created_at,
    annonceId: a.id,
  })
  const activity = [
    ...annonces.map(a => mapAct(a, false)),
    ...soldAnn.map(a => mapAct(a, true)),
  ].sort((x, y) => new Date(y.ts) - new Date(x.ts)).slice(0, 6)

  const openUser = (a) => setPopupUser({
    id: a.uid,
    username: a.user,
    avatar_url: a.avatar,
    note_moyenne: a.note,
    nb_ventes: a.nb_ventes,
    nb_annonces: '—',
    nb_avis: 0,
    since: a.since,
  })

  const load = async () => {
    const [{ data: ann }, { count: ac }, { count: mc }, venteRes, { data: sold }] = await Promise.all([
      supabase.from('annonces').select('*, profiles(id, username, note_moyenne, avatar_url, nb_ventes, created_at)').eq('supprimee', false).order('created_at', { ascending: false }).limit(8),
      supabase.from('annonces').select('*', { count: 'exact', head: true }).eq('supprimee', false),
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('profiles').select('nb_ventes'),
      supabase.from('annonces').select('*, profiles(id, username, note_moyenne, avatar_url, nb_ventes, created_at)').eq('supprimee', false).not('sold_at', 'is', null).order('sold_at', { ascending: false }).limit(6),
    ])
    const totalVentes = venteRes.data?.reduce((s, p) => s + (p.nb_ventes || 0), 0) || 0
    setAnnonces(ann || [])
    setSoldAnn(sold || [])
    setStats({ ann: ac || 0, mem: mc || 0, ventes: totalVentes })
    const cats = ['AEG', 'GBB', 'Sniper', 'Équipement', 'Accessoire', 'Pièces']
    const counts = {}
    await Promise.all(cats.map(async c => {
      const { count } = await supabase.from('annonces').select('*', { count: 'exact', head: true }).eq('categorie', c).eq('supprimee', false)
      counts[c] = count || 0
    }))
    setCatCounts(counts)
    setLoading(false)
  }

  return (
    <div>
      {/* HERO — Ghillie sniper plein fond + overlay kaki */}
      <div className="hero-wrap">
        {/* Image ghillie sniper */}
        <div style={{ position: 'absolute', inset: 0 }}>
          <img src="/hero.jpg" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', filter: 'brightness(.6) saturate(.95)' }} />
        </div>
        {/* Overlay dégradé latéral */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(10,11,9,.85) 0%, rgba(10,11,9,.55) 42%, rgba(10,11,9,.15) 72%, rgba(10,11,9,0) 100%)' }}></div>
        {/* Teinte kaki */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(107,140,58,.12) 0%, transparent 50%)' }}></div>
        {/* Grille subtile */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(107,140,58,.04) 1px, transparent 1px), linear-gradient(90deg, rgba(107,140,58,.04) 1px, transparent 1px)', backgroundSize: '40px 40px', pointerEvents: 'none' }}></div>
        {/* Ligne kaki en bas */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent, var(--g), transparent)' }}></div>
        {/* Contenu */}
        <div className="hero-inner">
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 11, fontWeight: 600, letterSpacing: '2px', color: 'var(--g)', textTransform: 'uppercase', marginBottom: 14 }}>
            <span style={{ width: 16, height: 2, background: 'var(--g)', display: 'inline-block' }}></span>
            Marketplace française #1
            <span style={{ width: 40, height: 1, background: 'linear-gradient(90deg, var(--g), transparent)', display: 'inline-block' }}></span>
          </div>
          <h1 className="hero-h1">
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
      <div className="stats-wrap">
        <div className="stats-bar">
          {[
            { val: <CountUp to={stats.mem} />, lab: 'Membres', sub: 'Rejoignez notre communauté', ic: 'ti-users', bg: '/stats/membres.jpg', pos: 'center 35%' },
            { val: <CountUp to={stats.ann} />, lab: 'Annonces en ligne', sub: 'Trouvez votre bonheur', ic: 'ti-tag', bg: '/stats/annonces.jpg', pos: 'center 42%' },
            { val: <CountUp to={stats.ventes} />, lab: 'Ventes réussies', sub: 'Transactions sécurisées', ic: 'ti-circle-check', bg: '/stats/ventes.jpg', pos: 'center 22%' },
            { val: <>100<span className="acc">%</span></>, lab: 'Gratuit', sub: 'Aucun frais caché', ic: 'ti-gift', bg: '/stats/gratuit.jpg', pos: 'center 40%' },
          ].map((s, i) => (
            <div key={i} className="stat">
              <img className="stat-bg" src={s.bg} alt="" style={{ objectPosition: s.pos }} />
              <div className="stat-overlay"></div>
              <div className="stat-content">
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div className="stat-ico"><i className={`ti ${s.ic}`} style={{ fontSize: 22, color: '#A3E635' }}></i></div>
                  <div className="stat-val">{s.val}</div>
                </div>
                <div className="stat-lab">{s.lab}</div>
                <div className="stat-sub">{s.sub}</div>
                <div className="stat-line"></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CATS */}
      <div className="section" style={{ paddingBottom: 16 }}>
        <div className="sec-head">
          <div className="sec-title">Catégories populaires</div>
          <div className="sec-more" onClick={() => navigate('/annonces')}>Voir tout <i className="ti ti-chevron-right"></i></div>
        </div>
        <div className="cats-grid">
          {CATS.map(cat => (
            <div key={cat.slug}
              onClick={() => navigate(`/annonces?cat=${cat.slug}`)}
              style={{ cursor: 'pointer', transition: 'transform .2s, filter .2s', textAlign: 'center' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.filter = 'brightness(1.12)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.filter = 'none' }}>
              <div className="cat-badge">
                <img src={CAT_BADGE[cat.slug]} alt={cat.name} style={{ width: '100%', height: 'auto', display: 'block' }} />
              </div>
              <div style={{ textAlign: 'center', marginTop: 6 }}>
                <span style={{ display: 'inline-block', fontSize: 10, color: 'var(--text2)', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 20, padding: '3px 12px' }}>{catCounts[cat.slug] || 0} annonce{(catCounts[cat.slug] || 0) > 1 ? 's' : ''}</span>
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

      {/* ACTIVITE */}
      <div className="section">
        <div className="sec-title" style={{ marginBottom: 16 }}>Activité récente</div>
        <div>
          {activity.length === 0 && (
            <div style={{ fontSize: 13, color: 'var(--text3)', padding: '8px 0' }}>Aucune activité récente pour le moment.</div>
          )}
          {activity.map((a, i) => (
            <div key={i} className="act-item">
              <div className="act-av" style={{ cursor: 'pointer', overflow: 'hidden' }}
                onClick={() => openUser(a)}>
                {a.avatar ? <img src={a.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : a.user.slice(0, 2).toUpperCase()}
              </div>
              <div className="act-text">
                <i className={`ti ${a.sale ? 'ti-circle-check' : 'ti-tag'}`} style={{ color: a.sale ? '#A3E635' : 'var(--text3)', marginRight: 6 }}></i>
                <strong style={{ cursor: 'pointer', color: 'var(--g)' }}
                  onClick={() => openUser(a)}>
                  {a.user}
                </strong> {a.action}
              </div>
              {i === 0 && <div className="act-live"></div>}
              <div className="act-time">{a.time}</div>
            </div>
          ))}
        </div>
      </div>

      {/* POURQUOI — Modèle A */}
      <div className="section">
        <div className="sec-title" style={{ marginBottom: 16 }}>Pourquoi AirsoftSwap ?</div>
        <div className="why-grid">
          {[
            { ic: 'ti-target', t: '100% Airsoft', d: 'Par des passionnés, pour des passionnés.' },
            { ic: 'ti-users', t: 'Entre particuliers', d: 'Vendez directement sans intermédiaire.' },
            { ic: 'ti-shield-check', t: 'Comptes vérifiés', d: 'Email confirmé avant de publier.' },
            { ic: 'ti-bolt', t: 'Rapide & gratuit', d: 'Une annonce en 2 minutes. Zéro frais.' },
          ].map((w, i) => (
            <div key={i} className="why-card">
              <div className="why-ico"><i className={`ti ${w.ic}`} style={{ fontSize: 23, color: '#A3E635' }}></i></div>
              <div className="why-title">{w.t}</div>
              <div className="why-desc">{w.d}</div>
            </div>
          ))}
        </div>
        <div className="trust-box">
          {[
            ['Email vérifié', 'obligatoire pour publier'],
            ['Avis authentiques', 'après transaction confirmée'],
            ['Signalement', 'en 1 clic — traité sous 24h'],
            ['RGPD', 'données protégées'],
          ].map(([t, s], i) => (
            <div key={i} className="trust-item">
              <div className="trust-ico"><i className="ti ti-check"></i></div>
              <div className="trust-txt"><strong>{t}</strong> {s}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
