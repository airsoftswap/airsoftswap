import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'

const PAGES = {
  'cgu': {
    title: "Conditions Générales d'Utilisation",
    content: `## 1. Objet et présentation du service
AirsoftSwap (ci-après "le Site") est une plateforme de petites annonces en ligne permettant la mise en relation entre particuliers souhaitant acheter, vendre ou échanger du matériel airsoft d'occasion. Le Site est édité à titre non professionnel et non commercial par une personne physique agissant en qualité de particulier.

## 2. Acceptation des CGU
L'utilisation du Site implique l'acceptation pleine et entière des présentes CGU. L'éditeur se réserve le droit de les modifier à tout moment. Les utilisateurs sont invités à les consulter régulièrement. Toute utilisation du Site après modification vaut acceptation des nouvelles CGU.

## 3. Accès au service
L'accès au Site est gratuit. Une inscription avec email valide est requise pour publier une annonce. L'éditeur ne saurait être tenu responsable d'une interruption d'accès pour raison de maintenance, de problème technique ou de force majeure.

## 4. Rôle du Site — Simple mise en relation
AirsoftSwap est une plateforme de mise en relation entre particuliers. Le Site n'est en aucun cas partie prenante des transactions entre utilisateurs. Il n'intervient pas dans les négociations, la livraison, le paiement ni dans aucune autre étape de la transaction. L'éditeur du Site n'est ni vendeur, ni acheteur, ni courtier.

## 5. Responsabilité des utilisateurs
### 5.1 Contenu des annonces
Chaque utilisateur est seul responsable du contenu qu'il publie sur le Site. Il garantit que ses annonces sont sincères, exactes et conformes à la législation en vigueur. Toute annonce mensongère, frauduleuse ou illégale est strictement interdite et engage la seule responsabilité de son auteur.

### 5.2 Conformité légale
Les utilisateurs s'engagent à respecter la législation française relative aux répliques airsoft, notamment la loi du 6 mars 2012 et le décret du 30 juillet 2013. Il est strictement interdit de vendre des répliques dont la puissance dépasse les seuils légaux, de vendre à des mineurs de moins de 18 ans, et de vendre des répliques non conformes à la réglementation française.

### 5.3 Transactions
Les transactions sont conclues directement entre les utilisateurs, sous leur seule et entière responsabilité. L'éditeur du Site n'est pas garant de la bonne exécution des transactions, de l'état des articles vendus, ni de la solvabilité des utilisateurs.

## 6. Limitation de responsabilité de l'éditeur
### 6.1 Exclusion générale
L'éditeur du Site décline expressément toute responsabilité concernant les transactions réalisées entre utilisateurs, les litiges entre acheteurs et vendeurs, la conformité, l'état ou l'authenticité des articles mis en vente, les préjudices directs ou indirects résultant de l'utilisation du Site, les informations erronées publiées par les utilisateurs.

### 6.2 Disponibilité du Site
L'éditeur ne garantit pas la disponibilité permanente du Site et ne saurait être tenu responsable d'une interruption de service, quelle qu'en soit la cause.

### 6.3 Force majeure
La responsabilité de l'éditeur ne pourra pas être engagée en cas de force majeure ou d'événements indépendants de sa volonté.

## 7. Contenu interdit
Sont strictement interdits sur le Site : la vente de répliques non conformes à la réglementation française, la vente à des mineurs, toute forme de fraude ou escroquerie, le harcèlement ou les insultes envers d'autres membres, la publication de fausses annonces, tout contenu illicite ou contraire aux bonnes mœurs.

## 8. Signalement et modération
L'éditeur se réserve le droit de supprimer sans préavis toute annonce ou tout compte ne respectant pas les présentes CGU. L'éditeur n'est toutefois pas tenu d'une obligation de surveillance du contenu publié par les utilisateurs.

## 9. Propriété intellectuelle
Le Site et son contenu (design, logo, textes) sont protégés par le droit d'auteur. Toute reproduction sans autorisation est interdite. Les annonces restent la propriété de leurs auteurs.

## 10. Liens externes et partenaires
Le Site peut afficher des bannières ou des liens vers des sites tiers (partenaires, soutiens, pages externes, réseaux sociaux). En cliquant sur ces éléments, l'utilisateur quitte AirsoftSwap. L'éditeur n'exerce aucun contrôle sur ces sites tiers et décline toute responsabilité quant à leur contenu, leurs produits ou services, ainsi que leur politique de confidentialité et de gestion des données. Il appartient à l'utilisateur de consulter les conditions propres à ces sites. La présence d'un lien ou d'une bannière ne constitue ni une garantie, ni une approbation du site tiers concerné par l'éditeur.

## 11. Droit applicable
Les présentes CGU sont soumises au droit français. Tout litige sera soumis aux tribunaux compétents du ressort de l'éditeur.

## 12. Contact
airsoftswap@proton.me — Réponse sous 48h ouvrées.`
  },

  'mentions-legales': {
    title: 'Mentions Légales',
    content: `## Éditeur du Site
Le Site AirsoftSwap est édité par une personne physique agissant à titre strictement personnel et non professionnel, conformément à l'article 6-III de la loi n°2004-575 du 21 juin 2004 pour la confiance dans l'économie numérique (LCEN).

Contact : airsoftswap@proton.me

Conformément à l'article 6-III-2 de la LCEN, les coordonnées personnelles de l'éditeur ont été communiquées à l'hébergeur du Site et peuvent être communiquées aux autorités judiciaires compétentes sur requête. Elles ne sont pas rendues publiques afin de préserver la vie privée de l'éditeur, conformément aux dispositions applicables aux personnes physiques éditant un site à titre non professionnel.

## Hébergement
Le Site est hébergé par :
Netlify, Inc.
512 2nd Street, Suite 200
San Francisco, CA 94107, États-Unis
www.netlify.com

Le nom de domaine airsoftswap.fr est enregistré auprès d'OVH SAS (2 rue Kellermann, 59100 Roubaix, France).

## Propriété intellectuelle
L'ensemble des éléments constituant le Site (design, logo, textes, code source) est protégé par le droit d'auteur et reste la propriété exclusive de l'éditeur. Toute reproduction, représentation ou diffusion, totale ou partielle, sans autorisation expresse est interdite et constitue une contrefaçon sanctionnée par le Code de la propriété intellectuelle.

## Responsabilité
L'éditeur s'efforce d'assurer l'exactitude des informations présentes sur le Site mais ne peut garantir leur exhaustivité. L'éditeur ne saurait être tenu responsable des dommages directs ou indirects résultant de l'utilisation du Site ou des transactions conclues entre utilisateurs.

## Droit applicable
Le Site est soumis au droit français. Tout litige relatif à son utilisation sera soumis à la compétence exclusive des tribunaux français.`
  },

  'confidentialite': {
    title: 'Politique de Confidentialité',
    content: `## 1. Responsable du traitement
AirsoftSwap — Contact : airsoftswap@proton.me

## 2. Données collectées
Dans le cadre de l'utilisation du Site, les données suivantes peuvent être collectées : adresse email (lors de l'inscription), pseudo choisi librement par l'utilisateur, contenu des annonces publiées (y compris la ville et le département indiqués par le vendeur), messages échangés entre utilisateurs, adresse IP (collectée automatiquement par l'hébergeur), données de navigation anonymisées de mesure d'audience (uniquement en cas de consentement aux cookies).

Aucune donnée sensible (nom, prénom, adresse postale, numéro de téléphone) n'est obligatoire pour utiliser le Site.

## 3. Finalités du traitement
Les données collectées sont utilisées exclusivement pour : la gestion des comptes utilisateurs, l'affichage des annonces, la messagerie interne entre membres, la sécurité et la prévention des fraudes.

## 4. Durée de conservation
Les données sont conservées pendant toute la durée d'activité du compte. En cas de suppression du compte, les données personnelles sont effacées dans un délai de 30 jours.

## 5. Partage des données
Aucune donnée personnelle n'est vendue ni louée. Vos données sont hébergées et traitées par des prestataires techniques (sous-traitants) agissant pour le compte du Site : Supabase (hébergement de la base de données et authentification), l'hébergeur du Site, Resend (envoi des emails transactionnels) et, sous réserve de votre consentement, Google Analytics (mesure d'audience). Certains de ces prestataires peuvent traiter des données hors Union européenne ; ces transferts sont encadrés par les clauses contractuelles types de la Commission européenne. En dehors de ces sous-traitants, les données ne sont transmises qu'aux autorités judiciaires compétentes sur réquisition légale.

## 6. Sécurité
Des mesures techniques et organisationnelles appropriées sont mises en place pour protéger vos données contre tout accès non autorisé, perte ou altération.

## 7. Vos droits (RGPD)
Conformément au Règlement Général sur la Protection des Données (RGPD) et à la loi Informatique et Libertés, vous disposez des droits suivants : droit d'accès à vos données, droit de rectification, droit à l'effacement ("droit à l'oubli"), droit à la limitation du traitement, droit à la portabilité, droit d'opposition.

Pour exercer ces droits, contactez-nous à : airsoftswap@proton.me

En cas de réclamation, vous pouvez saisir la CNIL (Commission Nationale de l'Informatique et des Libertés) : www.cnil.fr

## 8. Cookies
Le Site utilise des cookies strictement nécessaires à son fonctionnement (session utilisateur, authentification), qui ne requièrent pas de consentement. Il utilise également, **uniquement après recueil de votre consentement**, des cookies de mesure d'audience via Google Analytics, destinés à analyser la fréquentation du Site de façon anonymisée. Vous pouvez accepter ou refuser ces cookies via le bandeau affiché à votre première visite, et modifier votre choix à tout moment. En cas de refus, aucun cookie de mesure d'audience n'est déposé.`
  },

  'regles': {
    title: 'Règles de la Communauté',
    content: `## Préambule
Ces règles ont pour objectif de garantir un environnement sain, respectueux et sécurisé pour tous les membres de la communauté AirsoftSwap.

## 1. Respect mutuel
Tout comportement irrespectueux, insultant, harcelant ou discriminatoire est strictement interdit. Cela inclut les messages privés, les commentaires sur les annonces et le chat communautaire.

## 2. Honnêteté et transparence
Chaque vendeur s'engage à décrire honnêtement l'état de ses articles, à fournir des photos réelles et récentes, à indiquer tous les défauts connus de l'article, et à respecter le prix affiché.

## 3. Conformité légale
Il est interdit de vendre des répliques non conformes à la législation française, de vendre à des personnes mineures (moins de 18 ans), de vendre des répliques dont la puissance dépasse les seuils légaux, et de vendre des articles volés ou contrefaits.

## 4. Sécurité des transactions
Il est fortement recommandé de privilégier la remise en main propre, de ne jamais envoyer de paiement avant de voir l'article, d'utiliser la messagerie interne du Site pour conserver une trace des échanges, et de vérifier le profil et les avis du vendeur avant toute transaction.

## 5. Contenu des annonces
Sont interdits : les fausses annonces, les doublons d'annonces, les prix abusivement gonflés, les annonces hors sujet (non lié à l'airsoft), et les annonces à caractère publicitaire ou commercial professionnel sans déclaration.

## 6. Sanctions
Le non-respect de ces règles entraîne selon la gravité : un avertissement, une suspension temporaire du compte, ou un bannissement définitif. L'éditeur se réserve le droit de supprimer toute annonce ou compte sans préavis en cas de violation grave des présentes règles.`
  },

  'comment-ca-marche': {
    title: 'Comment ça marche ?',
    content: `## 1. Créez votre compte gratuitement
Inscrivez-vous avec votre email. Confirmez votre adresse email pour activer votre compte. Choisissez un pseudo — aucune information personnelle obligatoire. Mot de passe oublié ? Un lien de réinitialisation vous est envoyé par email.

## 2. Publiez une annonce
Remplissez le formulaire en moins de 2 minutes. Ajoutez jusqu'à 3 photos de votre article. Fixez votre prix librement. Quota de 3 annonces gratuites par semaine (sur 7 jours glissants).

## 3. Achetez ou vendez
Parcourez les annonces par catégorie ou utilisez la recherche. Contactez le vendeur via la messagerie interne. Négociez directement entre particuliers. Convenez des modalités de transaction.

## 4. Confirmez la transaction
Une fois l'échange réalisé, l'acheteur et le vendeur confirment chacun la vente (double confirmation). L'annonce est alors marquée « Vendu » et les compteurs de ventes et d'achats sont mis à jour.

## 5. Laissez un avis
Dès que vous avez échangé au moins un message avec un membre, vous pouvez laisser un avis sur son profil. Un seul avis par membre — simple et sans manipulation possible.

## Durée de vie des annonces
Une annonce invendue est supprimée automatiquement au bout de 3 mois. Une annonce vendue affiche le badge « Vendu » : le vendeur peut la supprimer immédiatement, sinon elle est retirée automatiquement sous 24 heures.

## Conseils importants
Privilégiez toujours la remise en main propre. Vérifiez le profil et les avis avant toute transaction. Ne payez jamais à l'avance sans avoir vu l'article. En cas de problème, signalez l'annonce ou le membre via le bouton prévu.`
  },

  'securite': {
    title: 'Sécurité',
    content: `## Mesures de sécurité du Site
Email obligatoire et confirmé avant toute publication d'annonce. Limite d'annonces pour les nouveaux comptes. Système d'avis authentiques uniquement après échange prouvé entre membres. Filtre automatique des messages inappropriés. Signalement en 1 clic disponible sur chaque annonce et profil.

## Comment éviter les arnaques
Ne payez jamais par virement bancaire à l'avance. Méfiez-vous des prix anormalement bas. Vérifiez toujours le profil, les avis et l'ancienneté du membre. Privilégiez la remise en main propre pour les articles de valeur. N'envoyez jamais d'argent avant d'avoir vu et vérifié l'article. Signalez immédiatement tout comportement suspect.

## Réglementation airsoft en France
La vente de répliques airsoft entre particuliers est légale en France sous conditions. Les répliques doivent respecter les seuils de puissance légaux. La vente à des mineurs de moins de 18 ans est interdite. Les répliques doivent être conformes au décret du 30 juillet 2013. En cas de doute sur la légalité d'une réplique, ne la mettez pas en vente.

## Signaler un problème
airsoftswap@proton.me — Réponse sous 48h ouvrées.`
  },

  'contact': {
    title: 'Contact',
    content: `## Nous contacter
Email : airsoftswap@proton.me
Réponse sous 48h ouvrées.

## Signaler une annonce ou un membre
Utilisez le bouton "Signaler" directement sur l'annonce ou le profil concerné, ou envoyez un email à : airsoftswap@proton.me en précisant le nom du membre ou le lien de l'annonce concernée.

## Demande de suppression de données
Pour toute demande d'accès, rectification ou suppression de vos données personnelles (RGPD), contactez-nous à : airsoftswap@proton.me`
  }
}

function Md({ text }) {
  return <div className="legal-content">{text.split('\n').map((l, i) => {
    if (l.startsWith('## ')) return <h2 key={i}>{l.slice(3)}</h2>
    if (l.startsWith('### ')) return <h3 key={i}>{l.slice(4)}</h3>
    if (l.trim() === '') return <br key={i} />
    return <p key={i}>{l}</p>
  })}</div>
}

export default function PageLegale() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const page = PAGES[slug]
  if (!page) return (
    <div className="section">
      <div className="empty">
        <i className="ti ti-ghost"></i>
        <p>Page introuvable.</p>
        <button className="btn btn-out" style={{ marginTop: 16 }} onClick={() => navigate('/')}>Retour</button>
      </div>
    </div>
  )
  return (
    <div className="section" style={{ maxWidth: 800, margin: '0 auto' }}>
      <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: 'var(--text3)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 20, cursor: 'pointer' }}>
        <i className="ti ti-arrow-left"></i> Retour
      </button>
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: 32, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'var(--g)' }}></div>
        <h1 style={{ fontFamily: 'var(--fh)', fontSize: 26, fontWeight: 700, marginBottom: 24, paddingBottom: 18, borderBottom: '1px solid var(--border)', color: 'var(--text)' }}>{page.title}</h1>
        <Md text={page.content} />
      </div>
    </div>
  )
}
