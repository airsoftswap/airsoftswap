import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useApp } from '../App'
import { DEPARTEMENTS } from '../lib/departements'

const CATS = ['Tout', 'AEG', 'GBB', 'Sniper', 'Équipement', 'Accessoire', 'Pièces']
const ETATS = ['Tout état', 'Neuf', 'Très bon état', 'Bon état', 'État correct']
const EMOJI = { AEG: '🔫', GBB: '🔫', Sniper: '🎯', Équipement: '🦺', Accessoire: '🔭', Pièces: '⚙️' }
const ETAT = { 'Neuf': 'b-neuf', 'Très bon état': 'b-tbe', 'Bon état': 'b-be', 'État correct': 'b-ec' }

export default function Annonces() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { favs, toggleFav } = useApp()
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [cat, setCat] = useState(params.get('cat') || 'Tout')
  const [etat, setEtat] = useState('Tout état')
  const [tri, setTri] = useState('recent')
  const [search, setSearch] = useState(params.get('q') || '')
  const [pmin, setPmin] = useState('')
  const [pmax, setPmax] = useState('')
  const [dep, setDep] = useState(params.get('dep') || '')

  useEffect(() => { load() }, [cat, etat, tri, search, pmin, pmax, dep])

  const load = async () => {
    setLoading(true)
    let q = supabase.from('annonces').select('*, profiles(username, note_moyenne)').eq('supprimee', false)
    if (search.trim()) q = q.or(`titre.ilike.%${search.trim()}%,description.ilike.%${search.trim()}%`)
    if (cat !== 'Tout') q = q.eq('categorie', cat)
    if (etat !== 'Tout état') q = q.eq('etat', etat)
    if (dep) q = q.eq('departement', dep)
    if (pmin) q = q.gte('prix', parseFloat(pmin))
    if (pmax) q = q.lte('prix', parseFloat(pmax))
    q = q.order(tri === 'prix_asc' || tri === 'prix_desc' ? 'prix' : 'created_at', { ascending: tri === 'prix_asc' })
    const { data } = await q.limit(60)
    setList(data || [])
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '80vh' }}>
      <div style={{ background: 'var(--bg2)', borderBottom: '1px solid var(--border)', padding: '20px' }}>
        <h1 style={{ fontFamily: 'var(--fh)', fontSize: 24, fontWeight: 700, marginBottom: 16, letterSpacing: '-.3px' }}>Toutes les annonces</h1>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
          <div style={{ position: 'relative', flex: '1 1 200px' }}>
            <i className="ti ti-search" style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)', fontSize: 16, pointerEvents: 'none' }}></i>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Chercher dans titres et descriptions..."
              style={{ width: '100%', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--r2)', padding: '9px 13px 9px 34px', fontSize: 13, color: 'var(--text)', outline: 'none' }} />
          </div>
          <input value={pmin} onChange={e => setPmin(e.target.value)} placeholder="Min €" type="number" style={{ width: 90, background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--r2)', padding: '9px 12px', fontSize: 13, color: 'var(--text)', outline: 'none' }} />
          <input value={pmax} onChange={e => setPmax(e.target.value)} placeholder="Max €" type="number" style={{ width: 90, background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--r2)', padding: '9px 12px', fontSize: 13, color: 'var(--text)', outline: 'none' }} />
          <select value={etat} onChange={e => setEtat(e.target.value)} style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--r2)', padding: '9px 12px', fontSize: 13, color: 'var(--text)', outline: 'none' }}>
            {ETATS.map(e => <option key={e}>{e}</option>)}
          </select>
          <select value={dep} onChange={e => setDep(e.target.value)} style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--r2)', padding: '9px 12px', fontSize: 13, color: 'var(--text)', outline: 'none', maxWidth: 180 }}>
            <option value="">Tous départements</option>
            {DEPARTEMENTS.map(([code, nom]) => <option key={code} value={code}>{code} — {nom}</option>)}
          </select>
          <select value={tri} onChange={e => setTri(e.target.value)} style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--r2)', padding: '9px 12px', fontSize: 13, color: 'var(--text)', outline: 'none' }}>
            <option value="recent">Plus récentes</option>
            <option value="prix_asc">Prix croissant</option>
            <option value="prix_desc">Prix décroissant</option>
          </select>
        </div>
        <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
          {CATS.map(c => (
            <button key={c} onClick={() => setCat(c)}
              style={{ padding: '5px 14px', borderRadius: 20, border: `1px solid ${cat === c ? 'var(--acc)' : 'var(--border)'}`, background: cat === c ? 'var(--acc-s)' : 'transparent', color: cat === c ? 'var(--acc)' : 'var(--text3)', fontSize: 12, fontWeight: 500, cursor: 'pointer', transition: 'all .15s', fontFamily: 'var(--fb)' }}>
              {c}
            </button>
          ))}
        </div>
      </div>
      <div className="section">
        <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 16 }}>{loading ? 'Chargement...' : `${list.length} annonce${list.length !== 1 ? 's' : ''} trouvée${list.length !== 1 ? 's' : ''}`}</div>
        {loading ? <div className="loader"><div className="spin"></div></div>
          : list.length === 0 ? <div className="empty"><i className="ti ti-search-off"></i><p>Aucune annonce trouvée.</p></div>
          : <div className="ann-grid">
            {list.map(a => (
              <div key={a.id} className="ann-card" onClick={() => navigate(`/annonces/${a.id}`)}>
                <div className="ai">
                  {a.images && a.images.length > 0
                    ? <img src={a.images[0]} alt={a.titre} />
                    : <span style={{ fontSize: 52 }}>{EMOJI[a.categorie] || '🔫'}</span>}
                  {a.sold_at && <span style={{ position: 'absolute', top: 8, left: 8, background: 'var(--red)', color: '#fff', fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 800, fontSize: 11, letterSpacing: 1, padding: '3px 9px', borderRadius: 5, textTransform: 'uppercase', zIndex: 2, boxShadow: '0 2px 6px rgba(0,0,0,.4)' }}>Vendu</span>}
                  <button className={`fav-btn`} onClick={e => { e.stopPropagation(); toggleFav(a.id) }}>
                    <i className={`ti ti-heart`} style={{ fontSize: 13, color: 'var(--text3)' }}></i>
                  </button>
                </div>
                <div className="ab">
                  <div style={{ marginBottom: 6 }}><span className={`badge ${ETAT[a.etat] || 'b-be'}`}>{a.etat}</span></div>
                  <div className="at">{a.titre}</div>
                  <div className="ap">{Number(a.prix).toFixed(2)} €</div>
                  <div className="al"><i className="ti ti-map-pin" style={{ fontSize: 11 }}></i>{a.ville || 'France'}{a.departement ? ` (${a.departement})` : ''}</div>
                  <div className="af">
                    <div className="as"><div className="av">{a.profiles?.username?.slice(0,2).toUpperCase()||'??'}</div>{a.profiles?.username||'Anonyme'}</div>
                    {a.profiles?.note_moyenne > 0 && <div className="ar">★ {Number(a.profiles.note_moyenne).toFixed(1)}</div>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        }
      </div>
    </div>
  )
}
