import React, { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useApp } from '../App'
const EMOJI={AEG:'🔫',GBB:'🔫',Sniper:'🎯',Équipement:'🦺',Accessoire:'🔭',Pièces:'⚙️'}
async function compressAvatar(file){return new Promise(res=>{const img=new Image();const url=URL.createObjectURL(file);img.onload=()=>{const c=document.createElement('canvas');let w=img.width,h=img.height;const m=400;if(w>m){h=Math.round(h*m/w);w=m}c.width=w;c.height=h;c.getContext('2d').drawImage(img,0,0,w,h);c.toBlob(b=>{URL.revokeObjectURL(url);res(b)},'image/jpeg',0.85)};img.src=url})}
export default function Profil() {
  const { id } = useParams(); const navigate = useNavigate()
  const { user, logout, showToast } = useApp()
  const [profile, setProfile] = useState(null); const [annonces, setAnnonces] = useState([])
  const [avis, setAvis] = useState([]); const [tab, setTab] = useState('ann')
  const [loading, setLoading] = useState(true); const [showAvisModal, setShowAvisModal] = useState(false)
  const [avisForm, setAvisForm] = useState({note:5,commentaire:''}); const [canAvis, setCanAvis] = useState(false)
  const [uploadingAv, setUploadingAv] = useState(false)
  const fileAvRef = useRef(null)
  const isMe = user?.id === id
  useEffect(() => { load() }, [id])
  const load = async () => {
    const [{ data:p },{ data:a },{ data:av }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id',id).single(),
      supabase.from('annonces').select('*').eq('user_id',id).order('created_at',{ascending:false}),
      supabase.from('avis').select('*,auteur:auteur_id(username)').eq('cible_id',id).order('created_at',{ascending:false}),
    ])
    setProfile(p); setAnnonces(a||[]); setAvis(av||[])
    if (user && user.id!==id) { const {count} = await supabase.from('transactions').select('*',{count:'exact',head:true}).eq('status','confirmed').or(`and(seller_id.eq.${user.id},buyer_id.eq.${id}),and(seller_id.eq.${id},buyer_id.eq.${user.id})`); setCanAvis((count||0)>0) }
    setLoading(false)
  }
  const submitAvis = async e => {
    e.preventDefault()
    if (!canAvis) { showToast('err','Une transaction confirmée est nécessaire pour laisser un avis.'); return }
    const { error } = await supabase.from('avis').insert({auteur_id:user.id,cible_id:id,note:avisForm.note,commentaire:avisForm.commentaire})
    if (error) { showToast('err','Erreur ou avis déjà posté.'); return }
    showToast('ok','Avis publié !'); setShowAvisModal(false); load()
  }
  const changeAvatar = async e => {
    const file = e.target.files?.[0]; if (!file) return
    setUploadingAv(true)
    try {
      const blob = await compressAvatar(file)
      const path = `${user.id}/avatar_${Date.now()}.jpg`
      const { error } = await supabase.storage.from('annonces-photos').upload(path, blob, { contentType:'image/jpeg', upsert:false })
      if (error) { showToast('err','Erreur upload : '+error.message); setUploadingAv(false); return }
      const { data:{ publicUrl } } = supabase.storage.from('annonces-photos').getPublicUrl(path)
      const { error: e2 } = await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', user.id)
      if (e2) { showToast('err','Erreur profil : '+e2.message); setUploadingAv(false); return }
      setProfile(p => ({ ...p, avatar_url: publicUrl }))
      showToast('ok','Photo de profil mise à jour !')
    } catch (err) { showToast('err','Erreur : '+(err.message||err)) }
    finally { setUploadingAv(false) }
  }
  if (loading) return <div className="loader"><div className="spin"></div></div>
  if (!profile) return <div className="empty"><i className="ti ti-ghost"></i><p>Profil introuvable.</p></div>
  const since = new Date(profile.created_at).toLocaleDateString('fr-FR',{year:'numeric',month:'long'})
  const avg = avis.length>0?(avis.reduce((s,a)=>s+a.note,0)/avis.length).toFixed(1):null
  const days = Math.floor((Date.now()-new Date(profile.created_at).getTime())/86400000)
  const anciennete = days>=365?`${Math.floor(days/365)} an${Math.floor(days/365)>1?'s':''}`:days>=30?`${Math.floor(days/30)} mois`:`${Math.max(days,0)} j`
  return (
    <div>
      {showAvisModal && (
        <div className="overlay" onClick={()=>setShowAvisModal(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <button className="modal-close" onClick={()=>setShowAvisModal(false)}><i className="ti ti-x"></i></button>
            <div className="modal-title">Laisser un avis</div>
            <div className="modal-sub">Votre avis aide la communauté.</div>
            {!canAvis && <div className="alert alert-warn"><i className="ti ti-alert-circle"></i>Une transaction confirmée avec cette personne est nécessaire.</div>}
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
      <input ref={fileAvRef} type="file" accept="image/*" style={{display:'none'}} onChange={changeAvatar} />
      <div style={{background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:14,overflow:'hidden',marginBottom:16}}>
        <div style={{height:64,background:'linear-gradient(120deg, var(--gs), var(--bg2))',borderBottom:'1px solid var(--border)'}}></div>
        <div style={{padding:'0 20px 20px',textAlign:'center'}}>
          <div style={{position:'relative',width:88,height:88,margin:'-44px auto 12px'}}>
            <div style={{width:88,height:88,borderRadius:'50%',background:'var(--bg3)',border:'3px solid var(--bg2)',boxShadow:'0 0 0 2px var(--g)',overflow:'hidden',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"'Barlow Condensed',sans-serif",fontSize:30,fontWeight:800,color:'var(--g)'}}>
              {profile.avatar_url
                ? <img src={profile.avatar_url} alt={profile.username} style={{width:'100%',height:'100%',objectFit:'cover'}} />
                : profile.username?.slice(0,2).toUpperCase()}
            </div>
            {isMe && (
              <button onClick={()=>fileAvRef.current?.click()} disabled={uploadingAv} title="Changer la photo"
                style={{position:'absolute',bottom:2,right:2,width:30,height:30,borderRadius:'50%',background:'var(--g)',border:'2px solid var(--bg2)',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',cursor:uploadingAv?'wait':'pointer'}}>
                <i className={`ti ${uploadingAv?'ti-loader-2':'ti-camera'}`} style={{fontSize:14}}></i>
              </button>
            )}
          </div>
          <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:25,fontWeight:800,color:'var(--text)',textTransform:'uppercase',letterSpacing:'-.3px',lineHeight:1}}>{profile.username}</div>
          <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:8,flexWrap:'wrap',margin:'9px 0 4px'}}>
            <span style={{display:'inline-flex',alignItems:'center',gap:4,background:'var(--gs)',border:'1px solid var(--gg)',color:'var(--g)',fontSize:10,fontWeight:700,padding:'3px 10px',borderRadius:5,fontFamily:"'Barlow Condensed',sans-serif",textTransform:'uppercase',letterSpacing:'.5px'}}><i className="ti ti-check" style={{fontSize:11}}></i> Vendeur vérifié</span>
            {profile.nb_ventes>=10 && <span style={{display:'inline-flex',alignItems:'center',gap:4,background:'rgba(200,150,42,.12)',border:'1px solid rgba(200,150,42,.3)',color:'var(--amber)',fontSize:10,fontWeight:700,padding:'3px 10px',borderRadius:5,fontFamily:"'Barlow Condensed',sans-serif",textTransform:'uppercase',letterSpacing:'.5px'}}>⭐ Top vendeur</span>}
            <span style={{fontSize:12,color:'var(--text3)'}}>Membre depuis {since}</span>
          </div>
          {avg && <div style={{color:'var(--amber)',fontSize:14,marginTop:4}}>{'★'.repeat(Math.round(avg))}{'☆'.repeat(5-Math.round(avg))} <span style={{color:'var(--text3)',fontSize:12}}>{avg}/5 — {avis.length} avis</span></div>}
          <div style={{display:'flex',justifyContent:'center',borderTop:'1px solid var(--border)',marginTop:14,paddingTop:14}}>
            {[{v:annonces.length,l:'Annonces',c:'var(--g)'},{v:profile.nb_ventes||0,l:'Ventes'},{v:anciennete,l:'Membre'}].map((s,i,arr)=>(
              <React.Fragment key={i}>
                <div style={{flex:1,textAlign:'center'}}>
                  <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:23,fontWeight:800,color:s.c||'var(--text)',lineHeight:1}}>{s.v}</div>
                  <div style={{fontSize:11,color:'var(--text3)',marginTop:3}}>{s.l}</div>
                </div>
                {i<arr.length-1 && <div style={{width:1,background:'var(--border)',margin:'2px 0'}}></div>}
              </React.Fragment>
            ))}
          </div>
          <div style={{display:'flex',gap:8,justifyContent:'center',marginTop:16}}>
            {!isMe && user && <button className="btn btn-out" style={{fontSize:12,padding:'8px 16px'}} onClick={()=>setShowAvisModal(true)}><i className="ti ti-star"></i> Laisser un avis</button>}
            {isMe && <button className="btn btn-out" style={{fontSize:12,padding:'8px 16px'}} onClick={logout}><i className="ti ti-logout"></i> Déconnexion</button>}
          </div>
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
