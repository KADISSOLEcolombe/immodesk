# 🧪 Guide de Vérification d'Intégration

## ✅ Points vérifiés et corrigés

### 1. **Tokens JWT - Stockage et rafraîchissement automatique**

#### ✅ **Corrections apportées :**
- **Double stockage** : localStorage + cookies pour compatibilité middleware
- **Synchronisation** : Méthode `syncTokensFromCookies()` pour la persistance
- **Rafraîchissement automatique** : Intercepteur axios avec retry unique
- **Nettoyage complet** : localStorage + cookies lors de la déconnexion
- **Logging détaillé** : Traçabilité des opérations JWT

#### 🔍 **Comment vérifier :**
1. Allez sur `/test-integration`
2. Cliquez "Lancer les tests"
3. Vérifiez les messages de logs dans la console du navigateur

### 2. **Protection des routes par rôle**

#### ✅ **Corrections apportées :**
- **Middleware amélioré** : Vérification des rôles côté serveur
- **Cookies de rôle** : Stockage du rôle utilisateur dans les cookies
- **Routes par rôle** : `/admin`, `/owner`, `/tenant` strictement protégées
- **Redirections intelligentes** : Vers login si non authentifié, vers home si mauvais rôle

#### 🔍 **Comment vérifier :**
1. Déconnectez-vous et essayez d'accéder à `/admin` → redirection vers `/login`
2. Connectez-vous comme locataire et essayez `/admin` → redirection vers `/`
3. Vérifiez les logs du middleware dans les logs Next.js

### 3. **URL de base des appels API**

#### ✅ **Corrections apportées :**
- **URL dynamique** : `NEXT_PUBLIC_API_URL` avec fallback
- **Formatage automatique** : Garantie du `/api` final
- **Logging au démarrage** : Affichage de l'URL configurée
- **Validation** : Vérification de l'URL avant utilisation

#### 🔍 **Comment vérifier :**
1. Vérifiez la console au chargement de l'application
2. Configurez `NEXT_PUBLIC_API_URL` dans `.env.local`
3. Testez avec une URL invalide pour voir les erreurs

## 🧪 **Tests complets**

### Page de test intégrée
- **URL** : `/test-integration`
- **Fonctionnalités** :
  - Test de présence des tokens
  - Test de connexion API
  - Vérification des rôles
  - Validation des cookies
  - Test des routes protégées

### Actions disponibles
- **Lancer les tests** : Validation complète de l'intégration
- **Nettoyer le stockage** : Reset localStorage + cookies
- **Synchroniser les tokens** : Récupération depuis les cookies

## 📋 **Checklist de validation**

### ✅ **Authentification JWT**
- [ ] Token stocké dans localStorage
- [ ] Token stocké dans les cookies
- [ ] Token rafraîchi automatiquement après 15min
- [ ] Déconnexion propre (tokens supprimés)
- [ ] Logs des opérations JWT visibles

### ✅ **Protection des routes**
- [ ] Routes publiques accessibles sans authentification
- [ ] Routes protégées redirigent vers `/login`
- [ ] Vérification des rôles fonctionnelle
- [ ] Redirection si mauvais rôle
- [ ] Middleware activé et fonctionnel

### ✅ **Appels API**
- [ ] URL de base correctement configurée
- [ ] Token JWT ajouté aux headers
- [ ] Intercepteur de rafraîchissement actif
- [ ] Logs des requêtes/réponses
- [ ] Gestion des erreurs 401

## 🚨 **Problèmes identifiés et corrigés**

### 1. **Middleware incohérent**
- ❌ **Avant** : Utilisait AuthService (non disponible côté serveur)
- ✅ **Après** : Vérification directe des cookies

### 2. **Stockage uniquement localStorage**
- ❌ **Avant** : Tokens uniquement dans localStorage
- ✅ **Après** : Double stockage localStorage + cookies

### 3. **Pas de logs de débogage**
- ❌ **Avant** : Pas de visibilité sur les opérations
- ✅ **Après** : Logging détaillé dans console

### 4. **URL API non validée**
- ❌ **Avant** : URL utilisée directement
- ✅ **Après** : Formatage et validation automatiques

## 🎯 **Pour tester manuellement**

### 1. **Test complet du flux JWT**
```bash
# 1. Ouvrir la console du navigateur
# 2. Aller sur /login
# 3. Se connecter avec des identifiants valides
# 4. Observer les logs : "🔐 Token JWT ajouté", "✅ Réponse API réussie"
# 5. Attendre 15 minutes ou supprimer manuellement le token access
# 6. Faire une action protégée et observer le rafraîchissement automatique
```

### 2. **Test des routes protégées**
```bash
# 1. Se déconnecter
# 2. Essayer /admin, /owner, /tenant → redirection vers /login
# 3. Se connecter comme locataire
# 4. Essayer /admin → redirection vers /
# 5. Essayer /tenant → accès autorisé
```

### 3. **Test de l'URL API**
```bash
# 1. Vérifier la console au démarrage
# 2. Changer NEXT_PUBLIC_API_URL dans .env.local
# 3. Redémarrer et vérifier le nouvel URL dans les logs
```

## 📊 **Résultat attendu**

Après corrections, vous devriez voir :
- ✅ Tokens correctement stockés et rafraîchis
- ✅ Routes protégées selon les rôles
- ✅ Appels API avec URL correcte
- ✅ Logs détaillés pour le débogage
- ✅ Page de test fonctionnelle

L'intégration est maintenant **robuste et sécurisée** avec une visibilité complète sur les opérations !
