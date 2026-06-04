import React, { useState, useEffect, createContext, useContext, useCallback } from 'react'
import { createPortal } from 'react-dom'
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
  const [info, setInfo] = useState('')
  const { showToast } = useApp()

  const go = t => { setTab(t); setErr(''); setInfo('') }

  const submit = async e => {
    e.preventDefault(); setLoading(true); setErr(''); setInfo('')
    if (tab === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email: f.email, password: f.password })
      if (error) setErr('Email ou mot de passe incorrect.')
      else { showToast('ok', 'Connecté !'); onClose() }
    } else if (tab === 'reset') {
      if (!f.email.trim()) { setErr('Entrez votre email.'); setLoading(false); return }
      const { error } = await supabase.auth.resetPasswordForEmail(f.email.trim(), { redirectTo: window.location.origin })
      if (error) setErr(error.message)
      else setInfo("Si un compte existe pour cet email, un lien de réinitialisation vient d'être envoyé. Pensez à vérifier vos spams.")
    } else {
      const uname = f.username.trim()
      if (!uname || uname.length < 3) { setErr('Pseudo requis (min 3 caractères).'); setLoading(false); return }
      if (f.password.length < 6) { setErr('Mot de passe trop court (min 6 caractères).'); setLoading(false); return }
      // Vérifie que le pseudo n'est pas déjà pris (insensible à la casse)
      const { data: taken } = await supabase.from('profiles').select('id').ilike('username', uname).maybeSingle()
      if (taken) { setErr('Ce pseudo est déjà pris, choisis-en un autre.'); setLoading(false); return }
      const { data, error } = await supabase.auth.signUp({ email: f.email, password: f.password, options: { data: { username: uname } } })
      if (error) {
        if (/duplicate|unique|already/i.test(error.message)) setErr('Ce pseudo est déjà pris, choisis-en un autre.')
        else setErr(error.message)
        setLoading(false); return
      }
      if (data.user) {
        await supabase.from('profiles').upsert({ id: data.user.id, username: uname, nb_ventes: 0, nb_achats: 0, note_moyenne: 0 })
        showToast('ok', 'Compte créé ! Vérifiez votre email.')
        onClose()
      }
    }
    setLoading(false)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.82)', zIndex: 300, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '6vh 20px 48px', overflowY: 'auto' }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <button className="modal-close" onClick={onClose}><i className="ti ti-x"></i></button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
          <Logo size={26} />
          <span style={{ fontFamily: 'var(--fh)', fontSize: 18, fontWeight: 700 }}>Airsoft<span style={{ color: 'var(--g)' }}>Swap</span></span>
        </div>
        {tab === 'reset' ? (
          <div style={{ fontFamily: 'var(--fh)', fontSize: 16, fontWeight: 700, textAlign: 'center', marginBottom: 6 }}>Mot de passe oublié</div>
        ) : (
          <div className="auth-tabs">
            <button className={`auth-tab ${tab === 'login' ? 'on' : ''}`} onClick={() => go('login')}>Connexion</button>
            <button className={`auth-tab ${tab === 'register' ? 'on' : ''}`} onClick={() => go('register')}>Inscription</button>
          </div>
        )}
        {err && <div className="alert alert-err"><i className="ti ti-alert-circle"></i>{err}</div>}
        {info && <div className="alert" style={{ background: 'rgba(107,140,58,.15)', border: '1px solid var(--g)', color: 'var(--g)' }}><i className="ti ti-mail-check"></i>{info}</div>}
        <form onSubmit={submit}>
          {tab === 'register' && (
            <div className="form-group"><label>Pseudo</label><input type="text" placeholder="MonPseudo" value={f.username} onChange={e => setF({ ...f, username: e.target.value })} required /></div>
          )}
          <div className="form-group"><label>Email</label><input type="email" placeholder="email@exemple.com" value={f.email} onChange={e => setF({ ...f, email: e.target.value })} required /></div>
          {tab !== 'reset' && (
            <div className="form-group"><label>Mot de passe</label><input type="password" placeholder="••••••••" value={f.password} onChange={e => setF({ ...f, password: e.target.value })} required /></div>
          )}
          {tab === 'reset' && (
            <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 12 }}>Entrez l'email de votre compte : vous recevrez un lien pour définir un nouveau mot de passe.</div>
          )}
          {tab === 'register' && (
            <div className="alert alert-warn"><i className="ti ti-shield"></i>En créant un compte vous acceptez nos <Link to="/legal/cgu" onClick={onClose} style={{ color: 'var(--amber)', textDecoration: 'underline' }}>CGU</Link>.</div>
          )}
          <button type="submit" className="btn btn-acc btn-block" disabled={loading}>
            {loading ? 'Chargement...' : tab === 'login' ? 'Se connecter' : tab === 'reset' ? 'Envoyer le lien' : 'Créer mon compte'}
          </button>
        </form>
        {tab === 'login' && (
          <div onClick={() => go('reset')} style={{ textAlign: 'center', marginTop: 14, fontSize: 13, color: 'var(--text3)', cursor: 'pointer' }}>
            Mot de passe oublié ?
          </div>
        )}
        {tab === 'reset' && (
          <div onClick={() => go('login')} style={{ textAlign: 'center', marginTop: 14, fontSize: 13, color: 'var(--g)', cursor: 'pointer' }}>
            ← Retour à la connexion
          </div>
        )}
      </div>
    </div>
  )
}

function ResetPasswordModal({ onDone }) {
  const [pw, setPw] = useState('')
  const [pw2, setPw2] = useState('')
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  const { showToast } = useApp()

  const submit = async e => {
    e.preventDefault(); setErr('')
    if (pw.length < 6) { setErr('Mot de passe trop court (min 6 caractères).'); return }
    if (pw !== pw2) { setErr('Les deux mots de passe ne correspondent pas.'); return }
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password: pw })
    setLoading(false)
    if (error) { setErr(error.message); return }
    showToast('ok', 'Mot de passe mis à jour !')
    onDone()
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.82)', zIndex: 320, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '6vh 20px 48px', overflowY: 'auto' }}>
      <div className="modal">
        <button className="modal-close" onClick={onDone}><i className="ti ti-x"></i></button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
          <Logo size={26} />
          <span style={{ fontFamily: 'var(--fh)', fontSize: 18, fontWeight: 700 }}>Nouveau mot de passe</span>
        </div>
        {err && <div className="alert alert-err"><i className="ti ti-alert-circle"></i>{err}</div>}
        <form onSubmit={submit}>
          <div className="form-group"><label>Nouveau mot de passe</label><input type="password" placeholder="••••••••" value={pw} onChange={e => setPw(e.target.value)} required /></div>
          <div className="form-group"><label>Confirmer le mot de passe</label><input type="password" placeholder="••••••••" value={pw2} onChange={e => setPw2(e.target.value)} required /></div>
          <button type="submit" className="btn btn-acc btn-block" disabled={loading}>{loading ? 'Chargement...' : 'Mettre à jour'}</button>
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
      {open && createPortal(
        <div onClick={() => setOpen(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 2147483647, background: 'rgba(0,0,0,.85)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', overflowY: 'auto', padding: '7vh 16px 48px' }}>
          <div onClick={e => e.stopPropagation()}
            style={{ background: '#121512', border: '1px solid #2a3320', borderRadius: 14, padding: 26, width: '100%', maxWidth: 410, position: 'relative', boxShadow: '0 20px 60px rgba(0,0,0,.6)' }}>
            <button onClick={() => setOpen(false)}
              style={{ position: 'absolute', top: 12, right: 12, width: 30, height: 30, borderRadius: 8, background: 'rgba(255,255,255,.06)', border: '1px solid #2a3320', color: '#B8C0AC', fontSize: 16, cursor: 'pointer', lineHeight: 1 }}>✕</button>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>☕</div>
              <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 22, fontWeight: 700, color: '#EAF0E0', textTransform: 'uppercase' }}>Soutenir AirsoftSwap</div>
              <div style={{ fontSize: 13, color: '#8A9580', marginTop: 4 }}>Aidez-nous à garder le site gratuit pour toute la communauté airsoft française !</div>
            </div>
            <a href="https://ko-fi.com/airsoftswap" target="_blank" rel="noopener noreferrer"
              style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 16, background: '#191C18', border: '1px solid #2a3320', borderRadius: 10, textDecoration: 'none', marginBottom: 10 }}>
              <span style={{ fontSize: 28, flexShrink: 0 }}>💳</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 15, fontWeight: 700, color: '#EAF0E0', textTransform: 'uppercase', marginBottom: 2 }}>Ko-fi — Carte / PayPal</div>
                <div style={{ fontSize: 12, color: '#8A9580' }}>Paiement rapide sans créer de compte</div>
              </div>
              <span style={{ color: '#8A9580', fontSize: 18, flexShrink: 0 }}>→</span>
            </a>
            <div style={{ padding: 16, background: '#191C18', border: '1px solid #2a3320', borderRadius: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
                <span style={{ fontSize: 28 }}>₿</span>
                <div>
                  <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 15, fontWeight: 700, color: '#EAF0E0', textTransform: 'uppercase' }}>Bitcoin</div>
                  <div style={{ fontSize: 12, color: '#8A9580', marginTop: 2 }}>Don anonyme en crypto</div>
                </div>
              </div>
              <div style={{ background: '#0F1010', border: '1px solid #2a3320', borderRadius: 7, padding: '9px 12px', fontSize: 11, color: '#B8C0AC', wordBreak: 'break-all', fontFamily: 'monospace', marginBottom: 10 }}>
                {BTC}
              </div>
              <button onClick={copyBTC}
                style={{ width: '100%', padding: '9px', background: copied ? '#7FA040' : 'transparent', border: `1px solid ${copied ? '#7FA040' : '#3a4630'}`, borderRadius: 7, fontSize: 13, fontWeight: 600, color: copied ? '#fff' : '#B8C0AC', cursor: 'pointer' }}>
                {copied ? '✓ Adresse copiée !' : "📋 Copier l'adresse"}
              </button>
            </div>
            <div style={{ textAlign: 'center', fontSize: 12, color: '#8A9580', marginTop: 14 }}>
              Merci pour votre soutien ! 🎯
            </div>
          </div>
        </div>,
        document.body
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
  const [signalCount, setSignalCount] = useState(0)
  const [isDark, setIsDark] = useState(true)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'dark')
  }, [])

  useEffect(() => {
    if (user) supabase.from('messages').select('id', { count: 'exact', head: true }).eq('receiver_id', user.id).eq('lu', false).then(({ count }) => setUnread(count || 0))
    if (user && (user.id === 'e21bb865-90d4-4995-88f5-1b6bf1a324a1' || user.email === 'gamerscss@yahoo.fr'))
      supabase.from('signalements').select('id', { count: 'exact', head: true }).neq('status', 'traité').then(({ count }) => setSignalCount(count || 0))
    else setSignalCount(0)
  }, [user, location])

  useEffect(() => {
    const refresh = () => {
      if (user) supabase.from('messages').select('id', { count: 'exact', head: true }).eq('receiver_id', user.id).eq('lu', false).then(({ count }) => setUnread(count || 0))
    }
    window.addEventListener('as-refresh-unread', refresh)
    return () => window.removeEventListener('as-refresh-unread', refresh)
  }, [user])

  const toggleTheme = () => {
    const next = !isDark
    setIsDark(next)
    document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light')
  }

  const go = e => { e.preventDefault(); if (search.trim()) navigate(`/annonces?q=${encodeURIComponent(search.trim())}`) }
  const on = path => location.pathname === path || location.pathname.startsWith(path + '/')

  return (
    <>
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
        {user && (user.id === 'e21bb865-90d4-4995-88f5-1b6bf1a324a1' || user.email === 'gamerscss@yahoo.fr') &&
          <button className={`nav-link ${on('/admin') ? 'on' : ''}`} style={{ color: 'var(--amber)' }} onClick={() => navigate('/admin')}>🛡 Admin{signalCount > 0 && <span style={{ background: 'var(--red)', color: '#fff', fontSize: 10, fontWeight: 700, borderRadius: 10, padding: '1px 5px', marginLeft: 4 }}>{signalCount}</span>}</button>}
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
    <div className="mobile-nav">
      <div className={`mn ${on('/') && location.pathname === '/' ? 'on' : ''}`} onClick={() => navigate('/')}>
        <i className="ti ti-home mn-ico"></i>Accueil
      </div>
      <div className={`mn ${on('/annonces') ? 'on' : ''}`} onClick={() => navigate('/annonces')}>
        <i className="ti ti-layout-grid mn-ico"></i>Annonces
      </div>
      <div className="mn-pub-btn" onClick={() => user ? navigate('/publier') : onAuth()}>
        <i className="ti ti-plus"></i>
      </div>
      <div className={`mn ${on('/messagerie') ? 'on' : ''}`} onClick={() => user ? navigate('/messagerie') : onAuth()} style={{ position: 'relative' }}>
        <i className="ti ti-message mn-ico"></i>Messages
        {user && unread > 0 && <span style={{ position: 'absolute', top: -2, right: '50%', marginRight: -22, background: 'var(--red)', color: '#fff', fontSize: 9, fontWeight: 700, borderRadius: 10, padding: '0 4px', minWidth: 14, textAlign: 'center' }}>{unread}</span>}
      </div>
      {user
        ? <div className={`mn ${on('/profil') ? 'on' : ''}`} onClick={() => navigate(`/profil/${user.id}`)}>
            <i className="ti ti-user mn-ico"></i>Profil
          </div>
        : <div className="mn" onClick={onAuth}>
            <i className="ti ti-login mn-ico"></i>Connexion
          </div>
      }
      {user && (user.id === 'e21bb865-90d4-4995-88f5-1b6bf1a324a1' || user.email === 'gamerscss@yahoo.fr') &&
        <div className={`mn ${on('/admin') ? 'on' : ''}`} onClick={() => navigate('/admin')} style={{ color: 'var(--amber)', position: 'relative' }}>
          <i className="ti ti-shield mn-ico"></i>Admin
          {signalCount > 0 && <span style={{ position: 'absolute', top: -2, right: '50%', marginRight: -20, background: 'var(--red)', color: '#fff', fontSize: 9, fontWeight: 700, borderRadius: 10, padding: '0 4px', minWidth: 14, textAlign: 'center' }}>{signalCount}</span>}
        </div>
      }
    </div>
    </>
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
  const [recovery, setRecovery] = useState(false)
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
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') setRecovery(true)
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
        {recovery && <ResetPasswordModal onDone={() => setRecovery(false)} />}
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
