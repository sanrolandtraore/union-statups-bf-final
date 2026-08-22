-- Migration : insertion/mise à jour des pages légales attendues par le footer
-- Slugs couverts : cgu, confidentialite, cookies, mentions-legales, conditions-investisseurs, conditions-freelance, equity-vesting, cgv-services-pro, conditions-partenaires, conditions-startups, propriete-intellectuelle

INSERT INTO public.legal_pages (slug, title, content, meta_description, is_published)
VALUES (
  'cgu',
  'Conditions Générales d''Utilisation',
  '# Conditions Générales d''Utilisation

**Plateforme Union''S — Version en vigueur au [À COMPLÉTER]**

---

## Article 1 — Objet et champ d''application

Les présentes Conditions Générales d''Utilisation (« CGU ») définissent les modalités et conditions dans lesquelles la plateforme Union''S (la « Plateforme ») met à disposition de ses utilisateurs un service de mise en relation entre talents, startups, investisseurs et partenaires.

Toute inscription ou utilisation de la Plateforme implique l''acceptation pleine et entière des présentes CGU.

## Article 2 — Éditeur de la Plateforme

La Plateforme Union''S est éditée par [Dénomination sociale], [Forme juridique], dont le siège social est situé [Adresse, ville, Burkina Faso], immatriculée au RCCM sous le numéro [À COMPLÉTER], IFU [À COMPLÉTER].

## Article 3 — Définitions

- **Compte** : espace personnel créé par l''Utilisateur après inscription.
- **Contenu** : toute information, donnée, document publié ou transmis par un Utilisateur.
- **Talent** : Utilisateur recherchant une opportunité professionnelle ou entrepreneuriale.
- **Startup** : Utilisateur porteur d''un projet entrepreneurial.
- **Investisseur** : Utilisateur recherchant des opportunités d''investissement.
- **Partenaire** : structure institutionnelle ou privée collaborant avec Union''S.

## Article 4 — Accès à la Plateforme et création de compte

L''inscription est réservée aux personnes physiques majeures et aux personnes morales représentées par une personne habilitée. L''Utilisateur s''engage à fournir des informations exactes et à jour, et à préserver la confidentialité de ses identifiants de connexion.

## Article 5 — Description des Services

La Plateforme propose la création de profil, le dépôt de documents (CV, présentations), un système de mise en relation, une messagerie interne et la consultation de profils et d''opportunités.

Union''S agit en qualité d''intermédiaire technique. Elle n''est partie à aucun accord conclu entre Utilisateurs à l''issue d''une mise en relation et n''assume aucune responsabilité quant à l''exécution de tels accords.

## Article 6 — Contenu déposé par les Utilisateurs

L''Utilisateur est seul responsable du Contenu qu''il publie, notamment des documents téléversés. Il garantit disposer de tous les droits nécessaires sur ces Contenus.

Sont notamment interdits les Contenus diffamatoires, portant atteinte aux droits de tiers, contenant des données personnelles de tiers sans consentement, ou de nature à induire en erreur sur l''identité ou le projet présenté.

En déposant un Contenu, l''Utilisateur concède à Union''S une licence non exclusive et gratuite, limitée à la durée de mise en ligne, aux seules fins de fourniture des Services.

## Article 7 — Obligations des Utilisateurs

Chaque Utilisateur s''engage à utiliser la Plateforme conformément à sa destination, à ne pas usurper l''identité d''un tiers, à ne pas perturber le fonctionnement technique de la Plateforme et à respecter les autres Utilisateurs.

## Article 8 — Propriété intellectuelle

La structure de la Plateforme, ainsi que les éléments qui la composent, sont la propriété exclusive d''Union''S et protégés notamment par l''Accord de Bangui instituant l''OAPI. Voir également la page dédiée « Propriété intellectuelle & protection des données ».

## Article 9 — Protection des données personnelles

Le traitement des données personnelles est régi par la Politique de Confidentialité, conforme à la loi n°010-2004/AN du 20 avril 2004 portant protection des données à caractère personnel au Burkina Faso.

## Article 10 — Disponibilité et responsabilité

Union''S met en œuvre des moyens raisonnables pour assurer un accès continu à la Plateforme, sans garantir une disponibilité ininterrompue. Union''S ne saurait être tenue responsable des informations erronées fournies par un Utilisateur ni de l''issue d''une mise en relation.

## Article 11 — Suspension et résiliation

L''Utilisateur peut demander la suppression de son Compte à tout moment. Union''S peut suspendre ou résilier un Compte en cas de manquement grave ou répété aux présentes CGU.

## Article 12 — Modification des CGU

Union''S peut modifier les présentes CGU à tout moment. Les Utilisateurs seront informés de toute modification substantielle avant son entrée en vigueur.

## Article 13 — Droit applicable et litiges

Les présentes CGU sont soumises au droit burkinabè. Tout litige sera, à défaut de résolution amiable, porté devant les juridictions compétentes de Ouagadougou.

---

*Document type à faire relire et valider par un conseil juridique avant publication officielle.*',
  'Conditions Générales d''Utilisation de la plateforme Union''S.',
  true
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  content = EXCLUDED.content,
  meta_description = EXCLUDED.meta_description,
  is_published = true,
  updated_at = now();

INSERT INTO public.legal_pages (slug, title, content, meta_description, is_published)
VALUES (
  'confidentialite',
  'Politique de Confidentialité',
  '# Politique de Confidentialité

**Plateforme Union''S — Version en vigueur au [À COMPLÉTER]**

---

## Article 1 — Préambule

La présente Politique de Confidentialité informe les Utilisateurs de la Plateforme Union''S sur la collecte, l''utilisation, la conservation et la protection de leurs données à caractère personnel, conformément à la loi n°010-2004/AN du 20 avril 2004 portant protection des données à caractère personnel au Burkina Faso.

## Article 2 — Responsable de traitement

[Dénomination sociale], [Forme juridique], siège social [Adresse, Burkina Faso], RCCM [À COMPLÉTER], IFU [À COMPLÉTER]. Contact données personnelles : [e-mail à compléter].

## Article 3 — Données collectées

- **Identification et profil** : nom, prénom, e-mail, téléphone, statut (Talent/Startup/Investisseur/Partenaire), parcours professionnel.
- **Documents téléversés** : CV, présentations de projet, pièces jointes.
- **Données de connexion** : adresse IP, journaux de connexion, données de navigation.
- **Échanges** : contenu des messages via la messagerie interne.

## Article 4 — Finalités du traitement

Les données sont traitées pour la gestion du Compte, la mise en relation entre profils, la gestion des documents déposés, le fonctionnement de la messagerie interne, la sécurité de la Plateforme et la communication avec les Utilisateurs.

## Article 5 — Destinataires des données

Les données sont destinées aux équipes internes d''Union''S habilitées, aux autres Utilisateurs dans la stricte mesure nécessaire à la mise en relation, aux sous-traitants techniques (hébergement, stockage, messagerie électronique) et, le cas échéant, aux autorités compétentes. Union''S ne vend ni ne loue les données de ses Utilisateurs.

## Article 6 — Hébergement et transferts

[À compléter : localisation des hébergeurs et prestataires cloud utilisés par la Plateforme]. En cas de transfert hors du Burkina Faso, Union''S s''assure d''un niveau de protection adéquat.

## Article 7 — Durée de conservation

Les données de Compte sont conservées pendant la durée de vie du Compte. Les documents téléversés sont conservés tant que le Compte est actif. Les données de connexion sont conservées pour une durée limitée à des fins de sécurité.

## Article 8 — Sécurité des données

Union''S met en œuvre des mesures techniques et organisationnelles raisonnables pour préserver la sécurité, l''intégrité et la confidentialité des données. En cas de violation de données à risque élevé, les Utilisateurs et autorités compétentes seront informés conformément à la réglementation.

## Article 9 — Droits des Utilisateurs

Conformément à la loi n°010-2004/AN, tout Utilisateur dispose d''un droit d''accès, de rectification, d''opposition, de suppression et de limitation du traitement de ses données, ainsi que du droit de retirer son consentement. Ces droits s''exercent par demande écrite à l''adresse indiquée à l''Article 2. Toute réclamation peut être portée devant la Commission de l''Informatique et des Libertés (CIL) du Burkina Faso.

## Article 10 — Cookies

Voir la page dédiée « Politique de Cookies » pour le détail des cookies utilisés et les modalités de gestion du consentement.

## Article 11 — Mineurs

La Plateforme n''est pas destinée aux personnes n''ayant pas atteint la majorité légale.

## Article 12 — Modification

Union''S peut modifier la présente Politique à tout moment. Toute modification substantielle fera l''objet d''une information préalable des Utilisateurs.

## Article 13 — Contact

Pour toute question relative à la présente Politique : [e-mail à compléter].

---

*Document type à faire relire et valider par un conseil juridique avant publication officielle.*',
  'Politique de Confidentialité de la plateforme Union''S — traitement des données personnelles.',
  true
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  content = EXCLUDED.content,
  meta_description = EXCLUDED.meta_description,
  is_published = true,
  updated_at = now();

INSERT INTO public.legal_pages (slug, title, content, meta_description, is_published)
VALUES (
  'cookies',
  'Politique de Cookies',
  '# Politique de Cookies

**Plateforme Union''S — Version en vigueur au [À COMPLÉTER]**

---

## Article 1 — Qu''est-ce qu''un cookie

Un cookie est un petit fichier texte déposé sur le terminal de l''Utilisateur lors de la consultation de la Plateforme, permettant de reconnaître ce terminal lors de visites ultérieures.

## Article 2 — Cookies utilisés sur la Plateforme

- **Cookies strictement nécessaires** : indispensables au fonctionnement de la Plateforme (authentification, sécurité, préférence de thème clair/sombre). Ils ne peuvent pas être désactivés.
- **Cookies de mesure d''audience** : permettent de comprendre l''utilisation de la Plateforme afin de l''améliorer. [À compléter selon les outils réellement utilisés, ex. Vercel Analytics].
- **Cookies fonctionnels** : mémorisation de préférences (langue, thème).

[À compléter : tableau détaillé nom du cookie / finalité / durée de conservation, une fois l''implémentation technique des cookies confirmée.]

## Article 3 — Durée de conservation

Les cookies sont conservés pour une durée maximale de treize (13) mois à compter de leur dépôt, sauf pour les cookies strictement nécessaires liés à la session de connexion.

## Article 4 — Gestion du consentement

Lors de sa première visite, l''Utilisateur est informé de l''utilisation de cookies et peut exprimer son choix. L''Utilisateur peut à tout moment modifier ses préférences via les paramètres de son navigateur, qui lui permettent de refuser ou supprimer les cookies déposés.

## Article 5 — Cookies tiers

Certaines fonctionnalités de la Plateforme peuvent recourir à des services tiers susceptibles de déposer leurs propres cookies (ex. hébergement vidéo, cartographie). [À compléter selon les intégrations tierces effectivement présentes sur la Plateforme.]

## Article 6 — Modification

La présente Politique de Cookies peut être modifiée à tout moment, notamment pour tenir compte de l''évolution des outils utilisés par la Plateforme.

## Article 7 — Contact

Pour toute question : [e-mail à compléter].

---

*Document type à faire relire et valider par un conseil juridique avant publication officielle.*',
  'Politique de gestion des cookies et technologies similaires sur la plateforme Union''S.',
  true
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  content = EXCLUDED.content,
  meta_description = EXCLUDED.meta_description,
  is_published = true,
  updated_at = now();

INSERT INTO public.legal_pages (slug, title, content, meta_description, is_published)
VALUES (
  'mentions-legales',
  'Mentions Légales',
  '# Mentions Légales

---

## Éditeur de la Plateforme

- **Dénomination sociale** : [À COMPLÉTER]
- **Forme juridique** : [À COMPLÉTER]
- **Siège social** : [Adresse complète, ville, Burkina Faso]
- **RCCM** : [Numéro d''immatriculation au Registre du Commerce et du Crédit Mobilier]
- **IFU** : [Identifiant Financier Unique]
- **Capital social** : [Montant, le cas échéant]
- **Représentant légal** : [Nom et qualité]
- **Contact** : [Adresse e-mail de contact]
- **Téléphone** : [À COMPLÉTER]

## Directeur de publication

[Nom du directeur de publication]

## Hébergement

La Plateforme est hébergée par :

- **Vercel Inc.** — 340 S Lemon Ave #4133, Walnut, CA 91789, États-Unis — [www.vercel.com](https://vercel.com)
- Base de données et stockage : **Supabase Inc.** — [www.supabase.com](https://supabase.com)

## Propriété intellectuelle

L''ensemble des éléments composant la Plateforme (textes, graphismes, logos, structure, base de données) est protégé par les législations en vigueur en matière de propriété intellectuelle, notamment l''Accord de Bangui instituant l''Organisation Africaine de la Propriété Intellectuelle (OAPI). Voir la page « Propriété intellectuelle & protection des données ».

## Protection des données personnelles

Le traitement des données à caractère personnel des Utilisateurs est décrit dans la Politique de Confidentialité, conforme à la loi n°010-2004/AN du 20 avril 2004 portant protection des données à caractère personnel au Burkina Faso.

## Droit applicable

Les présentes mentions légales sont soumises au droit burkinabè. Tout litige relève de la compétence des juridictions de Ouagadougou.

---

*Document type à faire relire et valider par un conseil juridique avant publication officielle.*',
  'Mentions légales de la plateforme Union''S.',
  true
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  content = EXCLUDED.content,
  meta_description = EXCLUDED.meta_description,
  is_published = true,
  updated_at = now();

INSERT INTO public.legal_pages (slug, title, content, meta_description, is_published)
VALUES (
  'conditions-investisseurs',
  'Conditions Spécifiques — Investisseurs',
  '# Conditions Spécifiques — Investisseurs

**Complément aux Conditions Générales d''Utilisation de la Plateforme Union''S**

---

## Article 1 — Objet

Les présentes conditions spécifiques complètent les Conditions Générales d''Utilisation (CGU) et s''appliquent à tout Utilisateur inscrit en qualité d''Investisseur sur la Plateforme Union''S.

## Article 2 — Statut et éligibilité

L''accès aux fonctionnalités dédiées aux Investisseurs peut être subordonné à une vérification préalable de l''identité et, le cas échéant, de la qualité d''investisseur (personne physique ou morale, fonds, business angel, syndicat d''investissement). Union''S se réserve le droit de demander des justificatifs complémentaires et de refuser ou suspendre l''accès à ce statut en cas de doute raisonnable.

## Article 3 — Nature du service rendu

Union''S met à disposition des Investisseurs un outil de découverte et de mise en relation avec des Startups. Union''S n''effectue aucune recommandation d''investissement, ne réalise aucun audit préalable (« due diligence ») des Startups présentées, et n''agit ni comme conseiller en investissement, ni comme intermédiaire financier au sens de la réglementation applicable.

## Article 4 — Absence de garantie sur les informations présentées

Les informations relatives aux Startups (présentations, chiffres, projections) sont fournies par les Startups elles-mêmes sous leur seule responsabilité. Il appartient à l''Investisseur de procéder à sa propre analyse et vérification avant toute décision d''investissement.

## Article 5 — Syndicats d''investissement

Lorsque la Plateforme permet la création ou la participation à un syndicat d''investissement, les modalités précises (gouvernance, frais de gestion, répartition des gains) sont définies dans la documentation contractuelle spécifique à chaque syndicat, distincte des présentes conditions.

## Article 6 — Confidentialité des informations reçues

L''Investisseur s''engage à ne pas divulguer à des tiers non autorisés les informations confidentielles auxquelles il accède dans le cadre de la consultation de dossiers de Startups, sauf accord exprès de la Startup concernée.

## Article 7 — Responsabilité

Union''S ne saurait être tenue responsable des pertes financières résultant d''une décision d''investissement prise à la suite d''une mise en relation opérée via la Plateforme.

## Article 8 — Droit applicable

Les présentes conditions sont soumises au droit burkinabè et complètent les CGU générales de la Plateforme.

---

*Document type à faire relire et valider par un conseil juridique avant publication officielle.*',
  'Conditions spécifiques applicables aux Utilisateurs Investisseurs de la plateforme Union''S.',
  true
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  content = EXCLUDED.content,
  meta_description = EXCLUDED.meta_description,
  is_published = true,
  updated_at = now();

INSERT INTO public.legal_pages (slug, title, content, meta_description, is_published)
VALUES (
  'conditions-freelance',
  'Conditions Spécifiques — Talents & Freelances',
  '# Conditions Spécifiques — Talents & Freelances

**Complément aux Conditions Générales d''Utilisation de la Plateforme Union''S**

---

## Article 1 — Objet

Les présentes conditions spécifiques s''appliquent à tout Utilisateur inscrit en qualité de Talent ou intervenant en tant que freelance/indépendant via la Plateforme Union''S.

## Article 2 — Statut du Talent

Le Talent demeure seul responsable de son statut juridique et fiscal (salarié, indépendant, entrepreneur individuel, société). Union''S n''est ni l''employeur, ni le donneur d''ordre du Talent, et n''intervient à aucun titre dans la relation contractuelle éventuellement nouée avec une Startup ou un tiers à la suite d''une mise en relation.

## Article 3 — Exactitude du profil

Le Talent garantit l''exactitude des informations figurant sur son profil et dans les documents téléversés (CV, portfolio, certifications). Toute fausse déclaration relative à des compétences, diplômes ou expériences est susceptible d''entraîner la suspension du Compte.

## Article 4 — Relation avec les Startups

Toute mission, collaboration ou embauche résultant d''une mise en relation via la Plateforme fait l''objet d''un accord direct entre le Talent et la Startup ou le Partenaire concerné, régi par leurs propres conditions (contrat de travail, contrat de prestation, convention de stage). Union''S n''est pas partie à cet accord.

## Article 5 — Rémunération

Les modalités de rémunération, y compris toute participation au capital (« equity »), sont négociées directement entre le Talent et la Startup. Voir la page « Equity & Vesting » pour les principes généraux applicables lorsque la Plateforme facilite ce type d''accord.

## Article 6 — Absence de garantie d''opportunité

Union''S ne garantit ni le nombre, ni la qualité, ni l''issue des mises en relation proposées au Talent.

## Article 7 — Responsabilité

Union''S ne saurait être tenue responsable des conditions d''exécution, de rupture ou de non-paiement relatives à une mission ou un contrat conclu à la suite d''une mise en relation.

## Article 8 — Droit applicable

Les présentes conditions sont soumises au droit burkinabè et complètent les CGU générales de la Plateforme.

---

*Document type à faire relire et valider par un conseil juridique avant publication officielle.*',
  'Conditions spécifiques applicables aux Talents et Freelances de la plateforme Union''S.',
  true
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  content = EXCLUDED.content,
  meta_description = EXCLUDED.meta_description,
  is_published = true,
  updated_at = now();

INSERT INTO public.legal_pages (slug, title, content, meta_description, is_published)
VALUES (
  'equity-vesting',
  'Equity & Vesting — Principes Applicables',
  '# Equity & Vesting — Principes Applicables

**Complément aux Conditions Générales d''Utilisation de la Plateforme Union''S**

---

## Article 1 — Objet

La présente page expose les principes généraux applicables lorsque la Plateforme Union''S met à disposition des Utilisateurs des outils informatifs ou de simulation relatifs à des mécanismes d''attribution d''actions ou de parts sociales (« equity ») assortis d''un calendrier d''acquisition progressive (« vesting »).

## Article 2 — Nature purement informative des outils proposés

Tout simulateur, calculateur ou contenu pédagogique relatif à l''equity et au vesting mis à disposition sur la Plateforme est fourni à titre purement informatif et pédagogique. Il ne constitue en aucun cas un conseil juridique, fiscal, comptable ou financier, ni une offre contractuelle.

## Article 3 — Absence de valeur contractuelle

Les résultats obtenus via un simulateur d''equity ou de vesting sur la Plateforme n''engagent ni Union''S, ni les Startups, ni les Talents ou Investisseurs. Toute attribution réelle d''actions, de parts sociales, de bons de souscription ou tout autre instrument doit faire l''objet d''un acte juridique formel (pacte d''associés, contrat d''attribution, décision des organes sociaux compétents) établi conformément au droit des sociétés applicable, notamment aux dispositions de l''Acte uniforme OHADA relatif au droit des sociétés commerciales et du groupement d''intérêt économique.

## Article 4 — Recommandation de recours à un professionnel

Union''S recommande à tout Utilisateur souhaitant mettre en place un mécanisme d''equity ou de vesting de recourir à un avocat, notaire ou expert-comptable habilité, afin de sécuriser juridiquement et fiscalement l''opération envisagée.

## Article 5 — Confidentialité des simulations

Les données saisies par un Utilisateur dans un outil de simulation demeurent confidentielles et ne sont partagées avec des tiers que dans les conditions prévues par la Politique de Confidentialité de la Plateforme.

## Article 6 — Responsabilité

Union''S ne saurait être tenue responsable des conséquences juridiques, fiscales ou financières résultant de l''utilisation des informations ou simulations mises à disposition sur cette page, ni des accords d''attribution d''equity conclus entre Utilisateurs.

## Article 7 — Droit applicable

Les présentes conditions sont soumises au droit burkinabè et aux Actes uniformes OHADA applicables en matière de droit des sociétés.

---

*Document type à faire relire et valider par un conseil juridique avant publication officielle.*',
  'Principes généraux relatifs aux mécanismes d''equity et de vesting présentés sur la plateforme Union''S.',
  true
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  content = EXCLUDED.content,
  meta_description = EXCLUDED.meta_description,
  is_published = true,
  updated_at = now();

INSERT INTO public.legal_pages (slug, title, content, meta_description, is_published)
VALUES (
  'cgv-services-pro',
  'Conditions Générales de Vente — Services Professionnels',
  '# Conditions Générales de Vente — Services Professionnels

**Plateforme Union''S — Version en vigueur au [À COMPLÉTER]**

---

## Article 1 — Objet

Les présentes Conditions Générales de Vente (« CGV ») s''appliquent à toute souscription, par un Utilisateur professionnel (Startup, Investisseur ou Partenaire), à une offre payante proposée sur la Plateforme Union''S (abonnement, option premium, service d''accompagnement).

## Article 2 — Offres et tarifs

Les offres, fonctionnalités incluses et tarifs applicables sont présentés sur la page « Tarifs » de la Plateforme au moment de la souscription. Les prix sont indiqués en Francs CFA (FCFA), toutes taxes comprises le cas échéant. Union''S se réserve le droit de modifier ses tarifs, sous réserve d''en informer les Utilisateurs abonnés avant tout renouvellement.

## Article 3 — Commande et paiement

La souscription à une offre payante est confirmée après validation du paiement par les moyens proposés sur la Plateforme. [À compléter selon le prestataire de paiement effectivement intégré]. Toute commande vaut acceptation des présentes CGV.

## Article 4 — Durée et renouvellement

Sauf mention contraire lors de la souscription, les abonnements sont conclus pour la durée indiquée sur l''offre choisie et peuvent être reconduits selon les modalités précisées au moment de la souscription. L''Utilisateur peut résilier son abonnement depuis les paramètres de son Compte.

## Article 5 — Droit de rétractation

[À compléter selon la nature du service : le droit de rétractation applicable aux prestations de services professionnels entre professionnels est généralement limité ; à préciser selon la qualité des parties et la réglementation applicable.]

## Article 6 — Facturation

Une facture est mise à disposition de l''Utilisateur pour chaque paiement effectué, conformément aux obligations comptables et fiscales applicables au Burkina Faso.

## Article 7 — Résiliation et remboursement

En cas de manquement grave de l''Utilisateur à ses obligations, Union''S peut suspendre ou résilier l''accès au service payant, sans remboursement des sommes déjà versées, sauf disposition légale contraire.

## Article 8 — Responsabilité

La responsabilité d''Union''S au titre des présentes CGV est limitée aux sommes effectivement versées par l''Utilisateur au titre du service concerné au cours des douze (12) derniers mois.

## Article 9 — Droit applicable et litiges

Les présentes CGV sont soumises au droit burkinabè. Tout litige sera, à défaut de résolution amiable, porté devant les juridictions compétentes de Ouagadougou.

---

*Document type à faire relire et valider par un conseil juridique avant publication officielle.*',
  'Conditions Générales de Vente applicables aux offres et services professionnels payants de la plateforme Union''S.',
  true
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  content = EXCLUDED.content,
  meta_description = EXCLUDED.meta_description,
  is_published = true,
  updated_at = now();

INSERT INTO public.legal_pages (slug, title, content, meta_description, is_published)
VALUES (
  'conditions-partenaires',
  'Conditions Spécifiques — Partenaires',
  '# Conditions Spécifiques — Partenaires

**Complément aux Conditions Générales d''Utilisation de la Plateforme Union''S**

---

## Article 1 — Objet

Les présentes conditions spécifiques s''appliquent à toute structure institutionnelle, associative, académique ou privée inscrite en qualité de Partenaire sur la Plateforme Union''S.

## Article 2 — Cadre du partenariat

Le référencement d''un Partenaire sur la Plateforme (logo, présentation, contenus dédiés) est subordonné, le cas échéant, à la signature d''une convention de partenariat distincte précisant les engagements réciproques, notamment financiers, des parties. Les présentes conditions s''appliquent à titre complémentaire à cette convention.

## Article 3 — Utilisation de l''image du Partenaire

Union''S ne peut utiliser le nom, le logo ou l''image d''un Partenaire à des fins de communication qu''avec l''accord préalable de ce dernier, tel que précisé dans la convention de partenariat applicable.

## Article 4 — Contenus mis à disposition par le Partenaire

Le Partenaire demeure seul responsable de l''exactitude et de la licéité des contenus qu''il transmet à Union''S en vue de leur publication sur la Plateforme (ressources, offres, événements).

## Article 5 — Durée et fin du partenariat

Sauf stipulation contraire de la convention de partenariat applicable, chaque partie peut mettre fin au partenariat moyennant un préavis raisonnable notifié par écrit à l''autre partie.

## Article 6 — Responsabilité

Union''S ne saurait être tenue responsable des engagements pris par un Partenaire vis-à-vis d''autres Utilisateurs de la Plateforme (Talents, Startups, Investisseurs).

## Article 7 — Droit applicable

Les présentes conditions sont soumises au droit burkinabè et complètent les CGU générales de la Plateforme.

---

*Document type à faire relire et valider par un conseil juridique avant publication officielle.*',
  'Conditions spécifiques applicables aux structures Partenaires de la plateforme Union''S.',
  true
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  content = EXCLUDED.content,
  meta_description = EXCLUDED.meta_description,
  is_published = true,
  updated_at = now();

INSERT INTO public.legal_pages (slug, title, content, meta_description, is_published)
VALUES (
  'conditions-startups',
  'Conditions Spécifiques — Startups',
  '# Conditions Spécifiques — Startups

**Complément aux Conditions Générales d''Utilisation de la Plateforme Union''S**

---

## Article 1 — Objet

Les présentes conditions spécifiques s''appliquent à tout Utilisateur inscrit en qualité de Startup ou de porteur de projet entrepreneurial sur la Plateforme Union''S.

## Article 2 — Exactitude des informations présentées

La Startup garantit l''exactitude et la sincérité des informations qu''elle publie sur la Plateforme, notamment celles relatives à son activité, ses chiffres, son équipe et ses besoins de financement ou de recrutement. Toute information trompeuse peut entraîner la suspension du Compte.

## Article 3 — Mise en relation avec Talents et Investisseurs

La Startup reconnaît qu''Union''S agit en qualité de simple intermédiaire technique de mise en relation et n''effectue aucune vérification approfondie (due diligence) des Talents ou Investisseurs mis en relation avec elle. Il appartient à la Startup de procéder à ses propres vérifications avant de conclure tout accord.

## Article 4 — Confidentialité des informations partagées

Lorsque la Startup partage des informations sensibles (données financières, stratégie, prototypes) avec des Investisseurs ou Talents via la Plateforme, elle reste seule responsable de déterminer le niveau de confidentialité approprié et de recourir, le cas échéant, à un accord de confidentialité (NDA) distinct.

## Article 5 — Levées de fonds et syndicats d''investissement

Toute opération de levée de fonds facilitée via la Plateforme (y compris via un syndicat d''investissement) fait l''objet d''une documentation juridique distincte (pacte d''associés, bulletin de souscription) conforme à l''Acte uniforme OHADA relatif au droit des sociétés commerciales. Union''S n''intervient pas dans la structuration juridique de ces opérations.

## Article 6 — Utilisation des outils Equity & Vesting

Les outils de simulation d''equity et de vesting mis à disposition sur la Plateforme sont purement informatifs. Voir la page dédiée « Equity & Vesting » pour le détail des principes applicables.

## Article 7 — Responsabilité

Union''S ne saurait être tenue responsable de l''issue des opérations de financement ou de recrutement engagées par la Startup à la suite d''une mise en relation opérée via la Plateforme.

## Article 8 — Droit applicable

Les présentes conditions sont soumises au droit burkinabè et complètent les CGU générales de la Plateforme.

---

*Document type à faire relire et valider par un conseil juridique avant publication officielle.*',
  'Conditions spécifiques applicables aux Startups inscrites sur la plateforme Union''S.',
  true
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  content = EXCLUDED.content,
  meta_description = EXCLUDED.meta_description,
  is_published = true,
  updated_at = now();

INSERT INTO public.legal_pages (slug, title, content, meta_description, is_published)
VALUES (
  'propriete-intellectuelle',
  'Propriété Intellectuelle & Protection des Données',
  '# Propriété Intellectuelle & Protection des Données

**Plateforme Union''S — Version en vigueur au [À COMPLÉTER]**

---

## Article 1 — Propriété intellectuelle de la Plateforme

La structure générale de la Plateforme Union''S, ainsi que les textes, graphismes, logos, icônes, éléments logiciels, bases de données et contenus qui la composent, sont la propriété exclusive d''Union''S ou de ses concédants, et sont protégés par les législations applicables en matière de propriété intellectuelle, notamment l''Accord de Bangui du 2 mars 1977 instituant l''Organisation Africaine de la Propriété Intellectuelle (OAPI), auquel le Burkina Faso est partie.

Toute reproduction, représentation, modification ou exploitation, totale ou partielle, de ces éléments, sans autorisation préalable et écrite d''Union''S, est strictement interdite.

## Article 2 — Propriété intellectuelle des contenus Utilisateurs

Chaque Utilisateur conserve l''intégralité de ses droits de propriété intellectuelle sur les Contenus qu''il publie sur la Plateforme (CV, présentations, documents, projets). En publiant un Contenu, l''Utilisateur concède à Union''S une licence non exclusive, gratuite et limitée à la durée de mise en ligne, aux seules fins de fourniture des Services (hébergement, affichage aux Utilisateurs concernés par le matching).

## Article 3 — Propriété intellectuelle des projets présentés par les Startups

La présentation d''un projet, d''une marque, d''un brevet ou de tout autre actif de propriété intellectuelle par une Startup sur la Plateforme ne constitue ni une cession, ni une licence de ces droits au bénéfice d''Union''S ou des autres Utilisateurs. Toute cession ou licence éventuelle doit faire l''objet d''un accord distinct entre les parties concernées.

## Article 4 — Signalement d''une atteinte aux droits de propriété intellectuelle

Tout titulaire de droits estimant qu''un Contenu publié sur la Plateforme porte atteinte à ses droits de propriété intellectuelle peut le signaler à Union''S à l''adresse [e-mail à compléter], en précisant les éléments permettant d''identifier le Contenu concerné et les droits invoqués. Union''S se réserve le droit de retirer tout Contenu manifestement illicite.

## Article 5 — Protection des données à caractère personnel

Le traitement des données à caractère personnel des Utilisateurs, y compris celles pouvant figurer dans les documents relevant de la propriété intellectuelle d''un Utilisateur (CV, portfolios), est régi par la Politique de Confidentialité de la Plateforme, conforme à la loi n°010-2004/AN du 20 avril 2004 portant protection des données à caractère personnel au Burkina Faso.

## Article 6 — Articulation avec les autres pages légales

La présente page complète, sans s''y substituer, les Conditions Générales d''Utilisation et la Politique de Confidentialité de la Plateforme.

## Article 7 — Droit applicable

Les présentes dispositions sont soumises au droit burkinabè et aux conventions internationales applicables en matière de propriété intellectuelle, notamment l''Accord de Bangui (OAPI).

---

*Document type à faire relire et valider par un conseil juridique avant publication officielle.*',
  'Régime de propriété intellectuelle et de protection des données applicable sur la plateforme Union''S.',
  true
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  content = EXCLUDED.content,
  meta_description = EXCLUDED.meta_description,
  is_published = true,
  updated_at = now();

