# Guide d'intégration Frontend-Backend ImmoDesk

## 🎯 Objectif
Ce guide documente l'intégration complète entre le frontend Next.js et le backend Django pour l'application ImmoDesk.

## 📁 Structure des fichiers créés

### Services d'intégration
- `lib/api-client.ts` - Client HTTP axios avec gestion JWT
- `lib/auth-service.ts` - Service d'authentification
- `lib/patrimoine-service.ts` - Service patrimoine immobilier
- `lib/locations-service.ts` - Service locations et baux
- `lib/comptabilite-service.ts` - Service comptabilité
- `lib/paiement-service.ts` - Service paiements

### Types TypeScript
- `types/api.ts` - Types correspondants aux modèles Django

### Composants intégrés
- `components/PropertyCardIntegrated.tsx` - Carte bien utilisant les données backend
- `components/payments/PaymentProviderIntegrated.tsx` - Provider paiements avec backend

### Configuration
- `middleware.ts` - Protection des routes par rôle
- `env.example` - Variables d'environnement

## 🔗 Connexion API

### Configuration
```bash
# Copier le fichier d'environnement
cp env.example .env.local

# Configurer l'URL du backend
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api
```

### Client API
Le client axios gère automatiquement :
- L'ajout du token JWT dans les headers
- Le rafraîchissement automatique du token
- La gestion des erreurs 401

### Format de réponse
Toutes les réponses suivent le format standard du backend :
```typescript
interface StandardApiResponse<T> {
  success: boolean;
  code: string;
  message: string;
  messageKey: string;
  data: T | null;
  timestamp: string;
  errors: Array<...> | null;
  pagination: { ... } | null;
  userContext?: { ... } | null;
}
```

## 🔐 Authentification

### Flux JWT
1. **Login** : `POST /api/auth/login/`
   - Retourne tokens access + refresh
   - Stocke en localStorage
   - Redirige selon le rôle

2. **Accès protégé** : Header `Authorization: Bearer <access_token>`
   - Token valide 15 minutes
   - Auto-rafraîchissement si expiré

3. **Logout** : `POST /api/auth/logout/`
   - Blackliste le refresh token
   - Nettoie localStorage
   - Redirige vers login

### Rôles
- `superadmin` → `/admin`
- `proprietaire` → `/owner`  
- `locataire` → `/tenant`

## 🏠 Modules intégrés

### Patrimoine immobilier
- **Catégories** : CRUD complet
- **Immeubles** : CRUD avec filtre propriétaire
- **Biens** : CRUD avec photos, statuts
- **Soumissions** : Workflow propriétaire → admin

### Locations
- **Locataires** : Gestion des dossiers
- **Baux** : Création, révision, terminaison
- **Avis** : Notation des biens

### Comptabilité
- **Paiements** : Suivi des loyers
- **Dépenses** : Gestion des charges
- **Balance** : Calculs automatiques
- **Exports** : CSV fiscal 2044

### Paiements
- **Transactions** : Mobile Money, carte
- **Simulateur** : Tests et débogage
- **Statuts** : Temps réel

## 🔄 Fallback & Dégradations

### Mode dégradé
Si le backend n'est pas disponible :
- Utilisation des données mockées
- Indicateur "Données mockées"
- Fonctionnalités limitées

### Exemple : Page des biens
```typescript
const [useBackend, setUseBackend] = useState(false);

// Tentative de connexion au backend
try {
  const response = await PatrimoineService.getBiensPublic();
  if (response.success) {
    setProperties(response.data);
    setUseBackend(true);
  }
} catch (error) {
  // Fallback vers données mockées
  setUseBackend(false);
}
```

## 🛡️ Sécurité

### Middleware de protection
- Vérification du token JWT
- Redirection automatique si non authentifié
- Routes publiques configurées

### Validation côté client
- Types TypeScript stricts
- Validation des formulaires
- Gestion des erreurs utilisateur

## 📱 Composants adaptés

### PropertyCard
- Support des données backend
- Fallback images
- Statuts traduits

### Providers React
- **Notifications** : Synchronisation avec backend
- **Paiements** : Transactions réelles
- **Rapports** : Génération PDF

## 🚀 Déploiement

### Variables d'environnement
```env
NEXT_PUBLIC_API_URL=https://votre-backend.com/api
NODE_ENV=production
```

### Build
```bash
npm run build
npm start
```

## 🔧 Tests & Débogage

### Logs
- Console détaillée des erreurs
- Indicateurs visuels (badge "Données réelles")
- Fallback automatique

### Outils
- Swagger UI : `http://backend:8000/api/docs/`
- Network tab : Vérifier les appels API
- LocalStorage : Tokens JWT

## 📋 Checklist d'intégration

- [ ] Backend Django démarré
- [ ] Variables d'environnement configurées
- [ ] Migration des données exécutées
- [ ] Super admin créé
- [ ] Test connexion frontend
- [ ] Vérification tokens JWT
- [ ] Test des différents rôles
- [ ] Validation des CRUD
- [ ] Tests des paiements
- [ ] Vérification des exports

## 🐛 Problèmes courants

### CORS
```python
# Dans settings.py Django
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
```

### Token expiré
- Auto-rafraîchissement implémenté
- Vérifier localStorage
- Nettoyer si problème

### Types mismatch
- Utiliser les types de `types/api.ts`
- Vérifier les interfaces
- Convertir les données mockées

## 🎉 Résultat

L'intégration permet :
- ✅ Communication frontend-backend
- ✅ Authentification JWT sécurisée
- ✅ Gestion des rôles
- ✅ Données réelles + fallback
- ✅ Protection des routes
- ✅ UX fluide

L'application est maintenant prête pour la production avec une architecture robuste et extensible.
