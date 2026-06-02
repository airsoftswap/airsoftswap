import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useApp } from '../App'
const EMOJI={AEG:'🔫',GBB:'🔫',Sniper:'🎯',Équipement:'🦺',Accessoire:'🔭',Pièces:'⚙️'}
export default function Profil() {
  const { id } = useParams(); const navigate = useNavigate()
  const { user, logout, showToast } = useApp()
  const [profile, setProfile] = useState(null); const [annonces, setAnnonces] = useState([])
  const [avis, setAvis] = useState([]); const [tab, setTab] = useState('ann')
  const [loading, setLoading] = useState(true); const [showAvisModal, setShowAvisModal] = useState(false)
  const [avisForm, setAvisForm] = useState({note:5,commentaire:''}); const [canAvis, setCanAvis] = useState(false)
  const isMe = user?.id === id
  useEffect(() => { load() }, [id])
  const load = async () => {
    const [{ data:p },{ data:a },{ data:av }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id',id).single(),
      supabase.from('annonces').select('*').eq('user_id',id).order('created_at',{ascending:false}),
      supabase.from('avis').select('*,auteur:auteur_id(username)').eq('cible_id',id).order('created_at',{ascending:false}),
    ])
    setProfile(p); setAnnonces(a||[]); setAvis(av||[])
    if (user && user.id!==id) { const {count} = await supabase.from('messages').select('*',{count:'exact',head:true}).eq('sender_id',user.id).eq('receiver_id',id); setCanAvis((count||0)>0) }
    setLoading(false)
  }
  const submitAvis = async e => {
    e.preventDefault()
    if (!canAvis) { showToast('err','Échangez d\'abord des messages avec ce vendeur.'); return }
    const { error } = await supabase.from('avis').insert({auteur_id:user.id,cible_id:id,note:avisForm.note,commentaire:avisForm.commentaire})
    if (error) { showToast('err','Erreur ou avis déjà posté.'); return }
    showToast('ok','Avis publié !'); setShowAvisModal(false); load()
  }
  if (loading) return <div className="loader"><div className="spin"></div></div>
  if (!profile) return <div className="empty"><i className="ti ti-ghost"></i><p>Profil introuvable.</p></div>
  const since = new Date(profile.created_at).toLocaleDateString('fr-FR',{year:'numeric',month:'long'})
  const avg = avis.length>0?(avis.reduce((s,a)=>s+a.note,0)/avis.length).toFixed(1):null
  return (
    <div>
      {showAvisModal && (
        <div className="overlay" onClick={()=>setShowAvisModal(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <button className="modal-close" onClick={()=>setShowAvisModal(false)}><i className="ti ti-x"></i></button>
            <div className="modal-title">Laisser un avis</div>
            <div className="modal-sub">Votre avis aide la communauté.</div>
            {!canAvis && <div className="alert alert-warn"><i className="ti ti-alert-circle"></i>Échangez d'abord avec ce vendeur.</div>}
            <form onSubmit={submitAvis}>
              <div className="form-group"><label>Note</label>
                <div style={{display:'flex',gap:8,marginBottom:4}}>
                  {[1,2,3,4,5].map(n=><button key={n} type="button" onClick={()=>setAvisForm({...avisForm,note:n})} style={{fontSize:26,background:'none',border:'none',cursor:'pointer',color:n<=avisForm.note?'var(--amber)':'var(--border2)'}}>★</button>)}
                </div>
              </div>
              <div className="form-group"><label>Commentaire</label><textarea value={avisForm.commentaire} onChange={e=>setAvisForm({...avisForm,commentaire:e.target.value})} placeholder="Décrivez votre expérience..."></textarea></div>
              <button type="submit" className="btn btn-acc btn-block" disabled={!canAvis}>Publier l'avis</button>
            </form>
          </div>
        </div>
      )}
      <div className="profil-head">
        <div style={{display:'flex',alignItems:'flex-start',gap:18,marginBottom:16}}>
          <div className="profil-av">{profile.username?.slice(0,2).toUpperCase()}</div>
          <div style={{flex:1}}>
            <div className="p-name">{profile.username}</div>
            <div style={{fontSize:12,color:'var(--text3)',marginBottom:8}}>Membre depuis {since}</div>
            {avg && <div style={{color:'var(--amber)',fontSize:14,marginBottom:8}}>{'★'.repeat(Math.round(avg))}{'☆'.repeat(5-Math.round(avg))} <span style={{color:'var(--text3)',fontSize:12}}>{avg}/5 — {avis.length} avis</span></div>}
            <div className="p-badges">
              <span className="p-badge p-badge-g"><i className="ti ti-check" style={{fontSize:10}}></i> Vérifié</span>
              {profile.nb_ventes>=10 && <span className="p-badge p-badge-a">⭐ Top vendeur</span>}
              {profile.nb_ventes>=50 && <span className="p-badge p-badge-a">🏆 Élite</span>}
            </div>
          </div>
          <div style={{display:'flex',gap:8}}>
            {!isMe && user && <button className="btn btn-out" style={{fontSize:12,padding:'7px 12px'}} onClick={()=>setShowAvisModal(true)}><i className="ti ti-star"></i>Avis</button>}
            {isMe && <button className="btn btn-out" style={{fontSize:12,padding:'7px 12px'}} onClick={logout}><i className="ti ti-logout"></i>Déconnexion</button>}
          </div>
        </div>
        <div className="p-stats">
          {[{v:annonces.length,l:'Annonces'},{v:profile.nb_ventes||0,l:'Ventes'},{v:avis.length,l:'Avis'},{v:`${profile.taux_expedition||100}%`,l:'Expéd.'}].map((s,i)=>(
            <div key={i} className="p-stat"><div className="p-stat-v">{s.v}</div><div className="p-stat-l">{s.l}</div></div>
          ))}
        </div>
      </div>
      <div className="tabs">
        <button className={`tab ${tab==='ann'?'on':''}`} onClick={()=>setTab('ann')}>Annonces ({annonces.length})</button>
        <button className={`tab ${tab==='avis'?'on':''}`} onClick={()=>setTab('avis')}>Avis ({avis.length})</button>
      </div>
      <div className="section">
        {tab==='ann' && (annonces.length===0
          ? <div className="empty"><i className="ti ti-mood-empty"></i><p>Aucune annonce.</p></div>
          : <div className="ann-grid">{annonces.map(a=>(
              <div key={a.id} className="ann-card" onClick={()=>navigate(`/annonces/${a.id}`)}>
                <div className="ai">{a.images && a.images.length > 0 ? <img src={a.images[0]} alt={a.titre} /> : <span style={{fontSize:46}}>{EMOJI[a.categorie]||'🔫'}</span>}</div>
                <div className="ab"><div className="at">{a.titre}</div><div className="ap">{Number(a.prix).toFixed(2)} €</div><div className="al"><i className="ti ti-map-pin" style={{fontSize:11}}></i>{a.ville}</div></div>
              </div>
            ))}</div>
        )}
        {tab==='avis' && (avis.length===0
          ? <div className="empty"><i className="ti ti-star-off"></i><p>Aucun avis.</p></div>
          : <div>{avis.map(av=>(
              <div key={av.id} className="avis-item">
                <div className="avis-head"><span className="avis-user">{av.auteur?.username||'Anonyme'}</span><span className="avis-stars">{'★'.repeat(av.note)}{'☆'.repeat(5-av.note)}</span></div>
                <p className="avis-text">{av.commentaire}</p>
                <div style={{fontSize:11,color:'var(--text3)',marginTop:5}}>{new Date(av.created_at).toLocaleDateString('fr-FR')}</div>
              </div>
            ))}</div>
        )}
      </div>
    </div>
  )
}
