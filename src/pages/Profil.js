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
  const [showMsg, setShowMsg] = useState(false); const [msgText, setMsgText] = useState(''); const [sendingMsg, setSendingMsg] = useState(false); const [msgErr, setMsgErr] = useState('')
  const [uploadingAv, setUploadingAv] = useState(false)
  const [favAnnonces, setFavAnnonces] = useState([])
  const [recentAct, setRecentAct] = useState([]); const [tempsRep, setTempsRep] = useState(null); const [vues, setVues] = useState(0)
  const [editingBio, setEditingBio] = useState(false); const [bioText, setBioText] = useState(''); const [savingBio, setSavingBio] = useState(false)
  const fileAvRef = useRef(null)
  const isMe = user?.id === id
  useEffect(() => { load() }, [id, user])
  useEffect(() => {
    if (isMe && favs.length > 0) {
      supabase.from('annonces').select('*').eq('supprimee', false).in('id', favs).then(({ data }) => setFavAnnonces(data || []))
    } else { setFavAnnonces([]) }
  }, [isMe, favs])
  const load = async () => {
    const [{ data:p },{ data:a },{ data:av },{ data:tx }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id',id).single(),
      supabase.from('annonces').select('*').eq('user_id',id).eq('supprimee', false).order('created_at',{ascending:false}),
      supabase.from('avis').select('*,auteur:auteur_id(username)').eq('cible_id',id).order('created_at',{ascending:false}),
      supabase.from('transactions').select('annonce_id,confirmed_at').eq('seller_id',id).eq('status','confirmed').order('confirmed_at',{ascending:false}),
    ])
    setProfile(p); setAnnonces(a||[]); setAvis(av||[]); setVues(p?.vues_mois||0)
    // Activité récente : ventes, dépôts d'annonce, avis reçus
    const acts = []
    ;(tx||[]).forEach(t => acts.push({ type:'vente', date:t.confirmed_at, label:'Vente réalisée' }))
    ;(a||[]).forEach(an => acts.push({ type:'annonce', date:an.created_at, label:'Annonce publiée', detail:an.titre }))
    ;(av||[]).forEach(v => acts.push({ type:'avis', date:v.created_at, label:'Nouvel avis reçu', detail:`Évaluation ${v.note} étoile${v.note>1?'s':''}` }))
    acts.sort((x,y)=> new Date(y.date) - new Date(x.date))
    setRecentAct(acts.filter(x=>x.date).slice(0,5))
    setLoading(false)
    computeResponseTime()
    if (user && user.id !== id) supabase.rpc('increment_profile_view', { p_id: id })
  }
  const computeResponseTime = async () => {
    const { data: msgs } = await supabase.from('messages').select('sender_id,receiver_id,annonce_id,created_at').or(`sender_id.eq.${id},receiver_id.eq.${id}`).order('created_at',{ascending:true}).limit(400)
    if (!msgs || !msgs.length) { setTempsRep(null); return }
    const convs = {}
    msgs.forEach(m => { const other = m.sender_id===id ? m.receiver_id : m.sender_id; const key = `${other}_${m.annonce_id}`; (convs[key]=convs[key]||[]).push(m) })
    const delays = []
    Object.values(convs).forEach(list => {
      let pending = null
      list.forEach(m => {
        if (m.receiver_id===id) { if (pending===null) pending = new Date(m.created_at).getTime() }
        else if (m.sender_id===id && pending!==null) { delays.push(new Date(m.created_at).getTime()-pending); pending=null }
      })
    })
    if (!delays.length) { setTempsRep(null); return }
    setTempsRep(delays.reduce((s,d)=>s+d,0)/delays.length)
  }
  const saveBio = async () => {
    setSavingBio(true)
    const { error } = await supabase.from('profiles').update({ bio: bioText.trim() }).eq('id', user.id)
    setSavingBio(false)
    if (error) { showToast('err','Erreur : '+error.message); return }
    setProfile(p => ({ ...p, bio: bioText.trim() })); setEditingBio(false); showToast('ok','Description mise à jour !')
  }
  const sendMsg = async () => {
    setMsgErr('')
    if (!user) { showToast('err','Connectez-vous pour envoyer un message.'); return }
    if (!msgText.trim()) return
    setSendingMsg(true)
    const { error } = await supabase.from('messages').insert({ sender_id:user.id, receiver_id:id, annonce_id:null, contenu:msgText.trim() })
    setSendingMsg(false)
    if (error) { setMsgErr('Erreur : ' + (error.message || 'envoi impossible')); return }
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
  const pctPositifs = avis.length>0 ? Math.round(avis.filter(a=>a.note>=4).length/avis.length*100) : null
  const fmtRep = (ms) => { if(ms==null) return '—'; const min=ms/60000; if(min<60) return `${Math.max(1,Math.round(min))} min`; const h=min/60; if(h<24) return `${Math.round(h)} h`; return `${Math.round(h/24)} j` }
  const actIcon = { vente:{i:'ti-circle-check',c:'var(--g)'}, annonce:{i:'ti-file-text',c:'var(--text2)'}, avis:{i:'ti-star',c:'var(--amber)'} }
  const timeAgo = (d) => { const days=Math.floor((Date.now()-new Date(d).getTime())/86400000); if(days<=0) return "aujourd'hui"; if(days===1) return 'hier'; if(days<7) return `il y a ${days} jours`; if(days<30) return `il y a ${Math.floor(days/7)} sem.`; return `il y a ${Math.floor(days/30)} mois` }
  return (
    <div>
      {showMsg && (
        <div className="overlay show" onClick={()=>setShowMsg(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <button className="modal-close" onClick={()=>setShowMsg(false)}><i className="ti ti-x"></i></button>
            <div className="modal-title">Envoyer un message</div>
            <div className="modal-sub">À {profile.username}</div>
            <div className="form-group"><label>Votre message</label><textarea value={msgText} onChange={e=>setMsgText(e.target.value)} placeholder="Bonjour, ..."></textarea></div>
            {msgErr && <div style={{background:'rgba(217,64,64,.12)',border:'1px solid rgba(217,64,64,.4)',color:'var(--red)',borderRadius:8,padding:'9px 12px',fontSize:12,marginBottom:10}}>{msgErr}</div>}
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
        <div style={{height:140,background:'linear-gradient(rgba(10,11,9,.35), rgba(10,11,9,.75)), url(/hero.jpg)',backgroundSize:'cover',backgroundPosition:'center',borderBottom:'1px solid var(--border)'}}></div>
        <div style={{padding:'0 20px 20px',textAlign:'center'}}>
          <div style={{position:'relative',width:92,height:92,margin:'-46px auto 12px'}}>
            <div style={{width:92,height:92,borderRadius:'50%',background:'var(--bg3)',border:'3px solid var(--bg2)',boxShadow:'0 0 0 2px var(--g)',overflow:'hidden',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"'Barlow Condensed',sans-serif",fontSize:31,fontWeight:800,color:'var(--g)'}}>
              {profile.avatar_url
                ? <img src={profile.avatar_url} alt={profile.username} style={{width:'100%',height:'100%',objectFit:'cover'}} />
                : profile.username?.slice(0,2).toUpperCase()}
            </div>
            {isMe && (
              <>
                <button onClick={()=>fileAvRef.current?.click()} disabled={uploadingAv} title="Changer la photo"
                  style={{position:'absolute',bottom:2,right:2,width:30,height:30,borderRadius:'50%',background:'var(--g)',border:'2px solid var(--bg2)',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',cursor:uploadingAv?'wait':'pointer'}}>
                  <i className={`ti ${uploadingAv?'ti-loader-2':'ti-camera'}`} style={{fontSize:14}}></i>
                </button>
                <input ref={fileAvRef} type="file" accept="image/*" onChange={changeAvatar} style={{display:'none'}} />
              </>
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
          {!isMe && user && (
            <button className="btn btn-acc" style={{width:'100%',justifyContent:'center',padding:'13px',fontSize:14,marginTop:16}} onClick={()=>setShowMsg(true)}>
              <i className="ti ti-mail"></i> Envoyer un message
            </button>
          )}
          {/* DESCRIPTION (modifiable par le membre uniquement) */}
          {(profile.bio || isMe) && (
            <div style={{background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:10,padding:'14px 18px',marginTop:14,textAlign:'left',position:'relative'}}>
              {editingBio ? (
                <>
                  <textarea value={bioText} onChange={e=>setBioText(e.target.value)} maxLength={250} placeholder="Présente-toi en quelques mots (spécialité, délais d'envoi...)" style={{width:'100%',background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:8,padding:'9px 12px',fontSize:13,color:'var(--text)',outline:'none',resize:'vertical',minHeight:64,fontFamily:'inherit'}}></textarea>
                  <div style={{display:'flex',gap:8,marginTop:8}}>
                    <button className="btn btn-acc" style={{fontSize:12,padding:'7px 14px'}} disabled={savingBio} onClick={saveBio}>{savingBio?'...':'Enregistrer'}</button>
                    <button className="btn btn-out" style={{fontSize:12,padding:'7px 14px'}} onClick={()=>setEditingBio(false)}>Annuler</button>
                  </div>
                </>
              ) : profile.bio ? (
                <div style={{display:'flex',gap:10}}>
                  <i className="ti ti-quote" style={{fontSize:18,color:'var(--g)',flexShrink:0}}></i>
                  <div style={{fontSize:13,color:'var(--text2)',lineHeight:1.5,whiteSpace:'pre-line',flex:1}}>{profile.bio}</div>
                  {isMe && <button onClick={()=>{setBioText(profile.bio||'');setEditingBio(true)}} title="Modifier" style={{background:'none',border:'none',color:'var(--text3)',cursor:'pointer',fontSize:15,flexShrink:0}}><i className="ti ti-pencil"></i></button>}
                </div>
              ) : (
                <button onClick={()=>{setBioText('');setEditingBio(true)}} style={{background:'none',border:'1px dashed var(--border2)',borderRadius:8,padding:'8px 14px',color:'var(--text3)',cursor:'pointer',fontSize:13,width:'100%',display:'flex',alignItems:'center',justifyContent:'center',gap:6}}>
                  <i className="ti ti-plus"></i> Ajouter une description
                </button>
              )}
            </div>
          )}
          {/* CARTES STATS */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(112px,1fr))',gap:10,marginTop:18,textAlign:'left'}}>
            {[
              {ic:'ti-file-text',v:annonces.length,l:'Annonces',s:'en ligne'},
              {ic:'ti-shopping-cart',v:profile.nb_ventes||0,l:'Ventes',s:'réalisées'},
              {ic:'ti-eye',v:vues,l:'Vues profil',s:'ce mois-ci'},
              {ic:'ti-bolt',v:fmtRep(tempsRep),l:'Temps de réponse',s:'moyen'},
              {ic:'ti-thumb-up',v:pctPositifs!=null?`${pctPositifs}%`:'—',l:'Avis positifs',s:`${avis.length} avis`},
            ].map((s,i)=>(
              <div key={i} style={{background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:10,padding:'14px 12px',display:'flex',alignItems:'center',gap:10,minWidth:0}}>
                <i className={`ti ${s.ic}`} style={{fontSize:24,color:'#A3E635',flexShrink:0}}></i>
                <div style={{minWidth:0}}>
                  <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:20,fontWeight:800,color:'var(--text)',lineHeight:1}}>{s.v}</div>
                  <div style={{fontSize:11,color:'var(--text2)',fontWeight:600,marginTop:2,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{s.l}</div>
                  <div style={{fontSize:10,color:'var(--text3)'}}>{s.s}</div>
                </div>
              </div>
            ))}
          </div>
          {/* BADGE COMPTE VÉRIFIÉ */}
          <div style={{display:'flex',alignItems:'center',gap:14,background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:10,padding:'14px 18px',marginTop:12,textAlign:'left'}}>
            <i className="ti ti-shield-check" style={{fontSize:30,color:'#A3E635',flexShrink:0}}></i>
            <div>
              <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:15,fontWeight:800,textTransform:'uppercase',letterSpacing:'.5px',color:'var(--g)'}}>Vendeur confirmé</div>
              <div style={{fontSize:12,color:'var(--text2)'}}>Compte vérifié</div>
            </div>
          </div>
          {/* ACTIVITÉ RÉCENTE */}
          {recentAct.length>0 && (
            <div style={{background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:10,padding:'16px 18px',marginTop:12,textAlign:'left'}}>
              <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:14,fontWeight:700,textTransform:'uppercase',letterSpacing:'.5px',color:'var(--text)',marginBottom:12,display:'flex',alignItems:'center',gap:8}}>
                <span style={{width:3,height:16,background:'var(--g)',borderRadius:2,display:'inline-block'}}></span> Activité récente
              </div>
              <div style={{display:'flex',flexDirection:'column',gap:12}}>
                {recentAct.map((a,i)=>(
                  <div key={i} style={{display:'flex',alignItems:'center',gap:12}}>
                    <i className={`ti ${actIcon[a.type].i}`} style={{fontSize:20,color:actIcon[a.type].c,flexShrink:0}}></i>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:13,fontWeight:600,color:'var(--text)'}}>{a.label}</div>
                      {a.detail && <div style={{fontSize:12,color:'var(--text3)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{a.detail}</div>}
                    </div>
                    <div style={{fontSize:11,color:'var(--text3)',whiteSpace:'nowrap'}}>{timeAgo(a.date)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div style={{display:'flex',gap:8,justifyContent:'center',alignItems:'center',flexWrap:'wrap',marginTop:16}}>
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
