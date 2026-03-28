# ImmoDesk — Plateforme de Gestion Immobilière (Frontend)

Bienvenue sur le dépôt Frontend d'**ImmoDesk**, une solution avancée de gestion immobilière conçue pour faciliter la vie des Agences Administratives, des Propriétaires et des Locataires, en centralisant et en numérisant l'ensemble du cycle de vie immobilier.

Ce projet frontend est propulsé par [Next.js](https://nextjs.org/) (App Router), [React](https://react.dev/), [Tailwind CSS](https://tailwindcss.com/) et communique de manière fluide avec une API backend robuste sous Django REST Framework.

## 🌟 Fonctionnalités Principales

- **Visites Virtuelles à 360°** : Immersive WebGL viewer permettant aux potentiels locataires de visiter les biens immobiliers en ligne sous tous les angles.
- **Paiements en Ligne Intégrés** : Processus de paiement simulé intégrant des options variées (Mobile Money, Carte Bancaire) pour les paiements occasionnels (visites virtuelles) et récurrents (loyers mensuels).
- **Tableaux de Bord Rôles (Dashboards)** :
  - *Locataire* : Consulter ses baux, payer son loyer, suivre l'historique de ses paiements et ses quittances.
  - *Propriétaire* : Gérer son pipeline de biens immobiliers (statut, visibilité, revenus globaux et statistiques de location/dépenses pour sa gestion comptable).
  - *Admin* : Gérer les comptes, configurer les informations réseaux, et modérer toutes les données sensibles (approbations de visites, surveillance des flux de paiements).
- **Gestion des Accès Ephémères (Visites)** : Distribution de passes virtuels uniques, envoyés par mail ou SMS simulé, valable 24h.
  
## 🛠️ Stack Technologique (Frontend)
- **Framework React** : Next.js 16.1 (App Router)
- **Langage** : TypeScript
- **Style** : Tailwind CSS & Lucide Icons
- **HTTP Client** : Axios 
- **Rendu 3D (Visite)** : Three.js / Pannellum (via des Web Components custom)

---

## 🚀 Lancement Rapide (Getting Started)

### Prérequis
Assurez-vous d'avoir Node.js (version 18+ recommandée) et NPM (ou yarn/pnpm).

### 1. Installation des dépendances
Cloner le projet et installer les paquets nécessaires :
```bash
npm install
# ou
yarn install
```

### 2. Variables d'Environnement
Créez un fichier `.env.local` à la racine (dossier frontend/next/immodesk) pour paramétrer l'URL du backend Django API.

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

### 3. Démarrer le Serveur de Développement
```bash
npm run dev
# ou
yarn dev
```
Rendez-vous sur [http://localhost:3000](http://localhost:3000) dans votre navigateur pour visualiser et tester l'application.

---

## 🎨 Architecture des Pages & Routeur

Le projet exploite le puissant outil de routing de Next.js (`app/`) :
- `app/(dashboard)/` : Agroupe les Vues Protégées.
  - `/admin/...` : Tableau de bord de l'administrateur.
  - `/owner/...` : Tableau de bord des propriétaires.
  - `/tenant/...` : Tableau de bord des locataires.
- `app/login/` : Page unique d'Authentification.
- `app/visit/[id]/` : Interface publique/semi-privée d'achat et d'accès sécurisé à un bien via la vue Visite 360°.
- `app/property/[id]/` : Détails d'un bien immobilier ouvert au grand public (catalogue public).

## 🔒 Authentification & Accès Sécurisés
L'authentification s'appuie sur le système de Tokens Standardisés de l'API Backend. Une fois authentifié, l'interface s'ajuste contextuellement au rôle de l'utilisateur (`Role-Based Access Control`).

---

*(Consultez la documentation Backend de ce projet (Django) pour configurer la persistance BD, l'envoi d'emails transactionnels, ou paramétrer les APIs de services tiers).*
