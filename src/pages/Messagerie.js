import React, { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useApp } from '../App'
const CATS = ['AEG', 'GBB', 'Sniper', 'Équipement', 'Accessoire', 'Pièces']
export default function Messagerie() {
  const { user, setShowAuth, showToast } = useApp(); const navigate = useNavigate()
  const [convs, setConvs] = useState([]); const [active, setActive] = useState(null)
  const [msgs, setMsgs] = useState([]); const [txt, setTxt] = useState('')
  const [loading, setLoading] = useState(true); const bottomRef = useRef(null)
  const [txInfo, setTxInfo] = useState(null)
  const [convAnn, setConvAnn] = useState(null)
  const [showRating, setShowRating] = useState(false)
  const [rating, setRating] = useState({ note: 5, commentaire: '', categorie: '' })
  const [ratingErr, setRatingErr] = useState('')
  const [confirmSale, setConfirmSale] = useState(false); const [honorChecked, setHonorChecked] = useState(false)
  useEffect(() => { if (!user) { setShowAuth(true); navigate('/') } }, [user])
  useEffect(() => { if (user) loadConvs() }, [user])
  useEffect(() => { if (active) loadMsgs(active) }, [active])
  useEffect(() => { if (active) loadTx(active) }, [active])
  useEffect(() => { bottomRef.current?.scrollIntoView({behavior:'smooth'}) }, [msgs])
  const loadTx = async conv => {
    const { data: a } = await supabase.from('annonces').select('id,user_id,titre,prix,images,categorie').eq('id', conv.annonce_id).maybeSingle()
    setConvAnn(a || null)
    const seller = a?.user_id
    if (!seller || (seller !== user.id && seller !== conv.otherId)) { setTxInfo(null); return }
    const buyer = seller === user.id ? conv.otherId : user.id
    const { data: t } = await supabase.from('transactions').select('*').eq('annonce_id', conv.annonce_id).eq('buyer_id', buyer).maybeSingle()
    setTxInfo({ amSeller: seller === user.id, tx: t || null })
  }
  const confirmTxMsg = async () => {
    const amSeller = txInfo?.amSeller
    const { error } = await supabase.rpc('confirm_transaction', { p_annonce: active.annonce_id, p_other: active.otherId })
    if (error) { showToast('err', 'Erreur : ' + error.message); return }
    const buyer = amSeller ? active.otherId : user.id
    const { data: t } = await supabase.from('transactions').select('status').eq('annonce_id', active.annonce_id).eq('buyer_id', buyer).maybeSingle()
    if (t?.status === 'confirmed') { showToast('ok', "🎉 Vente confirmée ! Laissez votre évaluation."); openRating() }
    else showToast('ok', "C'est noté ! En attente de l'autre partie.")
    loadTx(active)
  }
  const openRating = () => { setRatingErr(''); setRating({ note: 5, commentaire: '', categorie: convAnn?.categorie || 'AEG' }); setShowRating(true) }
  const submitRating = async () => {
    setRatingErr('')
    const core = { auteur_id: user.id, cible_id: active.otherId, note: rating.note, commentaire: rating.commentaire.trim() }
    const full = { ...core, categorie: rating.categorie, annonce_id: active.annonce_id }
    let { error } = await supabase.from('avis').insert(full)
    // colonnes optionnelles absentes en base -> insertion minimale
    if (error && /column|categorie|annonce_id/i.test(error.message || '')) {
      ;({ error } = await supabase.from('avis').insert(core))
    }
    if (error) {
      const msg = /duplicate|unique/i.test(error.message || '')
        ? 'Vous avez déjà évalué cette vente.'
        : ('Erreur : ' + (error.message || 'envoi impossible'))
      setRatingErr(msg); showToast('err', msg); return
    }
    showToast('ok', 'Évaluation publiée ! Merci 🎯')
    setShowRating(false)
  }
  const loadConvs = async () => {
    const [{ data }, { data: hidden }] = await Promise.all([
      supabase.from('messages').select('*').or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`).order('created_at',{ascending:false}),
      supabase.from('conversations_hidden').select('*').eq('user_id', user.id),
    ])
    // Point de suppression par conversation (le plus récent)
    const hideMap = {}
    ;(hidden||[]).forEach(h => {
      const k = `${h.other_id}_${h.annonce_id}`
      if (!hideMap[k] || new Date(h.hidden_at) > new Date(hideMap[k])) hideMap[k] = h.hidden_at
    })
    const map = {}
    ;(data||[]).forEach(m => {
      const otherId = m.sender_id===user.id?m.receiver_id:m.sender_id
      const key = `${otherId}_${m.annonce_id}`
      const h = hideMap[key]
      const isUnreadToMe = !m.lu && m.receiver_id===user.id
      // On ignore les messages antérieurs au point de suppression de CE membre,
      // SAUF un message non lu qui m'est adressé (toujours visible).
      if (h && !isUnreadToMe && new Date(m.created_at) <= new Date(h)) return
      if (!map[key]) map[key]={...m,otherId,unread:0}
      if (!m.lu&&m.receiver_id===user.id) map[key].unread++
    })
    const visible = Object.values(map)
    // Pseudos + avatars des interlocuteurs (requête séparée, sans jointure fragile)
    const otherIds = [...new Set(visible.map(c => c.otherId).filter(Boolean))]
    let profMap = {}
    if (otherIds.length) {
      const { data: profs } = await supabase.from('profiles').select('id,username,avatar_url').in('id', otherIds)
      profMap = Object.fromEntries((profs || []).map(p => [p.id, p]))
    }
    // Titres des annonces concernées
    const annIds = [...new Set(visible.map(c => c.annonce_id).filter(Boolean))]
    let annMap = {}
    if (annIds.length) {
      const { data: anns } = await supabase.from('annonces').select('id,titre').in('id', annIds)
      annMap = Object.fromEntries((anns || []).map(a => [a.id, a]))
    }
    visible.forEach(c => {
      const p = profMap[c.otherId]
      c.otherName = p?.username || 'Membre'
      c.avatarUrl = p?.avatar_url
      c.annonce = c.annonce_id ? annMap[c.annonce_id] : null
    })
    setConvs(visible); setLoading(false)
  }
  const loadMsgs = async conv => {
    // Point de suppression de CE membre pour cette conversation
    let hq = supabase.from('conversations_hidden').select('hidden_at').eq('user_id', user.id).eq('other_id', conv.otherId)
    hq = conv.annonce_id == null ? hq.is('annonce_id', null) : hq.eq('annonce_id', conv.annonce_id)
    const { data: hid } = await hq.order('hidden_at',{ascending:false}).limit(1)
    const since = hid && hid[0] ? hid[0].hidden_at : null
    let q = supabase.from('messages').select('*').or(`and(sender_id.eq.${user.id},receiver_id.eq.${conv.otherId}),and(sender_id.eq.${conv.otherId},receiver_id.eq.${user.id})`)
    q = conv.annonce_id == null ? q.is('annonce_id', null) : q.eq('annonce_id', conv.annonce_id)
    if (since) q = q.gt('created_at', since)
    const { data } = await q.order('created_at',{ascending:true})
    setMsgs(data||[])
    let rq = supabase.from('messages').update({lu:true}).eq('receiver_id',user.id).eq('sender_id',conv.otherId)
    rq = conv.annonce_id == null ? rq.is('annonce_id', null) : rq.eq('annonce_id', conv.annonce_id)
    await rq
    window.dispatchEvent(new Event('as-refresh-unread'))
  }
  const send = async () => {
    if (!txt.trim()||!active) return
    await supabase.from('messages').insert({sender_id:user.id,receiver_id:active.otherId,annonce_id:active.annonce_id,contenu:txt.trim()})
    setTxt(''); loadMsgs(active); loadConvs()
  }
  const deleteConv = async (conv) => {
    if (!window.confirm("Supprimer cette conversation de votre messagerie ? Elle restera visible pour l'autre membre.")) return
    // On masque jusqu'à la date du dernier message (heure SERVEUR, pas navigateur),
    // pour éviter tout décalage d'horloge qui masquerait les futurs messages.
    const cutoff = conv.created_at || new Date().toISOString()
    await supabase.from('conversations_hidden').upsert(
      { user_id: user.id, other_id: conv.otherId, annonce_id: conv.annonce_id, hidden_at: cutoff },
      { onConflict: 'user_id,other_id,annonce_id' }
    )
    // Marquer mes messages reçus comme lus (pour vider la pastille)
    let rq = supabase.from('messages').update({ lu: true }).eq('receiver_id', user.id).eq('sender_id', conv.otherId)
    rq = conv.annonce_id == null ? rq.is('annonce_id', null) : rq.eq('annonce_id', conv.annonce_id)
    await rq
    setConvs(prev => prev.filter(c => !(c.otherId===conv.otherId && c.annonce_id===conv.annonce_id)))
    if (active && active.otherId===conv.otherId && active.annonce_id===conv.annonce_id) { setActive(null); setMsgs([]) }
    showToast('ok','Conversation supprimée.')
    window.dispatchEvent(new Event('as-refresh-unread'))
    loadConvs()
  }
  if (!user) return null
  if (loading) return <div className="loader"><div className="spin"></div></div>
  return (
    <div className="section" style={{maxWidth:1100,margin:'0 auto'}}>
      {showRating && active && (
        <div onClick={()=>setShowRating(false)} style={{position:'fixed',inset:0,zIndex:1000,background:'rgba(0,0,0,.85)',display:'flex',alignItems:'flex-start',justifyContent:'center',overflowY:'auto',padding:'7vh 16px 48px'}}>
          <div onClick={e=>e.stopPropagation()} style={{background:'#121512',border:'1px solid #2a3320',borderRadius:14,padding:24,width:'100%',maxWidth:380,position:'relative',boxShadow:'0 20px 60px rgba(0,0,0,.6)'}}>
            <div style={{position:'absolute',top:0,left:0,right:0,height:3,background:'linear-gradient(90deg,#7FA040,transparent)',borderRadius:'14px 14px 0 0'}}></div>
            <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:19,fontWeight:800,textTransform:'uppercase',color:'#EAF0E0'}}>Évaluation de la transaction</div>
            <div style={{fontSize:13,color:'#7d8a6e',marginTop:2,marginBottom:16}}>Donnez votre avis sur cet échange.</div>
            <div style={{display:'flex',flexDirection:'column',gap:8,marginBottom:16,fontSize:13}}>
              <div style={{display:'flex',justifyContent:'space-between'}}><span style={{color:'#7d8a6e'}}>Membre évalué</span><span style={{fontWeight:600}}>{active.otherName}</span></div>
              {txInfo && <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}><span style={{color:'#7d8a6e'}}>Votre rôle</span><span style={{background:'#191C18',border:'1px solid #2a3320',borderRadius:6,padding:'2px 10px',fontSize:12}}>{txInfo.amSeller?'Vendeur':'Acheteur'}</span></div>}
            </div>
            <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:12,color:'#7d8a6e',textTransform:'uppercase',letterSpacing:'.5px',marginBottom:7}}>Catégorie de l'article</div>
            <select value={rating.categorie} onChange={e=>setRating({...rating,categorie:e.target.value})} style={{width:'100%',background:'#141614',border:'1px solid #222820',borderRadius:8,padding:'10px 12px',fontSize:13,color:'#EAF0E0',outline:'none',marginBottom:16}}>
              {CATS.map(c=><option key={c} value={c}>{c}</option>)}
            </select>
            <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:12,color:'#7d8a6e',textTransform:'uppercase',letterSpacing:'.5px',marginBottom:7}}>Note</div>
            <div style={{marginBottom:14}}>
              {[1,2,3,4,5].map(n=>(
                <span key={n} onClick={()=>setRating({...rating,note:n})} style={{fontSize:34,cursor:'pointer',color:n<=rating.note?'#C8962A':'#2a3320'}}>★</span>
              ))}
            </div>
            <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:12,color:'#7d8a6e',textTransform:'uppercase',letterSpacing:'.5px',marginBottom:7}}>Commentaire</div>
            <textarea value={rating.commentaire} onChange={e=>setRating({...rating,commentaire:e.target.value})} placeholder="Mode de paiement, livraison, rapidité, conformité..." style={{width:'100%',background:'#141614',border:'1px solid #222820',borderRadius:8,padding:'10px 12px',fontSize:13,color:'#EAF0E0',outline:'none',resize:'vertical',minHeight:70,fontFamily:'inherit'}}></textarea>
            {ratingErr && <div style={{background:'rgba(217,64,64,.12)',border:'1px solid rgba(217,64,64,.4)',color:'#D94040',borderRadius:8,padding:'9px 12px',fontSize:12,marginTop:12}}>{ratingErr}</div>}
            <button onClick={submitRating} style={{width:'100%',padding:12,background:'#7FA040',color:'#fff',border:'none',borderRadius:8,fontFamily:"'Barlow Condensed',sans-serif",fontSize:15,fontWeight:700,textTransform:'uppercase',letterSpacing:'.5px',cursor:'pointer',marginTop:14}}>Valider l'évaluation</button>
            <button onClick={()=>setShowRating(false)} style={{width:'100%',padding:9,background:'transparent',color:'#7d8a6e',border:'none',fontSize:12,cursor:'pointer',marginTop:6}}>Plus tard</button>
          </div>
        </div>
      )}
      {confirmSale && active && txInfo && (
        <div onClick={()=>setConfirmSale(false)} style={{position:'fixed',inset:0,zIndex:1001,background:'rgba(0,0,0,.85)',display:'flex',alignItems:'flex-start',justifyContent:'center',overflowY:'auto',padding:'10vh 16px 48px'}}>
          <div onClick={e=>e.stopPropagation()} style={{background:'#121512',border:'1px solid #2a3320',borderRadius:14,padding:24,width:'100%',maxWidth:400,position:'relative',boxShadow:'0 20px 60px rgba(0,0,0,.6)'}}>
            <div style={{position:'absolute',top:0,left:0,right:0,height:3,background:'linear-gradient(90deg,#7FA040,transparent)',borderRadius:'14px 14px 0 0'}}></div>
            <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:19,fontWeight:800,textTransform:'uppercase',color:'#EAF0E0'}}>Confirmer {txInfo.amSeller ? 'la vente' : "l'achat"}</div>
            <div style={{fontSize:13,color:'#7d8a6e',marginTop:4,marginBottom:18,lineHeight:1.5}}>Cette confirmation engage votre responsabilité. Une fois validée par les deux membres, une évaluation pourra être laissée.</div>
            <label style={{display:'flex',gap:11,alignItems:'flex-start',background:'#141614',border:`1px solid ${honorChecked?'#7FA040':'#2a3320'}`,borderRadius:10,padding:'13px 14px',cursor:'pointer',transition:'border-color .15s'}}>
              <input type="checkbox" checked={honorChecked} onChange={e=>setHonorChecked(e.target.checked)} style={{marginTop:2,width:18,height:18,accentColor:'#7FA040',flexShrink:0,cursor:'pointer'}} />
              <span style={{fontSize:13,color:'#EAF0E0',lineHeight:1.45}}>Je certifie sur l'honneur avoir réellement {txInfo.amSeller ? 'vendu' : 'acheté'} cet objet à <b>{active.otherName}</b>. Je comprends que les fausses transactions destinées à obtenir des évaluations sont interdites.</span>
            </label>
            <button disabled={!honorChecked} onClick={()=>{ setConfirmSale(false); confirmTxMsg() }} style={{width:'100%',padding:13,background:honorChecked?'#7FA040':'#222820',color:honorChecked?'#fff':'#5a6650',border:'none',borderRadius:9,fontFamily:"'Barlow Condensed',sans-serif",fontSize:15,fontWeight:700,textTransform:'uppercase',letterSpacing:'.5px',cursor:honorChecked?'pointer':'not-allowed',marginTop:16}}><i className="ti ti-check"></i> Je confirme {txInfo.amSeller ? 'la vente' : "l'achat"}</button>
            <button onClick={()=>setConfirmSale(false)} style={{width:'100%',padding:9,background:'transparent',color:'#7d8a6e',border:'none',fontSize:12,cursor:'pointer',marginTop:6}}>Annuler</button>
          </div>
        </div>
      )}
      <div className={`msg-layout ${active && convAnn ? 'with-tx' : ''}`}>
        <div className="msg-sidebar">
          {convs.length===0
            ? <div style={{padding:24,textAlign:'center',color:'var(--text3)',fontSize:13}}><i className="ti ti-message-off" style={{fontSize:32,display:'block',marginBottom:8}}></i>Aucun message</div>
            : convs.map((c,i)=>(
              <div key={i} className={`conv-item ${active?.otherId===c.otherId&&active?.annonce_id===c.annonce_id?'on':''}`} onClick={()=>setActive(c)}>
                {c.avatarUrl
                  ? <img src={c.avatarUrl} alt="" className="conv-av" style={{objectFit:'cover'}} />
                  : <div className="conv-av">{c.otherName?.slice(0,2).toUpperCase()||'??'}</div>}
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                    <div className="conv-name">{c.otherName}</div>
                    {c.unread>0&&<span className="unread-badge">{c.unread}</span>}
                  </div>
                  <div className="conv-preview">{c.annonce?.titre||'Message direct'}</div>
                </div>
              </div>
            ))
          }
        </div>
        <div className="msg-chat">
          {!active
            ? <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',color:'var(--text3)'}}><div style={{textAlign:'center'}}><i className="ti ti-message" style={{fontSize:44,display:'block',marginBottom:12,opacity:.3}}></i>Sélectionnez une conversation</div></div>
            : <>
              <div className="msg-chat-head">
                {active.avatarUrl
                  ? <img src={active.avatarUrl} alt="" className="conv-av" style={{width:34,height:34,objectFit:'cover'}} />
                  : <div className="conv-av" style={{width:34,height:34,fontSize:12}}>{active.otherName?.slice(0,2).toUpperCase()}</div>}
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:600}}>{active.otherName}</div>
                  <div style={{fontSize:11,color:'var(--g)',display:'flex',alignItems:'center',gap:3}}><i className="ti ti-circle-check" style={{fontSize:12}}></i> Membre vérifié</div>
                </div>
                <button title="Supprimer la conversation" onClick={() => deleteConv(active)}
                  style={{ background:'rgba(217,64,64,.12)', border:'1px solid rgba(217,64,64,.4)', color:'var(--red)', cursor:'pointer', fontSize:19, padding:'6px 9px', borderRadius:8, flexShrink:0, display:'flex', alignItems:'center' }}>
                  <i className="ti ti-trash"></i>
                </button>
              </div>
              <div className="bubbles">
                {msgs.map(m=>(
                  <div key={m.id} style={{display:'flex',justifyContent:m.sender_id===user.id?'flex-end':'flex-start'}}>
                    <div className={`bubble ${m.sender_id===user.id?'me':'them'}`}>
                      {m.contenu}
                      <div className="bubble-time">{new Date(m.created_at).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})}</div>
                    </div>
                  </div>
                ))}
                <div ref={bottomRef}></div>
              </div>
              <div className="msg-inp">
                <input value={txt} onChange={e=>setTxt(e.target.value)} onKeyDown={e=>e.key==='Enter'&&!e.shiftKey&&send()} placeholder="Votre message..." />
                <button className="btn btn-acc" style={{padding:'9px 16px'}} onClick={send}><i className="ti ti-send"></i></button>
              </div>
            </>
          }
        </div>
        {active && convAnn && (() => {
          const t = txInfo?.tx
          const myConfirmed = t && (txInfo.amSeller ? t.seller_confirmed : t.buyer_confirmed)
          const otherConfirmed = t && (txInfo.amSeller ? t.buyer_confirmed : t.seller_confirmed)
          const done = t?.status === 'confirmed'
          const s1 = done ? 'done' : (myConfirmed ? 'done' : 'active')
          const s2 = done ? 'done' : (myConfirmed ? 'active' : 'todo')
          const s3 = done ? 'active' : 'todo'
          const col = st => st==='done'?'var(--g)':(st==='active'?'#A3E635':'#3a4a2a')
          const txtCol = st => st==='todo'?'var(--text3)':'var(--text)'
          const Step = ({n,label,st}) => (
            <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:12}}>
              <div style={{width:26,height:26,borderRadius:'50%',border:`2px solid ${col(st)}`,color:col(st),display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:800,flexShrink:0}}>{st==='done'?'✓':n}</div>
              <div style={{fontSize:12,color:txtCol(st),lineHeight:1.3}}>{label}</div>
            </div>
          )
          return (
            <div className="msg-tx-panel">
              <div style={{fontFamily:'var(--fh)',fontWeight:800,textTransform:'uppercase',letterSpacing:'1px',fontSize:13,color:'#A3E635',marginBottom:10}}>La transaction</div>
              <div onClick={() => navigate(`/annonces/${convAnn.id}`)} style={{display:'flex',alignItems:'center',gap:9,background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:8,padding:9,marginBottom:16,cursor:'pointer'}}>
                <div style={{width:36,height:36,borderRadius:7,overflow:'hidden',background:'var(--bg4)',border:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                  {convAnn.images && convAnn.images.length>0 ? <img src={convAnn.images[0]} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}} /> : <i className="ti ti-package" style={{fontSize:16,color:'var(--text3)'}}></i>}
                </div>
                <div style={{minWidth:0}}>
                  <div style={{fontSize:12,fontWeight:600,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{convAnn.titre}</div>
                  <div style={{fontFamily:'var(--fh)',fontSize:14,fontWeight:800,color:'var(--g)'}}>{Number(convAnn.prix).toFixed(0)} €</div>
                </div>
              </div>
              <Step n={1} st={s1} label={txInfo?.amSeller ? 'Vous confirmez la vente' : "Vous confirmez l'achat"} />
              <Step n={2} st={s2} label={txInfo?.amSeller ? "L'acheteur confirme" : 'Le vendeur confirme'} />
              <Step n={3} st={s3} label={<span>★ Évaluation débloquée</span>} />
              {!txInfo ? (
                <div style={{fontSize:11,color:'var(--text3)',lineHeight:1.5,marginTop:4}}>Le système de vente s'activera ici une fois la conversation liée à l'annonce.</div>
              ) : done ? (
                <>
                  <button onClick={openRating} style={{width:'100%',padding:13,background:'rgba(200,150,42,.15)',border:'1px solid rgba(200,150,42,.5)',color:'var(--amber)',borderRadius:9,fontFamily:'var(--fh)',fontWeight:800,textTransform:'uppercase',letterSpacing:'1px',fontSize:13,cursor:'pointer',marginTop:6}}><i className="ti ti-star" style={{fontSize:16}}></i> Évaluer ce membre</button>
                  <div style={{fontSize:11,color:'var(--g)',lineHeight:1.5,marginTop:8,display:'flex',gap:6}}><i className="ti ti-circle-check" style={{flexShrink:0,marginTop:1}}></i> Vente confirmée par les deux membres. Vous pouvez laisser votre avis.</div>
                </>
              ) : myConfirmed ? (
                <>
                  <div style={{display:'flex',alignItems:'center',gap:7,background:'rgba(200,150,42,.1)',border:'1px solid rgba(200,150,42,.3)',color:'var(--amber)',borderRadius:8,padding:'11px 12px',fontSize:12,marginTop:6}}><i className="ti ti-clock"></i> En attente de la confirmation de l'autre membre…</div>
                  <div style={{fontSize:11,color:'var(--text3)',lineHeight:1.5,marginTop:8}}>Dès que {active.otherName} aura confirmé de son côté, le bouton ★ Évaluer apparaîtra ici.</div>
                </>
              ) : (
                <>
                  <button onClick={() => { setHonorChecked(false); setConfirmSale(true) }} style={{width:'100%',padding:13,background:'var(--g)',color:'#fff',border:'none',borderRadius:9,fontFamily:'var(--fh)',fontWeight:800,textTransform:'uppercase',letterSpacing:'1px',fontSize:13,cursor:'pointer',marginTop:6}}><i className="ti ti-check" style={{fontSize:16}}></i> {txInfo.amSeller ? "J'ai vendu" : "J'ai acheté"}</button>
                  <div style={{fontSize:11,color:'var(--text3)',lineHeight:1.5,marginTop:8}}>💡 Cliquez quand la vente est conclue. Quand <b>vous et l'autre membre</b> avez confirmé, le bouton ★ Évaluer apparaîtra ici.</div>
                </>
              )}
            </div>
          )
        })()}
      </div>
    </div>
  )
}
