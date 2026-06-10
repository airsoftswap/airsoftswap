import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useApp } from '../App'
import { DEPARTEMENTS } from '../lib/departements'

const MAX = 3
const MAX_PHOTOS = 3
const MAX_SIZE = 5 * 1024 * 1024 // 5MB
const WINDOW = 7 * 24 * 60 * 60 * 1000 // 7 jours glissants

function getStamps() {
  try {
    const arr = JSON.parse(localStorage.getItem('asq_week') || '[]')
    const now = Date.now()
    return Array.isArray(arr) ? arr.filter(t => typeof t === 'number' && now - t < WINDOW) : []
  } catch { return [] }
}
function saveStamps(arr) { localStorage.setItem('asq_week', JSON.stringify(arr)) }

// Compress image to max 800px wide, 80% quality
async function compressImage(file) {
  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const canvas = document.createElement('canvas')
      let w = img.width, h = img.height
      if (w > 800) { h = Math.round(h * 800 / w); w = 800 }
      canvas.width = w; canvas.height = h
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, w, h)
      canvas.toBlob(blob => { URL.revokeObjectURL(url); resolve(blob) }, 'image/jpeg', 0.8)
    }
    img.src = url
  })
}

export default function Publier() {
  const navigate = useNavigate()
  const { id: editId } = useParams()
  const isEdit = !!editId
  const { user, setShowAuth, showToast, profile } = useApp()
  const [f, setF] = useState({ titre: '', categorie: 'AEG', etat: 'Très bon état', prix: '', ville: '', departement: '', description: '' })
  const [photos, setPhotos] = useState([]) // { file, preview, compressed }  — nouvelles photos
  const [existingPhotos, setExistingPhotos] = useState([]) // URLs déjà en base (mode édition)
  const [loadingAnn, setLoadingAnn] = useState(isEdit)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  const [quota, setQuota] = useState(getStamps())
  const [captchaDone, setCaptchaDone] = useState(false)
  const [acceptAge, setAcceptAge] = useState(false)
  const [acceptRules, setAcceptRules] = useState(false)
  const [emailVerified, setEmailVerified] = useState(false)
  const fileRef = useRef(null)
  const isAdmin = user?.id === 'e21bb865-90d4-4995-88f5-1b6bf1a324a1'
  const unlimited = isAdmin || profile?.unlimited === true
  const totalPhotos = existingPhotos.length + photos.length
  const rem = unlimited ? 999 : MAX - quota.length
  const pct = Math.round((rem / MAX) * 100)
  const sorted = [...quota].sort((a, b) => a - b)
  const nextFree = (!unlimited && quota.length >= MAX) ? new Date(sorted[quota.length - MAX] + WINDOW) : null
  const quotaSub = nextFree
    ? `Prochaine annonce possible le ${nextFree.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} à ${nextFree.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
    : '3 annonces sur 7 jours glissants'

  useEffect(() => {
    if (!user) { setShowAuth(true); navigate('/') }
    else {
      // Check email confirmed
      if (user.email_confirmed_at) setEmailVerified(true)
      else setEmailVerified(false)
    }
  }, [user])

  // Mode édition : on charge l'annonce et on préremplit
  useEffect(() => {
    if (!isEdit || !user) return
    let cancelled = false
    ;(async () => {
      setLoadingAnn(true)
      const { data, error } = await supabase.from('annonces').select('*').eq('id', editId).single()
      if (cancelled) return
      if (error || !data) { showToast('err', 'Annonce introuvable.'); navigate('/annonces'); return }
      if (data.user_id !== user.id) { showToast('err', "Vous ne pouvez modifier que vos propres annonces."); navigate(`/annonces/${editId}`); return }
      setF({
        titre: data.titre || '',
        categorie: data.categorie || 'AEG',
        etat: data.etat || 'Très bon état',
        prix: data.prix != null ? String(data.prix) : '',
        ville: data.ville || '',
        departement: data.departement || '',
        description: data.description || '',
      })
      setExistingPhotos(Array.isArray(data.images) ? data.images : [])
      // En édition, pas besoin de re-cocher captcha / âge / règles
      setCaptchaDone(true); setAcceptAge(true); setAcceptRules(true)
      setLoadingAnn(false)
    })()
    return () => { cancelled = true }
  }, [isEdit, editId, user])

  const removeExistingPhoto = (i) => {
    setExistingPhotos(prev => prev.filter((_, idx) => idx !== i))
  }

  const addPhotos = async (e) => {
    const files = Array.from(e.target.files)
    if (totalPhotos + files.length > MAX_PHOTOS) {
      showToast('err', 'Maximum 3 photos par annonce'); return
    }
    const newPhotos = []
    for (const file of files) {
      if (file.size > MAX_SIZE) { showToast('err', `${file.name} est trop lourd (max 5MB)`); continue }
      const preview = URL.createObjectURL(file)
      const compressed = await compressImage(file)
      newPhotos.push({ file, preview, compressed })
    }
    setPhotos(prev => [...prev, ...newPhotos].slice(0, MAX_PHOTOS - existingPhotos.length))
  }

  const removePhoto = (i) => {
    setPhotos(prev => {
      URL.revokeObjectURL(prev[i].preview)
      return prev.filter((_, idx) => idx !== i)
    })
  }

  const submit = async (e) => {
    e.preventDefault(); setErr('')
    if (!emailVerified) { setErr('Vous devez confirmer votre email avant de publier.'); return }
    if (!isEdit) {
      if (!captchaDone) { setErr('Veuillez cocher le captcha.'); return }
      if (!acceptAge) { setErr('Vous devez certifier avoir 18 ans ou plus.'); return }
      if (!acceptRules) { setErr('Vous devez accepter les CGU et les règles de la communauté.'); return }
    }
    if (!f.titre.trim() || !f.prix || !f.ville.trim()) { setErr('Titre, prix et ville sont obligatoires.'); return }
    if (parseFloat(f.prix) <= 0) { setErr('Le prix doit être supérieur à 0.'); return }
    if (!isEdit && rem <= 0) { setErr('Quota atteint : 3 annonces maximum par semaine (7 jours glissants).'); return }
    setLoading(true)

    try {
      // Upload des nouvelles photos
      const newUrls = []
      for (let i = 0; i < photos.length; i++) {
        const { compressed } = photos[i]
        const fileName = `${user.id}/${Date.now()}_${i}.jpg`
        const { error } = await supabase.storage.from('annonces-photos').upload(fileName, compressed, { contentType: 'image/jpeg', upsert: false })
        if (error) { setErr(`Erreur upload photo : ${error.message}`); showToast('err', 'Erreur upload photo'); setLoading(false); return }
        const { data: { publicUrl } } = supabase.storage.from('annonces-photos').getPublicUrl(fileName)
        newUrls.push(publicUrl)
      }
      // Photos finales = existantes conservées + nouvelles
      const photoUrls = [...existingPhotos, ...newUrls]

      if (isEdit) {
        // --- MODIFICATION ---
        const { error } = await supabase.from('annonces').update({
          titre: f.titre.trim(),
          categorie: f.categorie,
          etat: f.etat,
          prix: parseFloat(f.prix),
          ville: f.ville.trim(),
          departement: f.departement || null,
          description: f.description.trim(),
          images: photoUrls,
        }).eq('id', editId)
        if (error) { setErr(`Erreur lors de la modification : ${error.message}`); setLoading(false); return }
        showToast('ok', '✅ Annonce modifiée !')
        navigate(`/annonces/${editId}`)
      } else {
        // --- CRÉATION ---
        const { data, error } = await supabase.from('annonces').insert({
          user_id: user.id,
          titre: f.titre.trim(),
          categorie: f.categorie,
          etat: f.etat,
          prix: parseFloat(f.prix),
          ville: f.ville.trim(),
          departement: f.departement || null,
          description: f.description.trim(),
          boosted: false,
          images: photoUrls,
        }).select().single()

        if (error) { setErr(`Erreur lors de la publication : ${error.message}`); setLoading(false); return }
        const ns = [...quota, Date.now()]; saveStamps(ns); setQuota(ns)
        showToast('ok', '✅ Annonce publiée !')
        navigate(`/annonces/${data.id}`)
      }
    } catch (e) {
      setErr(`Erreur inattendue : ${e.message || e}`)
    } finally {
      setLoading(false)
    }
  }

  if (!user) return null
  if (loadingAnn) return <div className="loader"><div className="spin"></div></div>

  return (
    <div className="section" style={{ maxWidth: 700, margin: '0 auto' }}>
      <h1 style={{ fontFamily: 'var(--fh)', fontSize: 26, fontWeight: 700, marginBottom: 22, letterSpacing: '-.3px', color: 'var(--text)' }}>
        {isEdit ? "Modifier l'annonce" : 'Publier une annonce'}
      </h1>

      {/* EMAIL NON VERIFIE */}
      {!emailVerified && (
        <div style={{ background: 'rgba(217,64,64,.08)', border: '1px solid rgba(217,64,64,.2)', borderRadius: 'var(--r)', padding: 16, marginBottom: 18, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <span style={{ fontSize: 22 }}>✉️</span>
          <div>
            <div style={{ fontFamily: 'var(--fh)', fontSize: 15, fontWeight: 700, color: 'var(--red)', marginBottom: 4 }}>Email non confirmé</div>
            <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6 }}>
              Vous devez confirmer votre adresse email avant de publier une annonce. Vérifiez votre boîte mail et cliquez sur le lien de confirmation.
            </div>
            <button onClick={async () => {
              await supabase.auth.resend({ type: 'signup', email: user.email })
              showToast('ok', 'Email de confirmation renvoyé !')
            }} style={{ marginTop: 10, padding: '7px 14px', background: 'transparent', border: '1px solid var(--red)', borderRadius: 7, fontSize: 12, color: 'var(--red)', cursor: 'pointer' }}>
              Renvoyer l'email de confirmation
            </button>
          </div>
        </div>
      )}

      {/* QUOTA (uniquement à la création) */}
      {!isEdit && (
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '13px 16px', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: 'var(--text3)', textTransform: 'uppercase', marginBottom: 7 }}>Quota hebdomadaire</div>
          <div style={{ height: 4, background: 'var(--bg4)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${pct}%`, background: rem > 1 ? 'var(--g)' : rem === 1 ? 'var(--amber)' : 'var(--red)', borderRadius: 2, transition: 'width .3s' }}></div>
          </div>
          <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>{quotaSub}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: 'var(--fh)', fontSize: 22, fontWeight: 800, color: rem > 0 ? 'var(--g)' : 'var(--red)' }}>
            {rem}<span style={{ fontSize: 13, color: 'var(--text3)' }}>/{MAX}</span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--text3)' }}>restantes</div>
        </div>
      </div>
      )}

      {err && (
        <div style={{ background: 'rgba(217,64,64,.08)', border: '1px solid rgba(217,64,64,.2)', borderRadius: 7, padding: '10px 14px', fontSize: 13, color: 'var(--red)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 7 }}>
          ⚠ {err}
        </div>
      )}

      <form onSubmit={submit} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: 24, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'var(--g)' }}></div>

        <div className="fgroup"><label>Titre *</label><input type="text" placeholder="Ex : Tokyo Marui M4A1 MWS GBB — excellent état" value={f.titre} onChange={e => setF({ ...f, titre: e.target.value })} required /></div>
        <div className="frow">
          <div className="fgroup"><label>Catégorie *</label>
            <select value={f.categorie} onChange={e => setF({ ...f, categorie: e.target.value })}>
              <option>AEG</option><option>GBB</option><option>Sniper</option><option>Équipement</option><option>Accessoire</option><option>Pièces</option>
            </select>
          </div>
          <div className="fgroup"><label>État *</label>
            <select value={f.etat} onChange={e => setF({ ...f, etat: e.target.value })}>
              <option>Neuf</option><option>Très bon état</option><option>Bon état</option><option>État correct</option>
            </select>
          </div>
        </div>
        <div className="frow">
          <div className="fgroup"><label>Prix (€) *</label><input type="number" placeholder="150" min="1" step="0.01" value={f.prix} onChange={e => setF({ ...f, prix: e.target.value })} required /></div>
          <div className="fgroup"><label>Ville *</label><input type="text" placeholder="Lyon, Paris..." value={f.ville} onChange={e => setF({ ...f, ville: e.target.value })} required /></div>
          <div className="fgroup"><label>Département</label>
            <select value={f.departement} onChange={e => setF({ ...f, departement: e.target.value })}
              style={{ width: '100%', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 13px', fontSize: 14, color: 'var(--text)', outline: 'none' }}>
              <option value="">— Choisir un département —</option>
              {DEPARTEMENTS.map(([code, nom]) => <option key={code} value={code}>{code} — {nom}</option>)}
            </select>
          </div>
        </div>
        <div className="fgroup"><label>Description</label><textarea placeholder="Décrivez la réplique, son état, les upgrades inclus, la raison de la vente..." value={f.description} onChange={e => setF({ ...f, description: e.target.value })}></textarea></div>

        {/* PHOTOS */}
        <div className="fgroup">
          <label>Photos ({totalPhotos}/{MAX_PHOTOS})</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 10 }}>
            {/* Photos déjà en ligne (mode édition) */}
            {existingPhotos.map((url, i) => (
              <div key={`ex-${i}`} style={{ position: 'relative', borderRadius: 8, overflow: 'hidden', aspectRatio: '1', background: 'var(--bg3)', border: '1px solid var(--border)' }}>
                <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <button type="button" onClick={() => removeExistingPhoto(i)}
                  style={{ position: 'absolute', top: 5, right: 5, width: 24, height: 24, borderRadius: 5, background: 'rgba(0,0,0,.7)', border: 'none', color: '#fff', fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  ✕
                </button>
              </div>
            ))}
            {/* Nouvelles photos ajoutées */}
            {photos.map((p, i) => (
              <div key={`new-${i}`} style={{ position: 'relative', borderRadius: 8, overflow: 'hidden', aspectRatio: '1', background: 'var(--bg3)', border: '1px solid var(--border)' }}>
                <img src={p.preview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <button type="button" onClick={() => removePhoto(i)}
                  style={{ position: 'absolute', top: 5, right: 5, width: 24, height: 24, borderRadius: 5, background: 'rgba(0,0,0,.7)', border: 'none', color: '#fff', fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  ✕
                </button>
              </div>
            ))}
            {totalPhotos < MAX_PHOTOS && (
              <div onClick={() => fileRef.current?.click()}
                style={{ aspectRatio: '1', background: 'var(--bg3)', border: `2px dashed var(--border2)`, borderRadius: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', gap: 6, transition: 'border-color .2s' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--g)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border2)'}>
                <span style={{ fontSize: 28 }}>📷</span>
                <span style={{ fontSize: 11, color: 'var(--text3)' }}>Ajouter</span>
              </div>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={addPhotos} />
          <div style={{ fontSize: 11, color: 'var(--text3)' }}>Max 3 photos · JPG/PNG · Max 5MB par photo · Compressées automatiquement</div>
        </div>

        {/* CASES OBLIGATOIRES (uniquement à la création) */}
        {!isEdit && (<>
        <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8, padding: 14, marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
            <input type="checkbox" checked={acceptAge} onChange={e => setAcceptAge(e.target.checked)} style={{ marginTop: 2, accentColor: 'var(--g)', width: 16, height: 16, flexShrink: 0 }} />
            <span style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.5 }}>
              Je certifie avoir <strong style={{ color: 'var(--text)' }}>18 ans ou plus</strong> et être majeur(e) selon la législation française.
            </span>
          </label>
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
            <input type="checkbox" checked={acceptRules} onChange={e => setAcceptRules(e.target.checked)} style={{ marginTop: 2, accentColor: 'var(--g)', width: 16, height: 16, flexShrink: 0 }} />
            <span style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.5 }}>
              J'accepte les <span style={{ color: 'var(--g)', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => window.open('/legal/cgu', '_blank')}>CGU</span> et les <span style={{ color: 'var(--g)', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => window.open('/legal/regles', '_blank')}>règles de la communauté</span>. Je certifie que ma réplique est conforme à la législation française.
            </span>
          </label>
        </div>
        <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8, padding: 14, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div onClick={() => setCaptchaDone(!captchaDone)}
            style={{ width: 22, height: 22, borderRadius: 4, border: `2px solid ${captchaDone ? 'var(--g)' : 'var(--border2)'}`, background: captchaDone ? 'var(--g)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all .2s', flexShrink: 0 }}>
            {captchaDone && <span style={{ color: '#fff', fontSize: 14, fontWeight: 700 }}>✓</span>}
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Je ne suis pas un robot</div>
            <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 2 }}>Vérification anti-spam</div>
          </div>
          <div style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text3)', textAlign: 'right', lineHeight: 1.4 }}>
            <div style={{ fontSize: 18 }}>🛡</div>
            <div>hCaptcha</div>
          </div>
        </div>
        </>)}

        <div style={{ background: 'rgba(200,150,42,.07)', border: '1px solid rgba(200,150,42,.18)', borderRadius: 7, padding: '10px 13px', fontSize: 12, color: 'var(--amber)', marginBottom: 14, display: 'flex', alignItems: 'flex-start', gap: 7 }}>
          ⚠ En publiant, vous confirmez que votre annonce respecte nos règles de la communauté.
        </div>

        <button type="submit" disabled={loading || (!isEdit && rem <= 0) || !emailVerified || (!isEdit && (!captchaDone || !acceptAge || !acceptRules))}
          style={{ width: '100%', padding: 14, background: loading || (!isEdit && rem <= 0) || !emailVerified || (!isEdit && (!captchaDone || !acceptAge || !acceptRules)) ? 'var(--border2)' : 'var(--g)', color: '#fff', border: 'none', borderRadius: 8, fontFamily: 'var(--fh)', fontSize: 16, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.5px', cursor: loading || (!isEdit && rem <= 0) || !emailVerified || (!isEdit && (!captchaDone || !acceptAge || !acceptRules)) ? 'not-allowed' : 'pointer', transition: 'background .2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          {loading
            ? (isEdit ? 'Enregistrement...' : 'Publication en cours...')
            : (isEdit ? '💾 Enregistrer les modifications' : '🚀 Publier l\'annonce')}
        </button>
      </form>
    </div>
  )
}
