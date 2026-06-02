import React, { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useApp } from '../App'
export default function Messagerie() {
  const { user, setShowAuth, showToast } = useApp(); const navigate = useNavigate()
  const [convs, setConvs] = useState([]); const [active, setActive] = useState(null)
  const [msgs, setMsgs] = useState([]); const [txt, setTxt] = useState('')
  const [loading, setLoading] = useState(true); const bottomRef = useRef(null)
  const [txInfo, setTxInfo] = useState(null)
  useEffect(() => { if (!user) { setShowAuth(true); navigate('/') } }, [user])
  useEffect(() => { if (user) loadConvs() }, [user])
  useEffect(() => { if (active) loadMsgs(active) }, [active])
  useEffect(() => { if (active) loadTx(active) }, [active])
  useEffect(() => { bottomRef.current?.scrollIntoView({behavior:'smooth'}) }, [msgs])
  const loadTx = async conv => {
    const { data: a } = await supabase.from('annonces').select('user_id').eq('id', conv.annonce_id).maybeSingle()
    const seller = a?.user_id
    if (!seller || (seller !== user.id && seller !== conv.otherId)) { setTxInfo(null); return }
    const buyer = seller === user.id ? conv.otherId : user.id
    const { data: t } = await supabase.from('transactions').select('*').eq('annonce_id', conv.annonce_id).eq('buyer_id', buyer).maybeSingle()
    setTxInfo({ amSeller: seller === user.id, tx: t || null })
  }
  const confirmTxMsg = async () => {
    const { error } = await supabase.rpc('confirm_transaction', { p_annonce: active.annonce_id, p_other: active.otherId })
    if (error) showToast('err', 'Erreur : '+error.message)
    else { showToast('ok', "C'est noté !"); loadTx(active) }
  }
  const loadConvs = async () => {
    const { data } = await supabase.from('messages').select('*,annonce:annonce_id(titre),sender:sender_id(username),receiver:receiver_id(username)').or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`).order('created_at',{ascending:false})
    const map = {}
    ;(data||[]).forEach(m => {
      const otherId = m.sender_id===user.id?m.receiver_id:m.sender_id
      const key = `${otherId}_${m.annonce_id}`
      if (!map[key]) map[key]={...m,otherId,otherName:m.sender_id===user.id?m.receiver?.username:m.sender?.username,unread:0}
      if (!m.lu&&m.receiver_id===user.id) map[key].unread++
    })
    setConvs(Object.values(map)); setLoading(false)
  }
  const loadMsgs = async conv => {
    const { data } = await supabase.from('messages').select('*,sender:sender_id(username)').or(`and(sender_id.eq.${user.id},receiver_id.eq.${conv.otherId}),and(sender_id.eq.${conv.otherId},receiver_id.eq.${user.id})`).eq('annonce_id',conv.annonce_id).order('created_at',{ascending:true})
    setMsgs(data||[])
    await supabase.from('messages').update({lu:true}).eq('receiver_id',user.id).eq('annonce_id',conv.annonce_id)
  }
  const send = async () => {
    if (!txt.trim()||!active) return
    await supabase.from('messages').insert({sender_id:user.id,receiver_id:active.otherId,annonce_id:active.annonce_id,contenu:txt.trim()})
    setTxt(''); loadMsgs(active); loadConvs()
  }
  if (!user) return null
  if (loading) return <div className="loader"><div className="spin"></div></div>
  return (
    <div className="section" style={{maxWidth:960,margin:'0 auto'}}>
      <h1 style={{fontFamily:'var(--fh)',fontSize:24,fontWeight:700,marginBottom:20,letterSpacing:'-.3px'}}>Messagerie</h1>
      <div className="msg-layout">
        <div className="msg-sidebar">
          {convs.length===0
            ? <div style={{padding:24,textAlign:'center',color:'var(--text3)',fontSize:13}}><i className="ti ti-message-off" style={{fontSize:32,display:'block',marginBottom:8}}></i>Aucun message</div>
            : convs.map((c,i)=>(
              <div key={i} className={`conv-item ${active?.otherId===c.otherId&&active?.annonce_id===c.annonce_id?'on':''}`} onClick={()=>setActive(c)}>
                <div className="conv-av">{c.otherName?.slice(0,2).toUpperCase()||'??'}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                    <div className="conv-name">{c.otherName}</div>
                    {c.unread>0&&<span className="unread-badge">{c.unread}</span>}
                  </div>
                  <div className="conv-preview">{c.annonce?.titre||'Annonce'}</div>
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
                <div className="conv-av" style={{width:34,height:34,fontSize:12}}>{active.otherName?.slice(0,2).toUpperCase()}</div>
                <div style={{flex:1}}><div style={{fontSize:13,fontWeight:600}}>{active.otherName}</div><div style={{fontSize:11,color:'var(--text3)'}}>{active.annonce?.titre}</div></div>
                {txInfo && (() => {
                  const t = txInfo.tx
                  const myConfirmed = t && (txInfo.amSeller ? t.seller_confirmed : t.buyer_confirmed)
                  if (t?.status === 'confirmed') return <span style={{fontSize:11,color:'var(--g)',fontWeight:700,display:'flex',alignItems:'center',gap:4,whiteSpace:'nowrap'}}><i className="ti ti-circle-check"></i> Vendu</span>
                  if (myConfirmed) return <span style={{fontSize:11,color:'var(--amber)',display:'flex',alignItems:'center',gap:4,whiteSpace:'nowrap'}}><i className="ti ti-clock"></i> En attente</span>
                  return <button className="btn btn-out" style={{fontSize:11,padding:'6px 10px',whiteSpace:'nowrap'}} onClick={confirmTxMsg}><i className="ti ti-check"></i> {txInfo.amSeller ? 'Confirmer la vente' : "J'ai acheté"}</button>
                })()}
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
      </div>
    </div>
  )
}
