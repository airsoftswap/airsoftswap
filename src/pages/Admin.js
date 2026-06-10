import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useApp } from '../App'

const ADMIN_ID = 'e21bb865-90d4-4995-88f5-1b6bf1a324a1'
const ADMIN_EMAIL = 'gamerscss@yahoo.fr'
const isSuperAdminUser = u => !!u && (u.id === ADMIN_ID || u.email === ADMIN_EMAIL)

export default function Admin() {
  const navigate = useNavigate()
  const { user } = useApp()
  const [tab, setTab] = useState('annonces')
  const [annonces, setAnnonces] = useState([])
  const [users, setUsers] = useState([])
  const [signalements, setSignalements] = useState([])
  const [stats, setStats] = useState({})
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  // myRole : null = pas encore vérifié, 'super' = toi, 'moderator' = modo, 'denied' = accès refusé
  const [myRole, setMyRole] = useState(null)

  const isSuperAdmin = myRole === 'super'
  const isModerator = myRole === 'moderator'

  useEffect(() => {
    if (!user) { navigate('/'); return }
    checkAccess()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const checkAccess = async () => {
    // Super-admin (toi) : accès direct, pas besoin de la base
    if (isSuperAdminUser(user)) {
      setMyRole('super')
      load(true)
      return
    }
    // Sinon : on regarde le rôle en base
    const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (data?.role === 'moderator') {
      setMyRole('moderator')
      load(false)
    } else {
      navigate('/')
    }
  }

  // superAdmin : on récupère aussi la liste des membres (toi seul en a besoin)
  const load = async (superAdmin) => {
    setLoading(true)
    const [{ data: ann }, { count: ac }, { data: sig }] = await Promise.all([
      supabase.from('annonces').select('*, profiles(username)').order('created_at', { ascending: false }),
      supabase.from('annonces').select('*', { count: 'exact', head: true }),
      supabase.from('signalements').select('*').order('created_at', { ascending: false }),
    ])
    setAnnonces(ann || [])

    let sigList = sig || []
    const repIds = [...new Set(sigList.map(s => s.reporter_id).filter(Boolean))]
    if (repIds.length) {
      const { data: reps } = await supabase.from('profiles').select('id,username').in('id', repIds)
      const map = Object.fromEntries((reps || []).map(r => [r.id, r.username]))
      sigList = sigList.map(s => ({ ...s, reporter_name: map[s.reporter_id] }))
    }
    setSignalements(sigList)

    let uc = 0
    if (superAdmin) {
      const [{ data: usr }, { count: uCount }] = await Promise.all([
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
      ])
      setUsers(usr || [])
      uc = uCount || 0
    }

    setStats({ ann: ac || 0, users: uc })
    setLoading(false)
  }

  const reload = () => load(isSuperAdmin)

  const resolveSignal = async (id) => {
    await supabase.from('signalements').update({ status: 'traité' }).eq('id', id)
    setSignalements(prev => prev.map(s => s.id === id ? { ...s, status: 'traité' } : s))
  }
  const deleteSignal = async (id) => {
    await supabase.from('signalements').delete().eq('id', id)
    setSignalements(prev => prev.filter(s => s.id !== id))
  }

  const deleteAnn = async (id, images) => {
    if (!window.confirm('Supprimer cette annonce ?')) return
    if (images?.length > 0) {
      const paths = images.map(url => url.split('/annonces-photos/')[1]).filter(Boolean)
      if (paths.length > 0) await supabase.storage.from('annonces-photos').remove(paths)
    }
    await supabase.from('annonces').delete().eq('id', id)
    setAnnonces(prev => prev.filter(a => a.id !== id))
  }

  // --- Super-admin uniquement ---
  const deleteUser = async (id) => {
    if (!isSuperAdmin) return
    if (!window.confirm('Supprimer cet utilisateur et toutes ses annonces ?')) return
    await supabase.from('annonces').delete().eq('user_id', id)
    await supabase.from('profiles').delete().eq('id', id)
    setUsers(prev => prev.filter(u => u.id !== id))
  }

  const toggleModerator = async (u) => {
    if (!isSuperAdmin) return
    const makeMod = u.role !== 'moderator'
    if (!window.confirm(
      makeMod
        ? `Promouvoir « ${u.username} » modérateur ?\n\nIl pourra supprimer des annonces et gérer les signalements.`
        : `Retirer le rôle modérateur à « ${u.username} » ?`
    )) return
    const { error } = await supabase.rpc('set_moderator', { target_id: u.id, make_mod: makeMod })
    if (error) { alert('Erreur : ' + error.message); return }
    setUsers(prev => prev.map(x => x.id === u.id ? { ...x, role: makeMod ? 'moderator' : 'user' } : x))
  }

  const toggleUnlimited = async (u) => {
    if (!isSuperAdmin) return
    const makeUnl = !u.unlimited
    if (!window.confirm(
      makeUnl
        ? `Donner les annonces ILLIMITÉES à « ${u.username} » ?\n\nIl ne sera plus limité à 3 annonces par semaine.`
        : `Retirer les annonces illimitées à « ${u.username} » ? Il repassera au quota de 3/semaine.`
    )) return
    const { error } = await supabase.rpc('set_unlimited', { target_id: u.id, make_unl: makeUnl })
    if (error) { alert('Erreur : ' + error.message); return }
    setUsers(prev => prev.map(x => x.id === u.id ? { ...x, unlimited: makeUnl } : x))
  }

  // Tant que le rôle n'est pas confirmé, on n'affiche rien
  if (!isSuperAdmin && !isModerator) return null

  const filteredAnn = annonces.filter(a =>
    a.titre?.toLowerCase().includes(search.toLowerCase()) ||
    a.profiles?.username?.toLowerCase().includes(search.toLowerCase()) ||
    a.ville?.toLowerCase().includes(search.toLowerCase())
  )

  const filteredUsers = users.filter(u =>
    u.username?.toLowerCase().includes(search.toLowerCase())
  )

  // Onglets : les modos ne voient pas "Membres"
  const tabs = [
    { id: 'annonces', label: `📋 Annonces (${annonces.length})` },
    ...(isSuperAdmin ? [{ id: 'membres', label: `👥 Membres (${users.length})` }] : []),
    { id: 'signalements', label: `🚩 Signalements (${signalements.filter(s => s.status !== 'traité').length})` },
  ]

  // Sécurité d'affichage : un modo ne peut pas se retrouver sur l'onglet membres
  const activeTab = (tab === 'membres' && !isSuperAdmin) ? 'annonces' : tab

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Header */}
      <div style={{ background: 'var(--bg2)', borderBottom: '1px solid var(--border)', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 14, position: 'sticky', top: 58, zIndex: 100 }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--g)', boxShadow: '0 0 8px var(--g)' }}></div>
        <div style={{ fontFamily: 'var(--fh)', fontSize: 18, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.5px', color: 'var(--text)' }}>
          Panel Admin
        </div>
        <div style={{ fontSize: 11, color: 'var(--text3)', marginLeft: 4 }}>AirsoftSwap</div>

        {/* Badge rôle */}
        <span style={{ background: isModerator ? 'rgba(134,173,74,.12)' : 'var(--gs)', border: '1px solid var(--gg)', color: 'var(--g)', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4, fontFamily: 'var(--fh)', textTransform: 'uppercase', letterSpacing: '.5px' }}>
          {isSuperAdmin ? '🛡 Super-admin' : '🛡 Modérateur'}
        </span>

        {/* Stats rapides */}
        <div style={{ display: 'flex', gap: 16, marginLeft: 'auto' }}>
          {[
            { l: 'Annonces', v: stats.ann || 0 },
            ...(isSuperAdmin ? [{ l: 'Membres', v: stats.users || 0 }] : []),
          ].map((s, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--fh)', fontSize: 20, fontWeight: 800, color: 'var(--g)' }}>{s.v}</div>
              <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.5px' }}>{s.l}</div>
            </div>
          ))}
        </div>

        <button onClick={reload} style={{ padding: '7px 14px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 7, fontSize: 12, color: 'var(--text2)', cursor: 'pointer', fontFamily: 'var(--fh)', textTransform: 'uppercase', letterSpacing: '.5px' }}>
          🔄 Actualiser
        </button>
      </div>

      <div style={{ padding: '24px' }}>
        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => { setTab(t.id); setSearch('') }}
              style={{ padding: '9px 18px', background: activeTab === t.id ? 'var(--g)' : 'var(--bg2)', color: activeTab === t.id ? '#fff' : 'var(--text2)', border: `1px solid ${activeTab === t.id ? 'var(--g)' : 'var(--border)'}`, borderRadius: 8, fontFamily: 'var(--fh)', fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.5px', cursor: 'pointer', transition: 'all .2s' }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div style={{ position: 'relative', marginBottom: 16 }}>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder={activeTab === 'annonces' ? 'Rechercher par titre, vendeur, ville...' : 'Rechercher par pseudo...'}
            style={{ width: '100%', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px 10px 36px', fontSize: 14, color: 'var(--text)', outline: 'none' }} />
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)' }}>🔍</span>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text3)' }}>Chargement...</div>
        ) : (

          /* ANNONCES */
          activeTab === 'annonces' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {filteredAnn.length === 0 && <div style={{ textAlign: 'center', padding: 40, color: 'var(--text3)' }}>Aucune annonce trouvée</div>}
              {filteredAnn.map(a => (
                <div key={a.id} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 16 }}>
                  {/* Photo ou emoji */}
                  <div style={{ width: 52, height: 52, borderRadius: 8, background: 'var(--bg3)', border: '1px solid var(--border)', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
                    {a.images?.[0] ? <img src={a.images[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '🔫'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: 'var(--fh)', fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.titre}</div>
                    <div style={{ fontSize: 12, color: 'var(--text3)', display: 'flex', gap: 12 }}>
                      <span>👤 {a.profiles?.username || 'Inconnu'}</span>
                      <span>📍 {a.ville || '—'}</span>
                      <span>🏷️ {a.categorie}</span>
                      <span>📅 {new Date(a.created_at).toLocaleDateString('fr-FR')}</span>
                    </div>
                  </div>
                  <div style={{ fontFamily: 'var(--fh)', fontSize: 18, fontWeight: 800, color: 'var(--g)', flexShrink: 0 }}>{Number(a.prix).toFixed(0)} €</div>
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                    <button onClick={() => navigate(`/annonces/${a.id}`)}
                      style={{ padding: '7px 12px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 6, fontSize: 12, color: 'var(--text2)', cursor: 'pointer' }}>
                      👁 Voir
                    </button>
                    <button onClick={() => deleteAnn(a.id, a.images)}
                      style={{ padding: '7px 12px', background: 'rgba(217,64,64,.1)', border: '1px solid rgba(217,64,64,.2)', borderRadius: 6, fontSize: 12, color: 'var(--red)', cursor: 'pointer' }}>
                      🗑 Supprimer
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : activeTab === 'signalements' ? (

            /* SIGNALEMENTS */
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {signalements.length === 0 && <div style={{ textAlign: 'center', padding: 40, color: 'var(--text3)' }}>Aucun signalement 🎉</div>}
              {signalements.map(s => (
                <div key={s.id} style={{ background: 'var(--bg2)', border: `1px solid ${s.status === 'traité' ? 'var(--border)' : 'rgba(217,64,64,.3)'}`, borderRadius: 10, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 16, opacity: s.status === 'traité' ? .55 : 1 }}>
                  <div style={{ fontSize: 22, flexShrink: 0 }}>🚩</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: 'var(--fh)', fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 3 }}>{s.raison}</div>
                    <div style={{ fontSize: 12, color: 'var(--text3)', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                      <span>📋 {s.annonce_titre || '(annonce supprimée)'}</span>
                      <span>👤 {s.reporter_name || 'Anonyme'}</span>
                      <span>📅 {new Date(s.created_at).toLocaleDateString('fr-FR')}</span>
                      {s.status === 'traité' && <span style={{ color: 'var(--g)' }}>✓ Traité</span>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                    {s.annonce_id && <button onClick={() => navigate(`/annonces/${s.annonce_id}`)}
                      style={{ padding: '7px 12px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 6, fontSize: 12, color: 'var(--text2)', cursor: 'pointer' }}>👁 Voir</button>}
                    {s.status !== 'traité' && <button onClick={() => resolveSignal(s.id)}
                      style={{ padding: '7px 12px', background: 'var(--gs)', border: '1px solid var(--gg)', borderRadius: 6, fontSize: 12, color: 'var(--g)', cursor: 'pointer' }}>✓ Traité</button>}
                    <button onClick={() => deleteSignal(s.id)}
                      style={{ padding: '7px 12px', background: 'rgba(217,64,64,.1)', border: '1px solid rgba(217,64,64,.2)', borderRadius: 6, fontSize: 12, color: 'var(--red)', cursor: 'pointer' }}>🗑</button>
                  </div>
                </div>
              ))}
            </div>
          ) : (

            /* MEMBRES — super-admin uniquement */
            isSuperAdmin && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {filteredUsers.length === 0 && <div style={{ textAlign: 'center', padding: 40, color: 'var(--text3)' }}>Aucun membre trouvé</div>}
              {filteredUsers.map(u => (
                <div key={u.id} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 9, background: 'var(--gs)', border: '1px solid var(--gg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, color: 'var(--g)', fontFamily: 'var(--fh)', flexShrink: 0 }}>
                    {u.username?.slice(0, 2).toUpperCase() || '??'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: 'var(--fh)', fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 3 }}>{u.username || 'Sans pseudo'}</div>
                    <div style={{ fontSize: 12, color: 'var(--text3)', display: 'flex', gap: 12 }}>
                      <span>📅 {new Date(u.created_at).toLocaleDateString('fr-FR')}</span>
                      <span>📦 {u.nb_ventes || 0} ventes</span>
                      {u.note_moyenne > 0 && <span>⭐ {Number(u.note_moyenne).toFixed(1)}</span>}
                    </div>
                  </div>

                  {/* Badge ADMIN / MODO */}
                  {u.id === ADMIN_ID ? (
                    <span style={{ background: 'var(--gs)', border: '1px solid var(--gg)', color: 'var(--g)', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4, fontFamily: 'var(--fh)', textTransform: 'uppercase' }}>ADMIN</span>
                  ) : u.role === 'moderator' ? (
                    <span style={{ background: 'rgba(134,173,74,.12)', border: '1px solid var(--gg)', color: 'var(--g)', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4, fontFamily: 'var(--fh)', textTransform: 'uppercase' }}>MODO</span>
                  ) : null}

                  {/* Badge ILLIMITÉ */}
                  {u.id !== ADMIN_ID && u.unlimited && (
                    <span style={{ background: 'rgba(200,150,42,.12)', border: '1px solid rgba(200,150,42,.4)', color: 'var(--amber)', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4, fontFamily: 'var(--fh)', textTransform: 'uppercase' }}>∞ Illimité</span>
                  )}

                  <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                    <button onClick={() => navigate(`/profil/${u.id}`)}
                      style={{ padding: '7px 12px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 6, fontSize: 12, color: 'var(--text2)', cursor: 'pointer' }}>
                      👁 Profil
                    </button>

                    {/* Bouton ON/OFF modérateur — toi seul, et pas sur ton propre compte */}
                    {u.id !== ADMIN_ID && (
                      <button onClick={() => toggleModerator(u)}
                        title={u.role === 'moderator' ? 'Retirer le rôle modérateur' : 'Promouvoir modérateur'}
                        style={{
                          padding: '7px 12px',
                          background: u.role === 'moderator' ? 'var(--g)' : 'var(--bg3)',
                          border: `1px solid ${u.role === 'moderator' ? 'var(--g)' : 'var(--border)'}`,
                          borderRadius: 6, fontSize: 12,
                          color: u.role === 'moderator' ? '#fff' : 'var(--text2)',
                          cursor: 'pointer', fontFamily: 'var(--fh)', fontWeight: 700,
                          textTransform: 'uppercase', letterSpacing: '.5px'
                        }}>
                        {u.role === 'moderator' ? '🛡 Modo ON' : '🛡 Modo OFF'}
                      </button>
                    )}

                    {/* Bouton ON/OFF quota illimité — toi seul */}
                    {u.id !== ADMIN_ID && (
                      <button onClick={() => toggleUnlimited(u)}
                        title={u.unlimited ? 'Repasser au quota de 3/semaine' : 'Donner les annonces illimitées'}
                        style={{
                          padding: '7px 12px',
                          background: u.unlimited ? 'var(--amber)' : 'var(--bg3)',
                          border: `1px solid ${u.unlimited ? 'var(--amber)' : 'var(--border)'}`,
                          borderRadius: 6, fontSize: 12,
                          color: u.unlimited ? '#1a1a1a' : 'var(--text2)',
                          cursor: 'pointer', fontFamily: 'var(--fh)', fontWeight: 700,
                          textTransform: 'uppercase', letterSpacing: '.5px'
                        }}>
                        {u.unlimited ? '∞ Quota ON' : '∞ Quota OFF'}
                      </button>
                    )}

                    {u.id !== ADMIN_ID && (
                      <button onClick={() => deleteUser(u.id)}
                        style={{ padding: '7px 12px', background: 'rgba(217,64,64,.1)', border: '1px solid rgba(217,64,64,.2)', borderRadius: 6, fontSize: 12, color: 'var(--red)', cursor: 'pointer' }}>
                        🚫 Supprimer
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            )
          )
        )}
      </div>
    </div>
  )
}
