import React, { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useApp } from '../App'
const EMOJI={AEG:'🔫',GBB:'🔫',Sniper:'🎯',Équipement:'🦺',Accessoire:'🔭',Pièces:'⚙️'}
async function compressAvatar(file){return new Promise(res=>{const img=new Image();const url=URL.createObjectURL(file);img.onload=()=>{const c=document.createElement('canvas');let w=img.width,h=img.height;const m=400;if(w>m){h=Math.round(h*m/w);w=m}c.width=w;c.height=h;c.getContext('2d').drawImage(img,0,0,w,h);c.toBlob(b=>{URL.revokeObjectURL(url);res(b)},'image/jpeg',0.85)};img.src=url})}
export default function Profil() {
  const { id } = useParams(); const navigate = useNavigate()
  const { user, logout, showToast, favs } = useApp()
  const [profile, setProfile] = useState(null); const [annonces, setAnnonces] = useState([])
  const [avis, setAvis] = useState([]); const [tab, setTab] = useState('ann')
  const [loading, setLoading] = useState(true)
  const [showAvisList, setShowAvisList] = useState(false)
  const [showMsg, setShowMsg] = useState(false); const [msgText, setMsgText] = useState(''); const [sendingMsg, setSendingMsg] = useState(false)
  const [uploadingAv, setUploadingAv] = useState(false)
  const [favAnnonces, setFavAnnonces] = useState([])
  const fileAvRef = useRef(null)
  const isMe = user?.id === id
  useEffect(() => { load() }, [id, user])
  useEffect(() => {
    if (isMe && favs.length > 0) {
      supabase.from('annonces').select('*').in('id', favs).then(({ data }) => setFavAnnonces(data || []))
    } else { setFavAnnonces([]) }
  }, [isMe, favs])
  const load = async () => {
    const [{ data:p },{ data:a },{ data:av }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id',id).single(),
      supabase.from('annonces').select('*').eq('user_id',id).order('created_at',{ascending:false}),
      supabase.from('avis').select('*,auteur:auteur_id(username)').eq('cible_id',id).order('created_at',{ascending:false}),
    ])
    setProfile(p); setAnnonces(a||[]); setAvis(av||[])
    setLoading(false)
  }
  const sendMsg = async () => {
    if (!user) { showToast('err','Connectez-vous pour envoyer un message.'); return }
    if (!msgText.trim()) return
    setSendingMsg(true)
    const { error } = await supabase.from('messages').insert({ sender_id:user.id, receiver_id:id, annonce_id:null, contenu:msgText.trim() })
    setSendingMsg(false)
    if (error) { showToast('err',"Erreur lors de l'envoi."); return }
    setShowMsg(false); setMsgText(''); showToast('ok','Message envoyé !'); navigate('/messagerie')
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
  return (
    <div>
      {showMsg && (
        <div className="overlay show" onClick={()=>setShowMsg(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <button className="modal-close" onClick={()=>setShowMsg(false)}><i className="ti ti-x"></i></button>
            <div className="modal-title">Envoyer un message</div>
            <div className="modal-sub">À {profile.username}</div>
            <div className="form-group"><label>Votre message</label><textarea value={msgText} onChange={e=>setMsgText(e.target.value)} placeholder="Bonjour, ..."></textarea></div>
            <button className="btn btn-acc btn-block" disabled={sendingMsg||!msgText.trim()} onClick={sendMsg}>{sendingMsg?'Envoi...':'Envoyer'}</button>
          </div>
        </div>
      )}
      {showAvisList && (
        <div onClick={()=>setShowAvisList(false)} style={{position:'fixed',inset:0,zIndex:1000,background:'rgba(0,0,0,.85)',display:'flex',alignItems:'flex-start',justifyContent:'center',overflowY:'auto',padding:'7vh 16px 48px'}}>
          <div onClick={e=>e.stopPropagation()} style={{background:'#121512',border:'1px solid #2a3320',borderRadius:14,padding:22,width:'100%',maxWidth:440,position:'relative',boxShadow:'0 20px 60px rgba(0,0,0,.6)'}}>
            <div style={{position:'absolute',top:0,left:0,right:0,height:3,background:'linear-gradient(90deg,var(--g),transparent)',borderRadius:'14px 14px 0 0'}}></div>
            <button onClick={()=>setShowAvisList(false)} style={{position:'absolute',top:14,right:14,background:'none',border:'none',color:'var(--text3)',cursor:'pointer',fontSize:18}}><i className="ti ti-x"></i></button>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16,paddingRight:24}}>
              <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:19,fontWeight:800,textTransform:'uppercase',color:'var(--text)'}}>Avis reçus ({avis.length})</div>
              {avg && <div style={{color:'var(--amber)',fontSize:13}}>★ {avg}/5</div>}
            </div>
            {avis.length===0
              ? <div className="empty"><i className="ti ti-star-off"></i><p>Aucun avis pour le moment.</p></div>
              : <div style={{display:'flex',flexDirection:'column',gap:10,maxHeight:'55vh',overflow:'auto'}}>
                  {avis.map(av=>(
                    <div key={av.id} style={{background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:10,padding:12}}>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:5,gap:8}}>
                        <span style={{fontWeight:600,fontSize:13}}>{av.auteur?.username||'Anonyme'}{av.categorie && <span style={{marginLeft:8,background:'var(--gs)',border:'1px solid var(--gg)',color:'var(--g)',fontSize:10,fontWeight:700,padding:'1px 7px',borderRadius:4,textTransform:'uppercase',letterSpacing:'.5px'}}>{av.categorie}</span>}</span>
                        <span style={{color:'var(--amber)',fontSize:13,whiteSpace:'nowrap'}}>{'★'.repeat(av.note)}{'☆'.repeat(5-av.note)}</span>
                      </div>
                      {av.commentaire && <div style={{fontSize:13,color:'var(--text2)'}}>{av.commentaire}</div>}
                      <div style={{fontSize:11,color:'var(--text3)',marginTop:5}}>{new Date(av.created_at).toLocaleDateString('fr-FR')}</div>
                    </div>
                  ))}
                </div>}
          </div>
        </div>
      )}
      <div style={{background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:14,overflow:'hidden',marginBottom:16}}>
        <div style={{height:88,background:'linear-gradient(120deg, var(--gs), var(--bg2)), repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(127,160,64,.04) 10px, rgba(127,160,64,.04) 20px)',borderBottom:'1px solid var(--border)'}}></div>
        <div style={{padding:'0 20px 20px',textAlign:'center'}}>
          <div style={{position:'relative',width:92,height:92,margin:'-46px auto 12px'}}>
            <div style={{width:92,height:92,borderRadius:'50%',background:'var(--bg3)',border:'3px solid var(--bg2)',boxShadow:'0 0 0 2px var(--g)',overflow:'hidden',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"'Barlow Condensed',sans-serif",fontSize:31,fontWeight:800,color:'var(--g)'}}>
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
          <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:26,fontWeight:800,color:'var(--text)',textTransform:'uppercase',letterSpacing:'-.3px',lineHeight:1}}>{profile.username}</div>
          <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:8,flexWrap:'wrap',margin:'10px 0 6px'}}>
            <span style={{display:'inline-flex',alignItems:'center',gap:4,background:'var(--gs)',border:'1px solid var(--gg)',color:'var(--g)',fontSize:10,fontWeight:700,padding:'3px 10px',borderRadius:5,fontFamily:"'Barlow Condensed',sans-serif",textTransform:'uppercase',letterSpacing:'.5px'}}><i className="ti ti-check" style={{fontSize:11}}></i> Vendeur vérifié</span>
            {profile.nb_ventes>=10 && <span style={{display:'inline-flex',alignItems:'center',gap:4,background:'rgba(200,150,42,.12)',border:'1px solid rgba(200,150,42,.3)',color:'var(--amber)',fontSize:10,fontWeight:700,padding:'3px 10px',borderRadius:5,fontFamily:"'Barlow Condensed',sans-serif",textTransform:'uppercase',letterSpacing:'.5px'}}>⭐ Top vendeur</span>}
          </div>
          <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:5,fontSize:12,color:'var(--text3)',marginBottom:12}}>
            <i className="ti ti-calendar" style={{fontSize:13}}></i> Membre depuis {since}
          </div>
          {/* NOTE CLIQUABLE */}
          <button onClick={()=>setShowAvisList(true)} style={{display:'inline-flex',alignItems:'center',gap:7,background:'var(--bg3)',border:'1px solid var(--border2)',borderRadius:8,padding:'7px 14px',cursor:'pointer',color:'var(--amber)',fontSize:14}}>
            {avg ? <>{'★'.repeat(Math.round(avg))}{'☆'.repeat(5-Math.round(avg))} <span style={{fontWeight:700}}>{avg}</span> <span style={{color:'var(--text3)',fontSize:12}}>· {avis.length} avis →</span></> : <span style={{color:'var(--text3)',fontSize:13}}>Aucun avis pour le moment →</span>}
          </button>
          <div style={{display:'flex',justifyContent:'center',borderTop:'1px solid var(--border)',marginTop:16,paddingTop:14}}>
            {[{v:annonces.length,l:isMe?'Mes annonces':'Annonces',c:'var(--g)'},{v:profile.nb_ventes||0,l:'Ventes'},{v:avg||'—',l:'Note'}].map((s,i,arr)=>(
              <React.Fragment key={i}>
                <div style={{flex:1,textAlign:'center'}}>
                  <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:23,fontWeight:800,color:s.c||'var(--text)',lineHeight:1}}>{s.v}</div>
                  <div style={{fontSize:11,color:'var(--text3)',marginTop:3}}>{s.l}</div>
                </div>
                {i<arr.length-1 && <div style={{width:1,background:'var(--border)',margin:'2px 0'}}></div>}
              </React.Fragment>
            ))}
          </div>
          <div style={{display:'flex',gap:8,justifyContent:'center',alignItems:'center',flexWrap:'wrap',marginTop:16}}>
            {!isMe && user && <button className="btn btn-out" style={{fontSize:12,padding:'8px 16px'}} onClick={()=>setShowMsg(true)}><i className="ti ti-mail"></i> Envoyer un message</button>}
            {isMe && <button className="btn btn-out" style={{fontSize:12,padding:'8px 16px'}} onClick={logout}><i className="ti ti-logout"></i> Déconnexion</button>}
          </div>
        </div>
      </div>
      <div className="tabs">
        <button className={`tab ${tab==='ann'?'on':''}`} onClick={()=>setTab('ann')}>{isMe?'Mes annonces':'Annonces'} ({annonces.length})</button>
        <button className={`tab ${tab==='avis'?'on':''}`} onClick={()=>setTab('avis')}>Avis ({avis.length})</button>
        {isMe && <button className={`tab ${tab==='fav'?'on':''}`} onClick={()=>setTab('fav')}>Favoris ({favs.length})</button>}
      </div>
      <div className="section">
        {tab==='ann' && (annonces.length===0
          ? <div className="empty"><i className="ti ti-mood-empty"></i><p>Aucune annonce.</p></div>
          : <div className="ann-grid">{annonces.map(a=>(
              <div key={a.id} className="ann-card" onClick={()=>navigate(`/annonces/${a.id}`)}>
                <div className="ai">{a.images && a.images.length > 0 ? <img src={a.images[0]} alt={a.titre} /> : <span style={{fontSize:46}}>{EMOJI[a.categorie]||'🔫'}</span>}{a.sold_at && <span style={{ position:'absolute',top:8,left:8,background:'var(--red)',color:'#fff',fontFamily:"'Barlow Condensed',sans-serif",fontWeight:800,fontSize:11,letterSpacing:1,padding:'3px 9px',borderRadius:5,textTransform:'uppercase',zIndex:2,boxShadow:'0 2px 6px rgba(0,0,0,.4)' }}>Vendu</span>}</div>
                <div className="ab"><div className="at">{a.titre}</div><div className="ap">{Number(a.prix).toFixed(2)} €</div><div className="al"><i className="ti ti-map-pin" style={{fontSize:11}}></i>{a.ville}</div></div>
              </div>
            ))}</div>
        )}
        {tab==='avis' && (avis.length===0
          ? <div className="empty"><i className="ti ti-star-off"></i><p>Aucun avis.</p></div>
          : <div>{avis.map(av=>(
              <div key={av.id} className="avis-item">
                <div className="avis-head">
                  <span className="avis-user">{av.auteur?.username||'Anonyme'}{av.categorie && <span style={{marginLeft:8,background:'var(--gs)',border:'1px solid var(--gg)',color:'var(--g)',fontSize:10,fontWeight:700,padding:'1px 7px',borderRadius:4,textTransform:'uppercase',letterSpacing:'.5px'}}>{av.categorie}</span>}</span>
                  <span className="avis-stars">{'★'.repeat(av.note)}{'☆'.repeat(5-av.note)}</span>
                </div>
                <p className="avis-text">{av.commentaire}</p>
                <div style={{fontSize:11,color:'var(--text3)',marginTop:5}}>{new Date(av.created_at).toLocaleDateString('fr-FR')}</div>
              </div>
            ))}</div>
        )}
        {tab==='fav' && (favAnnonces.length===0
          ? <div className="empty"><i className="ti ti-heart-off"></i><p>Aucune annonce en favori.</p></div>
          : <div className="ann-grid">{favAnnonces.map(a=>(
              <div key={a.id} className="ann-card" onClick={()=>navigate(`/annonces/${a.id}`)}>
                <div className="ai">{a.images && a.images.length > 0 ? <img src={a.images[0]} alt={a.titre} /> : <span style={{fontSize:46}}>{EMOJI[a.categorie]||'🔫'}</span>}{a.sold_at && <span style={{ position:'absolute',top:8,left:8,background:'var(--red)',color:'#fff',fontFamily:"'Barlow Condensed',sans-serif",fontWeight:800,fontSize:11,letterSpacing:1,padding:'3px 9px',borderRadius:5,textTransform:'uppercase',zIndex:2,boxShadow:'0 2px 6px rgba(0,0,0,.4)' }}>Vendu</span>}</div>
                <div className="ab"><div className="at">{a.titre}</div><div className="ap">{Number(a.prix).toFixed(2)} €</div><div className="al"><i className="ti ti-map-pin" style={{fontSize:11}}></i>{a.ville}{a.departement?` (${a.departement})`:''}</div></div>
              </div>
            ))}</div>
        )}
      </div>
    </div>
  )
}
