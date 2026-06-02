import React, { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useApp } from '../App'
const FAKE=[
  {id:'f1',username:'Tactical31',text:'Salut tout le monde ! 👋',created_at:new Date(Date.now()-300000).toISOString()},
  {id:'f2',username:'SnipFR',text:'Je viens de poster une VSR-10 upgradée si ça intéresse',created_at:new Date(Date.now()-240000).toISOString()},
  {id:'f3',username:'Max_92',text:"Nice ! C'est quoi les upgrades ?",created_at:new Date(Date.now()-180000).toISOString()},
  {id:'f4',username:'AirsoftPro13',text:'Vous connaissez des bons terrains à Lyon ?',created_at:new Date(Date.now()-120000).toISOString()},
  {id:'f5',username:'Soldier75',text:'Le terrain de Décines est top, accès facile 🎯',created_at:new Date(Date.now()-60000).toISOString()},
]
export default function ChatLive() {
  const { user, setShowAuth, profile } = useApp(); const navigate = useNavigate()
  const [msgs, setMsgs] = useState(FAKE); const [txt, setTxt] = useState('')
  const [online] = useState(Math.floor(Math.random()*20)+8); const bottomRef = useRef(null)
  useEffect(() => {
    loadMsgs()
    const ch = supabase.channel('chat-general').on('postgres_changes',{event:'INSERT',schema:'public',table:'chat_messages'},payload=>{
      setMsgs(prev=>[...prev,payload.new])
    }).subscribe()
    return () => supabase.removeChannel(ch)
  }, [])
  useEffect(() => { bottomRef.current?.scrollIntoView({behavior:'smooth'}) }, [msgs])
  const loadMsgs = async () => {
    const { data } = await supabase.from('chat_messages').select('*').order('created_at',{ascending:true}).limit(100)
    if (data&&data.length>0) setMsgs([...FAKE,...data])
  }
  const send = async () => {
    if (!user) { setShowAuth(true); return }
    if (!txt.trim()) return
    const username = profile?.username||user.email?.split('@')[0]||'Anonyme'
    const { error } = await supabase.from('chat_messages').insert({user_id:user.id,username,text:txt.trim()})
    if (!error) { setMsgs(prev=>[...prev,{id:Date.now(),username,text:txt.trim(),created_at:new Date().toISOString()}]); setTxt('') }
  }
  const ago = d => { const s=Math.floor((Date.now()-new Date(d))/1000); if(s<60) return 'à l\'instant'; if(s<3600) return `${Math.floor(s/60)}min`; return new Date(d).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'}) }
  return (
    <div className="section" style={{maxWidth:820,margin:'0 auto'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20}}>
        <h1 style={{fontFamily:'var(--fh)',fontSize:24,fontWeight:700,letterSpacing:'-.3px'}}>Chat Communautaire</h1>
        <div style={{fontSize:12,color:'var(--text3)',display:'flex',alignItems:'center',gap:6}}>
          <div style={{width:7,height:7,borderRadius:'50%',background:'var(--green)',boxShadow:'0 0 5px var(--green)'}}></div>
          {online} en ligne
        </div>
      </div>
      <div className="chat-wrap">
        <div className="chat-head">
          <div className="chat-live-dot"></div>
          <span style={{fontFamily:'var(--fh)',fontSize:14,fontWeight:600}}>#général</span>
          <span style={{fontSize:12,color:'var(--text3)'}}>— Salon communautaire AirsoftSwap</span>
          <div style={{marginLeft:'auto',fontSize:12,color:'var(--text3)',display:'flex',alignItems:'center',gap:5}}><i className="ti ti-users"></i>{online} en ligne</div>
        </div>
        <div className="chat-msgs">
          {msgs.map(m=>(
            <div key={m.id} className="chat-msg">
              <div className="chat-msg-av">{(m.username||'?').slice(0,2).toUpperCase()}</div>
              <div>
                <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:3}}>
                  <span className="chat-msg-name" style={{cursor:m.user_id?'pointer':'default'}} onClick={()=>m.user_id&&navigate(`/profil/${m.user_id}`)}>{m.username||'Anonyme'}</span>
                  <span className="chat-msg-time">{ago(m.created_at)}</span>
                </div>
                <span className="chat-msg-txt">{m.text||m.contenu}</span>
              </div>
            </div>
          ))}
          <div ref={bottomRef}></div>
        </div>
        <div className="chat-input-row">
          {user ? (
            <>
              <input value={txt} onChange={e=>setTxt(e.target.value)} onKeyDown={e=>e.key==='Enter'&&!e.shiftKey&&send()} placeholder="Écrivez un message..." maxLength={500} />
              <button className="btn btn-acc" style={{padding:'9px 16px'}} onClick={send}><i className="ti ti-send"></i></button>
            </>
          ) : (
            <button className="btn btn-out" style={{width:'100%',justifyContent:'center'}} onClick={()=>setShowAuth(true)}><i className="ti ti-login"></i>Connectez-vous pour participer</button>
          )}
        </div>
      </div>
      <div style={{marginTop:12,padding:'11px 14px',background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:'var(--r2)',fontSize:12,color:'var(--text3)',display:'flex',gap:7}}>
        <i className="ti ti-info-circle" style={{color:'var(--acc)',flexShrink:0,marginTop:1}}></i>
        Restez respectueux. Les échanges commerciaux se font via les annonces.
      </div>
    </div>
  )
}
