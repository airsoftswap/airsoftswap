import React, { useState, useEffect, createContext, useContext, useCallback } from 'react'
import { BrowserRouter, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom'
import { supabase } from './lib/supabase'
import Home from './pages/Home'
import Annonces from './pages/Annonces'
import AnnonceDetail from './pages/AnnonceDetail'
import Publier from './pages/Publier'
import Profil from './pages/Profil'
import Messagerie from './pages/Messagerie'
import PageLegale from './pages/PageLegale'
import Admin from './pages/Admin'

export const AppCtx = createContext(null)
export const useApp = () => useContext(AppCtx)

const Logo = ({ size = 28 }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    <path d="M6 16 A10 10 0 0 1 16 6" stroke="#6B8C3A" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
    <polygon points="11,3 17,5 12,9" fill="#6B8C3A"/>
    <path d="M26 16 A10 10 0 0 1 16 26" stroke="#6B8C3A" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
    <polygon points="21,29 15,27 20,23" fill="#6B8C3A"/>
    <ellipse cx="16" cy="16" rx="4" ry="5.5" fill="#6B8C3A" opacity=".9"/>
    <ellipse cx="16" cy="13" rx="2.5" ry="2" fill="#7FA040"/>
  </svg>
)

function Toast({ t }) {
  if (!t) return null
  return <div className={`toast toast-${t.type}`}><i className={`ti ti-${t.type === 'ok' ? 'check' : t.type === 'err' ? 'x' : 'info-circle'}`}></i>{t.msg}</div>
}

function AuthModal({ onClose }) {
  const [tab, setTab] = useState('login')
  const [f, setF] = useState({ email: '', password: '', username: '' })
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  const { showToast } = useApp()

  const submit = async e => {
    e.preventDefault(); setLoading(true); setErr('')
    if (tab === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email: f.email, password: f.password })
      if (error) setErr('Email ou mot de passe incorrect.')
      else { showToast('ok', 'Connecté !'); onClose() }
    } else {
      if (!f.username.trim() || f.username.length < 3) { setErr('Pseudo requis (min 3 caractères).'); setLoading(false); return }
      if (f.password.length < 6) { setErr('Mot de passe trop court (min 6 caractères).'); setLoading(false); return }
      const { data, error } = await supabase.auth.signUp({ email: f.email, password: f.password })
      if (error) { setErr(error.message); setLoading(false); return }
      if (data.user) {
        await supabase.from('profiles').upsert({ id: data.user.id, username: f.username.trim(), nb_ventes: 0, nb_achats: 0, note_moyenne: 0 })
        showToast('ok', 'Compte créé ! Vérifiez votre email.')
        onClose()
      }
    }
    setLoading(false)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, backdropFilter: 'blur(5px)' }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <button className="modal-close" onClick={onClose}><i className="ti ti-x"></i></button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
          <Logo size={26} />
          <span style={{ fontFamily: 'var(--fh)', fontSize: 18, fontWeight: 700 }}>Airsoft<span style={{ color: 'var(--g)' }}>Swap</span></span>
        </div>
        <div className="auth-tabs">
          <button className={`auth-tab ${tab === 'login' ? 'on' : ''}`} onClick={() => setTab('login')}>Connexion</button>
          <button className={`auth-tab ${tab === 'register' ? 'on' : ''}`} onClick={() => setTab('register')}>Inscription</button>
        </div>
        {err && <div className="alert alert-err"><i className="ti ti-alert-circle"></i>{err}</div>}
        <form onSubmit={submit}>
          {tab === 'register' && (
            <div className="form-group"><label>Pseudo</label><input type="text" placeholder="MonPseudo" value={f.username} onChange={e => setF({ ...f, username: e.target.value })} required /></div>
          )}
          <div className="form-group"><label>Email</label><input type="email" placeholder="email@exemple.com" value={f.email} onChange={e => setF({ ...f, email: e.target.value })} required /></div>
          <div className="form-group"><label>Mot de passe</label><input type="password" placeholder="••••••••" value={f.password} onChange={e => setF({ ...f, password: e.target.value })} required /></div>
          {tab === 'register' && (
            <div className="alert alert-warn"><i className="ti ti-shield"></i>En créant un compte vous acceptez nos <Link to="/legal/cgu" onClick={onClose} style={{ color: 'var(--amber)', textDecoration: 'underline' }}>CGU</Link>.</div>
          )}
          <button type="submit" className="btn btn-acc btn-block" disabled={loading}>
            {loading ? 'Chargement...' : tab === 'login' ? 'Se connecter' : 'Créer mon compte'}
          </button>
        </form>
      </div>
    </div>
  )
}

function DonModal() {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const BTC = 'bc1q90vsfzn6zrtm9hqqhhaafw28v4hnqwq47wuet8'

  const copyBTC = () => {
    navigator.clipboard.writeText(BTC)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <>
      <button onClick={() => setOpen(true)}
        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: 'rgba(255,94,94,.1)', border: '1px solid rgba(255,94,94,.25)', borderRadius: 8, fontSize: 12, fontWeight: 700, color: '#FF5E5E', fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: '.5px', textTransform: 'uppercase', transition: 'all .2s', whiteSpace: 'nowrap', cursor: 'pointer' }}>
        Soutenir
      </button>
      {open && (
        <div className="overlay show" onClick={() => setOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 420, marginTop: 80 }}>
            <button className="modal-close" onClick={() => setOpen(false)}>✕</button>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>☕</div>
              <div className="modal-title" style={{ textAlign: 'center' }}>Soutenir AirsoftSwap</div>
              <div className="modal-sub" style={{ textAlign: 'center' }}>Aidez-nous à garder le site gratuit pour toute la communauté airsoft française !</div>
            </div>
            {/* Ko-fi */}
            <a href="https://ko-fi.com/airsoftswap" target="_blank" rel="noopener noreferrer"
              style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 16, background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 10, textDecoration: 'none', marginBottom: 10, transition: 'border-color .2s' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--g)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
              <span style={{ fontSize: 28, flexShrink: 0 }}>💳</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'var(--fh)', fontSize: 15, fontWeight: 700, color: 'var(--text)', textTransform: 'uppercase', marginBottom: 2 }}>Ko-fi — Carte / PayPal</div>
                <div style={{ fontSize: 12, color: 'var(--text3)' }}>Paiement rapide sans créer de compte</div>
              </div>
              <span style={{ color: 'var(--text3)', fontSize: 18, flexShrink: 0 }}>→</span>
            </a>
            {/* Bitcoin */}
            <div style={{ padding: 16, background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
                <span style={{ fontSize: 28 }}>₿</span>
                <div>
                  <div style={{ fontFamily: 'var(--fh)', fontSize: 15, fontWeight: 700, color: 'var(--text)', textTransform: 'uppercase' }}>Bitcoin</div>
                  <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>Don anonyme en crypto</div>
                </div>
              </div>
              <div style={{ background: 'var(--bg4)', border: '1px solid var(--border)', borderRadius: 7, padding: '9px 12px', fontSize: 11, color: 'var(--text2)', wordBreak: 'break-all', fontFamily: 'monospace', marginBottom: 10 }}>
                {BTC}
              </div>
              <button onClick={copyBTC}
                style={{ width: '100%', padding: '9px', background: copied ? 'var(--g)' : 'transparent', border: `1px solid ${copied ? 'var(--g)' : 'var(--border2)'}`, borderRadius: 7, fontSize: 13, fontWeight: 600, color: copied ? '#fff' : 'var(--text2)', cursor: 'pointer', transition: 'all .2s', fontFamily: 'var(--fb)' }}>
                {copied ? '✓ Adresse copiée !' : '📋 Copier l\'adresse'}
              </button>
            </div>
            <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--text3)', marginTop: 14 }}>
              Merci pour votre soutien ! 🎯
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function Navbar({ onAuth }) {
  const { user } = useApp()
  const location = useLocation()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [unread, setUnread] = useState(0)
  const [isDark, setIsDark] = useState(true)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'dark')
  }, [])

  useEffect(() => {
    if (user) supabase.from('messages').select('id', { count: 'exact', head: true }).eq('receiver_id', user.id).eq('lu', false).then(({ count }) => setUnread(count || 0))
  }, [user, location])

  const toggleTheme = () => {
    const next = !isDark
    setIsDark(next)
    document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light')
  }

  const go = e => { e.preventDefault(); if (search.trim()) navigate(`/annonces?q=${encodeURIComponent(search.trim())}`) }
  const on = path => location.pathname === path || location.pathname.startsWith(path + '/')

  return (
    <nav className="nav">
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Logo />
        <span className="nav-logo">Airsoft<span>Swap</span></span>
      </Link>
      <div className="nav-search">
        <form onSubmit={go}>
          <i className="ti ti-search"></i>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher une réplique, marque, ville..." />
        </form>
      </div>
      <div className="nav-links">
        <button className={`nav-link ${on('/annonces') ? 'on' : ''}`} onClick={() => navigate('/annonces')}>Annonces</button>
        {user && (
          <button className={`nav-link ${on('/messagerie') ? 'on' : ''}`} onClick={() => navigate('/messagerie')}>
            Messages {unread > 0 && <span style={{ background: 'var(--red)', color: '#fff', fontSize: 10, fontWeight: 700, borderRadius: 10, padding: '1px 5px', marginLeft: 4 }}>{unread}</span>}
          </button>
        )}
        {user && <button className={`nav-link ${on('/profil') ? 'on' : ''}`} onClick={() => navigate(`/profil/${user.id}`)}>Mon profil</button>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
        <DonModal />
        <button className="btn-theme" onClick={toggleTheme} title="Changer le thème">
          {isDark ? '🌙' : '☀️'}
        </button>
        {user
          ? <button className="btn-primary" onClick={() => navigate('/publier')}>+ Publier</button>
          : <><button className="btn-ghost" onClick={onAuth}>Connexion</button><button className="btn-primary" style={{ marginLeft: 8 }} onClick={onAuth}>Publier</button></>
        }
      </div>
    </nav>
  )
}

function Footer() {
  const navigate = useNavigate()
  return (
    <footer>
      <div className="footer-grid">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--fh)', fontSize: 17, fontWeight: 700, marginBottom: 4 }}>
            <Logo />Airsoft<span style={{ color: 'var(--g)' }}>Swap</span>
          </div>
          <p>La marketplace communautaire dédiée à l'airsoft en France. Achetez, vendez et échangez en toute confiance.</p>
        </div>
        <div className="footer-col">
          <h4>Navigation</h4>
          <a onClick={() => navigate('/annonces')}>Annonces</a>
          <a onClick={() => navigate('/annonces?cat=AEG')}>AEG</a>
          <a onClick={() => navigate('/annonces?cat=GBB')}>GBB / GAZ</a>
        </div>
        <div className="footer-col">
          <h4>Aide</h4>
          <a onClick={() => navigate('/legal/comment-ca-marche')}>Comment ça marche ?</a>
          <a onClick={() => navigate('/legal/securite')}>Sécurité</a>
          <a onClick={() => navigate('/legal/regles')}>Règles</a>
          <a onClick={() => navigate('/legal/contact')}>Contact</a>
        </div>
        <div className="footer-col">
          <h4>Légal</h4>
          <a onClick={() => navigate('/legal/cgu')}>CGU</a>
          <a onClick={() => navigate('/legal/mentions-legales')}>Mentions légales</a>
          <a onClick={() => navigate('/legal/confidentialite')}>Confidentialité</a>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© 2026 AirsoftSwap — Tous droits réservés.</span>
        <span>Fait avec 🎯 en France</span>
      </div>
    </footer>
  )
}

export default function App() {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [authReady, setAuthReady] = useState(false)
  const [showAuth, setShowAuth] = useState(false)
  const [toast, setToast] = useState(null)
  const [favs, setFavs] = useState(() => { try { return JSON.parse(localStorage.getItem('as_favs') || '[]') } catch { return [] } })

  const showToast = useCallback((type, msg) => {
    setToast({ type, msg })
    setTimeout(() => setToast(null), 3000)
  }, [])

  const toggleFav = useCallback(id => {
    setFavs(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
      localStorage.setItem('as_favs', JSON.stringify(next))
      return next
    })
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) loadProfile(session.user.id)
      setAuthReady(true)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null)
      if (session?.user) loadProfile(session.user.id)
      else setProfile(null)
    })
    return () => subscription.unsubscribe()
  }, [])

  const loadProfile = async id => {
    const { data } = await supabase.from('profiles').select('*').eq('id', id).single()
    if (data) setProfile(data)
  }

  const logout = async () => {
    await supabase.auth.signOut()
    setUser(null); setProfile(null)
    showToast('info', 'Déconnecté.')
  }

  if (!authReady) {
    return <div className="loader"><div className="spin"></div></div>
  }

  return (
    <AppCtx.Provider value={{ user, profile, logout, showToast, favs, toggleFav, setShowAuth, loadProfile }}>
      <BrowserRouter>
        <Navbar onAuth={() => setShowAuth(true)} />
        {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
        <Toast t={toast} />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/annonces" element={<Annonces />} />
          <Route path="/annonces/:id" element={<AnnonceDetail />} />
          <Route path="/publier" element={<Publier />} />
          <Route path="/profil/:id" element={<Profil />} />
          <Route path="/messagerie" element={<Messagerie />} />
          <Route path="/legal/:slug" element={<PageLegale />} />
                <Route path="/admin" element={<Admin />} />
        </Routes>
        <Footer />
      </BrowserRouter>
    </AppCtx.Provider>
  )
}
