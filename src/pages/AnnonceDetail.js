import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useApp } from '../App'

const EMOJI = { AEG:'🔫',GBB:'🔫',Sniper:'🎯',Équipement:'🦺',Accessoire:'🔭',Pièces:'⚙️' }
const ETAT = {'Neuf':'b-neuf','Très bon état':'b-tbe','Bon état':'b-be','État correct':'b-ec'}

export default function AnnonceDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, setShowAuth, showToast, favs, toggleFav } = useApp()
  const [ann, setAnn] = useState(null)
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState('')
  const [msgSent, setMsgSent] = useState(false)
  const [sending, setSending] = useState(false)
  const [showSignal, setShowSignal] = useState(false)
  const [activePhoto, setActivePhoto] = useState(0)
  const [signalReason, setSignalReason] = useState('Arnaque / Faux produit')
  const [sellerAvis, setSellerAvis] = useState(0)
  const [sellerPct, setSellerPct] = useState(null)
  const [sellerNote, setSellerNote] = useState(0)

  useEffect(() => { load() }, [id, user])

  const load = async () => {
    const { data } = await supabase.from('annonces')
      .select('*, profiles(id,username,note_moyenne,nb_ventes,created_at,ville,avatar_url)')
      .eq('id', id).single()
    if (data && data.supprimee) { setAnn(null); setLoading(false); return }
    setAnn(data); setLoading(false)
    if (data?.user_id) {
      const { data: avd } = await supabase.from('avis').select('note').eq('cible_id', data.user_id)
      setSellerAvis(avd?.length || 0)
      setSellerNote(avd && avd.length ? avd.reduce((s,a)=>s+(a.note||0),0)/avd.length : 0)
      setSellerPct(avd && avd.length ? Math.round(avd.filter(a=>a.note>=4).length/avd.length*100) : null)
    }
  }

  const sendMsg = async () => {
    if (!user) { setShowAuth(true); return }
    if (!msg.trim()) return
    setSending(true)
    const { error } = await supabase.from('messages').insert({
      sender_id: user.id, receiver_id: ann.user_id, annonce_id: ann.id, contenu: msg.trim()
    })
    if (!error) { setMsgSent(true); setMsg(''); showToast('ok', 'Message envoyé !') }
    else showToast('err', 'Erreur : ' + error.message)
    setSending(false)
  }

  const deleteAnn = async () => {
    if (!window.confirm("Supprimer cette annonce ? Elle ne sera plus visible publiquement, mais vos conversations et évaluations liées restent conservées.")) return
    const { error } = await supabase.from('annonces').update({ supprimee: true }).eq('id', id)
    if (error) { showToast('err', "Suppression impossible : " + error.message) ; return }
    showToast('ok', 'Annonce supprimée.')
    navigate('/annonces')
  }

  if (loading) return <div className="loader"><div className="spin"></div></div>
  if (!ann) return <div className="empty"><i className="ti ti-ghost"></i><p>Annonce introuvable.</p></div>

  const isOwner = user?.id === ann.user_id
  const isAdmin = user?.id === 'e21bb865-90d4-4995-88f5-1b6bf1a324a1' || user?.email === 'gamerscss@yahoo.fr'
  const isFav = favs.includes(ann.id)
  const memberYear = ann.profiles?.created_at ? new Date(ann.profiles.created_at).toLocaleDateString('fr-FR',{month:'long',year:'numeric'}) : '?'
  const hasPhotos = ann.images && ann.images.length > 0

  return (
    <div className="section" style={{ maxWidth: 1060, margin: '0 auto' }}>
      {showSignal && (
        <div className="overlay show" onClick={() => setShowSignal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowSignal(false)}><i className="ti ti-x"></i></button>
            <div className="modal-title">Signaler cette annonce</div>
            <div className="modal-sub">Aidez-nous à garder la communauté saine.</div>
            <div className="fgroup"><label>Raison</label>
              <select value={signalReason} onChange={e => setSignalReason(e.target.value)} style={{ width:'100%',background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:8,padding:'10px 13px',fontSize:14,color:'var(--text)',outline:'none' }}>
                <option>Arnaque / Faux produit</option>
                <option>Prix abusif</option>
                <option>Annonce en double</option>
                <option>Produit illégal</option>
                <option>Autre</option>
              </select>
            </div>
            <button className="btn btn-danger btn-block" onClick={async () => {
              if (!user) { setShowSignal(false); setShowAuth(true); return }
              const { error } = await supabase.from('signalements').insert({
                annonce_id: ann.id, annonce_titre: ann.titre, raison: signalReason, reporter_id: user.id
              })
              if (error) showToast('err', "Échec de l'envoi du signalement.")
              else showToast('ok', 'Signalement envoyé. Merci !')
              setShowSignal(false)
            }}>
              Envoyer le signalement
            </button>
          </div>
        </div>
      )}

      <button onClick={() => navigate(-1)} style={{ background:'none',border:'none',color:'var(--text3)',fontSize:13,display:'flex',alignItems:'center',gap:6,marginBottom:24,cursor:'pointer' }}>
        <i className="ti ti-arrow-left"></i> Retour
      </button>

      <div className="det-grid">
        {/* LEFT */}
        <div>
          {/* PHOTO PRINCIPALE */}
          <div style={{ height: 320, background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:10,overflow:'hidden',marginBottom:10,display:'flex',alignItems:'center',justifyContent:'center',position:'relative' }}>
            {hasPhotos ? (
              <img src={ann.images[activePhoto]} alt={ann.titre} style={{ width:'100%',height:'100%',objectFit:'contain' }} />
            ) : (
              <span style={{ fontSize: 100 }}>{EMOJI[ann.categorie] || '🔫'}</span>
            )}
            {/* FAV btn */}
            <button className={`fav-btn ${isFav ? 'on' : ''}`} style={{ position:'absolute',top:10,right:10 }} onClick={() => toggleFav(ann.id)}>
              <i className={`ti ${isFav?'ti-heart-filled':'ti-heart'}`} style={{ fontSize:14,color:isFav?'var(--red)':'var(--text3)' }}></i>
            </button>
            {!isOwner && (
              <button onClick={() => setShowSignal(true)} title="Signaler cette annonce"
                style={{ position:'absolute',top:10,left:10,background:'rgba(217,64,64,.15)',border:'1px solid rgba(217,64,64,.5)',color:'var(--red)',fontSize:12,fontWeight:700,padding:'7px 12px',borderRadius:8,cursor:'pointer',display:'flex',alignItems:'center',gap:5 }}>
                <i className="ti ti-flag"></i> Signaler
              </button>
            )}
          </div>

          {/* THUMBNAILS */}
          {hasPhotos && ann.images.length > 1 && (
            <div style={{ display:'flex',gap:8,marginBottom:18 }}>
              {ann.images.map((img, i) => (
                <div key={i} onClick={() => setActivePhoto(i)}
                  style={{ width:72,height:72,borderRadius:7,overflow:'hidden',cursor:'pointer',border:`2px solid ${activePhoto===i?'var(--g)':'var(--border)'}`,transition:'border-color .15s',flexShrink:0 }}>
                  <img src={img} alt="" style={{ width:'100%',height:'100%',objectFit:'cover' }} />
                </div>
              ))}
            </div>
          )}

          <div style={{ display:'flex',gap:8,marginBottom:12,flexWrap:'wrap',alignItems:'center' }}>
            <span className={`badge ${ETAT[ann.etat]||'b-be'}`}>{ann.etat}</span>
            <span style={{ fontSize:12,color:'var(--text3)' }}>{ann.categorie}</span>
          </div>
          <h1 style={{ fontFamily:'var(--fh)',fontSize:28,fontWeight:700,letterSpacing:'-.3px',marginBottom:8,lineHeight:1.1,color:'var(--text)' }}>{ann.titre}</h1>
          <div style={{ fontFamily:'var(--fh)',fontSize:36,fontWeight:800,color:'var(--g)',marginBottom:12 }}>{Number(ann.prix).toFixed(2)} €</div>
          {ann.sold_at && (
            <div style={{ display:'inline-flex',alignItems:'center',gap:6,background:'var(--red)',color:'#fff',fontFamily:'var(--fh)',fontWeight:800,fontSize:13,letterSpacing:1,textTransform:'uppercase',padding:'4px 12px',borderRadius:6,marginBottom:14 }}>
              <i className="ti ti-circle-check"></i> Vendu
            </div>
          )}
          {isOwner && ann.sold_at && (
            <div style={{ background:'rgba(217,64,64,.12)',border:'1px solid var(--red)',borderRadius:10,padding:14,marginBottom:16 }}>
              <div style={{ fontWeight:700,color:'var(--text)',marginBottom:4 }}>🎉 Bravo, c'est vendu !</div>
              <div style={{ fontSize:13,color:'var(--text2)',marginBottom:12 }}>Vous pouvez supprimer cette annonce dès maintenant. Sinon, elle sera retirée automatiquement dans les 24 heures.</div>
              <button className="btn btn-danger" onClick={deleteAnn}><i className="ti ti-trash"></i> Supprimer maintenant</button>
            </div>
          )}
          <div style={{ display:'flex',gap:18,color:'var(--text3)',fontSize:13,marginBottom:22 }}>
            <span><i className="ti ti-map-pin"></i> {ann.ville||'France'}</span>
            <span><i className="ti ti-calendar"></i> {new Date(ann.created_at).toLocaleDateString('fr-FR')}</span>
          </div>
          <div style={{ background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:10,padding:18,marginBottom:16 }}>
            <div style={{ fontFamily:'var(--fh)',fontSize:14,fontWeight:600,marginBottom:10,display:'flex',alignItems:'center',gap:7,color:'var(--text)' }}>
              <i className="ti ti-file-description" style={{ color:'var(--g)' }}></i>Description
            </div>
            <p style={{ fontSize:13,color:'var(--text2)',lineHeight:1.8,whiteSpace:'pre-wrap' }}>{ann.description||'Aucune description.'}</p>
          </div>
          <div style={{ display:'flex',gap:10,flexWrap:'wrap' }}>
            {isOwner && <button className="btn btn-out" onClick={() => navigate(`/publier/${ann.id}`)}><i className="ti ti-edit"></i>Modifier</button>}
            {isOwner && <button className="btn btn-danger" onClick={deleteAnn}><i className="ti ti-trash"></i>Supprimer</button>}
            {!isOwner && isAdmin && <button className="btn btn-danger" onClick={deleteAnn}><i className="ti ti-shield-x"></i>Supprimer (admin)</button>}
          </div>
        </div>

        {/* RIGHT */}
        <div style={{ display:'flex',flexDirection:'column',gap:14 }}>
          {/* VENDEUR — Modèle B */}
          <div style={{ background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:12,padding:18,position:'relative',overflow:'hidden' }}>
            <div style={{ position:'absolute',top:0,left:0,right:0,height:2,background:'linear-gradient(90deg,var(--g),transparent)' }}></div>
            <div style={{ display:'flex',alignItems:'center',gap:12 }}>
              <div style={{ width:54,height:54,borderRadius:'50%',border:'2px solid var(--g)',overflow:'hidden',background:'var(--gs)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,fontWeight:700,color:'var(--g)',fontFamily:'var(--fh)',flexShrink:0 }}>
                {ann.profiles?.avatar_url
                  ? <img src={ann.profiles.avatar_url} alt={ann.profiles?.username} style={{ width:'100%',height:'100%',objectFit:'cover' }} />
                  : (ann.profiles?.username?.slice(0,2).toUpperCase()||'??')}
              </div>
              <div style={{ flex:1,minWidth:0 }}>
                <div style={{ fontFamily:'var(--fh)',fontSize:18,fontWeight:700,color:'var(--text)' }}>{ann.profiles?.username}</div>
                <div style={{ fontSize:11,color:'var(--text3)',display:'flex',alignItems:'center',gap:4,marginTop:2 }}><i className="ti ti-calendar" style={{fontSize:12}}></i> Membre depuis {memberYear}</div>
              </div>
            </div>
            <div style={{ background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:9,padding:'10px',textAlign:'center',marginTop:12 }}>
              {sellerAvis > 0 ? (
                <>
                  <div style={{ color:'var(--amber)',fontSize:16,letterSpacing:1 }}>{'★'.repeat(Math.round(sellerNote))}{'☆'.repeat(5-Math.round(sellerNote))}</div>
                  <div style={{ fontSize:13,marginTop:2 }}><b>{Number(sellerNote).toFixed(1)}</b> <span style={{ color:'var(--text3)' }}>· {sellerAvis} avis{sellerPct!=null?` · ${sellerPct}% positifs`:''}</span></div>
                </>
              ) : <div style={{ color:'var(--text3)',fontSize:13 }}>Nouveau vendeur · pas encore d'avis</div>}
            </div>
            <div style={{ display:'flex',gap:8,marginTop:10 }}>
              {[{v:ann.profiles?.nb_ventes||0,l:'Ventes'},{v:sellerAvis,l:'Avis'}].map((s,i)=>(
                <div key={i} style={{ flex:1,background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:8,padding:'9px',textAlign:'center' }}>
                  <div style={{ fontFamily:'var(--fh)',fontSize:18,fontWeight:800,color:'var(--g)',lineHeight:1 }}>{s.v}</div>
                  <div style={{ fontSize:10,color:'var(--text3)',marginTop:2 }}>{s.l}</div>
                </div>
              ))}
            </div>
            <div style={{ display:'flex',alignItems:'center',gap:10,background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:8,padding:'10px 12px',marginTop:10 }}>
              <i className="ti ti-shield-check" style={{ fontSize:22,color:'#A3E635',flexShrink:0 }}></i>
              <div style={{ fontFamily:'var(--fh)',fontSize:13,fontWeight:800,textTransform:'uppercase',letterSpacing:'.5px',color:'#A3E635' }}>Vendeur confirmé</div>
            </div>
            <button className="btn btn-out" style={{ width:'100%',justifyContent:'center',padding:10,fontSize:12,marginTop:12 }} onClick={() => navigate(`/profil/${ann.user_id}`)}>
              Voir le profil complet
            </button>
          </div>

          {/* CONTACT */}
          {!isOwner && (
            <div style={{ background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:10,padding:18 }}>
              <div style={{ fontFamily:'var(--fh)',fontSize:14,fontWeight:600,marginBottom:13,display:'flex',alignItems:'center',gap:7,color:'var(--text)' }}>
                <i className="ti ti-message" style={{ color:'var(--g)' }}></i>Contacter le vendeur
              </div>
              {msgSent ? (
                <div style={{ textAlign:'center',padding:'20px 0' }}>
                  <i className="ti ti-circle-check" style={{ fontSize:40,color:'var(--g)',display:'block',marginBottom:10 }}></i>
                  <div style={{ fontFamily:'var(--fh)',fontSize:15,fontWeight:600,color:'var(--g)' }}>Message envoyé !</div>
                  <div style={{ fontSize:12,color:'var(--text3)',marginTop:6 }}>Retrouvez-le dans Messagerie.</div>
                </div>
              ) : (
                <>
                  <textarea value={msg} onChange={e => setMsg(e.target.value)}
                    placeholder={`Bonjour, je suis intéressé par "${ann.titre}"...`}
                    style={{ width:'100%',height:95,background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:8,padding:'10px 13px',fontSize:13,color:'var(--text)',resize:'vertical',fontFamily:'var(--fb)',marginBottom:10,outline:'none' }}></textarea>
                  <button className="btn btn-acc btn-block" onClick={sendMsg} disabled={sending}>
                    <i className="ti ti-send"></i>{sending?'Envoi...':'Envoyer un message'}
                  </button>
                  {!user && <div style={{ fontSize:12,color:'var(--text3)',textAlign:'center',marginTop:8 }}>Connectez-vous pour contacter</div>}
                </>
              )}
            </div>
          )}

          {/* CONSEIL */}
          <div style={{ background:'rgba(200,150,42,.05)',border:'1px solid rgba(200,150,42,.15)',borderRadius:9,padding:14 }}>
            <div style={{ fontSize:11,fontWeight:600,color:'var(--amber)',marginBottom:7,display:'flex',alignItems:'center',gap:5 }}>
              <i className="ti ti-shield"></i>Conseils sécurité
            </div>
            <ul style={{ fontSize:12,color:'var(--text3)',lineHeight:1.9,paddingLeft:16 }}>
              <li>Privilégiez la remise en main propre</li>
              <li>Vérifiez le profil et les avis du vendeur</li>
              <li>Ne payez jamais par virement à l'avance</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
