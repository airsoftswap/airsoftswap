import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useApp } from '../App'

const ADMIN_ID = 'e21bb865-90d4-4995-88f5-1b6bf1a324a1'

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

  useEffect(() => {
    if (!user) { navigate('/'); return }
    if (user.id !== ADMIN_ID) { navigate('/'); return }
    load()
  }, [user])

  const load = async () => {
    setLoading(true)
    const [{ data: ann }, { data: usr }, { count: ac }, { count: uc }] = await Promise.all([
      supabase.from('annonces').select('*, profiles(username, email)').order('created_at', { ascending: false }),
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('annonces').select('*', { count: 'exact', head: true }),
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
    ])
    setAnnonces(ann || [])
    setUsers(usr || [])
    setStats({ ann: ac || 0, users: uc || 0 })
    setLoading(false)
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

  const deleteUser = async (id) => {
    if (!window.confirm('Supprimer cet utilisateur et toutes ses annonces ?')) return
    await supabase.from('annonces').delete().eq('user_id', id)
    await supabase.from('profiles').delete().eq('id', id)
    setUsers(prev => prev.filter(u => u.id !== id))
  }

  if (!user || user.id !== ADMIN_ID) return null

  const filteredAnn = annonces.filter(a =>
    a.titre?.toLowerCase().includes(search.toLowerCase()) ||
    a.profiles?.username?.toLowerCase().includes(search.toLowerCase()) ||
    a.ville?.toLowerCase().includes(search.toLowerCase())
  )

  const filteredUsers = users.filter(u =>
    u.username?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Header */}
      <div style={{ background: 'var(--bg2)', borderBottom: '1px solid var(--border)', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 14, position: 'sticky', top: 58, zIndex: 100 }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--g)', boxShadow: '0 0 8px var(--g)' }}></div>
        <div style={{ fontFamily: 'var(--fh)', fontSize: 18, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.5px', color: 'var(--text)' }}>
          Panel Admin
        </div>
        <div style={{ fontSize: 11, color: 'var(--text3)', marginLeft: 4 }}>AirsoftSwap</div>

        {/* Stats rapides */}
        <div style={{ display: 'flex', gap: 16, marginLeft: 'auto' }}>
          {[
            { l: 'Annonces', v: stats.ann || 0 },
            { l: 'Membres', v: stats.users || 0 },
          ].map((s, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--fh)', fontSize: 20, fontWeight: 800, color: 'var(--g)' }}>{s.v}</div>
              <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.5px' }}>{s.l}</div>
            </div>
          ))}
        </div>

        <button onClick={load} style={{ padding: '7px 14px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 7, fontSize: 12, color: 'var(--text2)', cursor: 'pointer', fontFamily: 'var(--fh)', textTransform: 'uppercase', letterSpacing: '.5px' }}>
          🔄 Actualiser
        </button>
      </div>

      <div style={{ padding: '24px' }}>
        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {[
            { id: 'annonces', label: `📋 Annonces (${annonces.length})` },
            { id: 'membres', label: `👥 Membres (${users.length})` },
          ].map(t => (
            <button key={t.id} onClick={() => { setTab(t.id); setSearch('') }}
              style={{ padding: '9px 18px', background: tab === t.id ? 'var(--g)' : 'var(--bg2)', color: tab === t.id ? '#fff' : 'var(--text2)', border: `1px solid ${tab === t.id ? 'var(--g)' : 'var(--border)'}`, borderRadius: 8, fontFamily: 'var(--fh)', fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.5px', cursor: 'pointer', transition: 'all .2s' }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div style={{ position: 'relative', marginBottom: 16 }}>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder={tab === 'annonces' ? 'Rechercher par titre, vendeur, ville...' : 'Rechercher par pseudo...'}
            style={{ width: '100%', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px 10px 36px', fontSize: 14, color: 'var(--text)', outline: 'none' }} />
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)' }}>🔍</span>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text3)' }}>Chargement...</div>
        ) : (

          /* ANNONCES */
          tab === 'annonces' ? (
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
          ) : (

            /* MEMBRES */
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
                  {u.id === ADMIN_ID && (
                    <span style={{ background: 'var(--gs)', border: '1px solid var(--gg)', color: 'var(--g)', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4, fontFamily: 'var(--fh)', textTransform: 'uppercase' }}>ADMIN</span>
                  )}
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                    <button onClick={() => navigate(`/profil/${u.id}`)}
                      style={{ padding: '7px 12px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 6, fontSize: 12, color: 'var(--text2)', cursor: 'pointer' }}>
                      👁 Profil
                    </button>
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
        )}
      </div>
    </div>
  )
}
