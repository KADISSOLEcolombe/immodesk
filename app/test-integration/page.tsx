"use client";

import { useEffect, useState } from 'react';
import { AuthService } from '@/lib/auth-service';
import { PatrimoineService } from '@/lib/patrimoine-service';

export default function IntegrationTestPage() {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addResult = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
    setTestResults(prev => [...prev, `${icon} ${message}`]);
  };

  const runTests = async () => {
    setTestResults([]);
    setIsLoading(true);
    addResult('Début des tests d\'intégration...', 'info');

    // Test 1: Vérification de l'URL de l'API
    addResult(`URL API: ${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api'}`, 'info');

    // Test 2: Vérification des tokens
    const hasAccessToken = !!AuthService.getAccessToken();
    const hasRefreshToken = !!AuthService.getRefreshToken();
    const isAuthenticated = AuthService.isAuthenticated();

    addResult(`Token d'accès présent: ${hasAccessToken ? 'Oui' : 'Non'}`, hasAccessToken ? 'success' : 'error');
    addResult(`Token de rafraîchissement présent: ${hasRefreshToken ? 'Oui' : 'Non'}`, hasRefreshToken ? 'success' : 'error');
    addResult(`Utilisateur authentifié: ${isAuthenticated ? 'Oui' : 'Non'}`, isAuthenticated ? 'success' : 'error');

    // Test 3: Vérification du rôle
    const userRole = AuthService.getUserRole();
    addResult(`Rôle utilisateur: ${userRole || 'Non défini'}`, userRole ? 'success' : 'error');

    // Test 4: Test de connexion API (si authentifié)
    if (isAuthenticated) {
      try {
        addResult('Test de connexion API...', 'info');
        const response = await PatrimoineService.getCategories();
        
        if (response.success) {
          addResult(`Connexion API réussie: ${response.data?.length || 0} catégories trouvées`, 'success');
        } else {
          addResult(`Erreur API: ${response.message}`, 'error');
        }
      } catch (error) {
        addResult(`Erreur de connexion API: ${error}`, 'error');
      }
    } else {
      addResult('Utilisateur non authentifié, test API ignoré', 'info');
    }

    // Test 5: Vérification des cookies
    if (typeof window !== 'undefined') {
      const cookies = document.cookie.split(';');
      const hasCookieToken = cookies.some(cookie => cookie.trim().startsWith('access_token='));
      const hasCookieRole = cookies.some(cookie => cookie.trim().startsWith('user_role='));
      
      addResult(`Cookie token présent: ${hasCookieToken ? 'Oui' : 'Non'}`, hasCookieToken ? 'success' : 'error');
      addResult(`Cookie rôle présent: ${hasCookieRole ? 'Oui' : 'Non'}`, hasCookieRole ? 'success' : 'error');
    }

    // Test 6: Vérification de la protection des routes
    const currentPath = window.location.pathname;
    const protectedRoutes = ['/admin', '/owner', '/tenant'];
    const isProtectedRoute = protectedRoutes.some(route => currentPath.startsWith(route));
    
    if (isProtectedRoute) {
      addResult(`Route protégée détectée: ${currentPath}`, 'info');
      if (isAuthenticated) {
        addResult('Accès autorisé (utilisateur authentifié)', 'success');
      } else {
        addResult('Accès non autorisé (utilisateur non authentifié)', 'error');
      }
    } else {
      addResult(`Route publique: ${currentPath}`, 'info');
    }

    addResult('Tests terminés!', 'info');
    setIsLoading(false);
  };

  const clearStorage = () => {
    AuthService.clearStorage();
    if (typeof window !== 'undefined') {
      document.cookie = 'access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      document.cookie = 'refresh_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      document.cookie = 'user_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    }
    setTestResults(['🗑️ Stockage nettoyé']);
  };

  const syncTokens = () => {
    AuthService.syncTokensFromCookies();
    setTestResults(['🔄 Tokens synchronisés depuis les cookies']);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">🧪 Tests d'Intégration Frontend-Backend</h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Actions</h2>
          <div className="flex gap-4 flex-wrap">
            <button
              onClick={runTests}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? 'Tests en cours...' : 'Lancer les tests'}
            </button>
            <button
              onClick={clearStorage}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Nettoyer le stockage
            </button>
            <button
              onClick={syncTokens}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Synchroniser les tokens
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Résultats des tests</h2>
          <div className="space-y-2 font-mono text-sm">
            {testResults.length === 0 ? (
              <p className="text-gray-500">Cliquez sur "Lancer les tests" pour commencer...</p>
            ) : (
              testResults.map((result, index) => (
                <div key={index} className="p-2 bg-gray-50 rounded border-l-4 border-gray-300">
                  {result}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mt-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Informations système</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <strong>URL API:</strong> {process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api'}
            </div>
            <div>
              <strong>Environnement:</strong> {process.env.NODE_ENV || 'development'}
            </div>
            <div>
              <strong>Path actuel:</strong> {typeof window !== 'undefined' ? window.location.pathname : 'N/A'}
            </div>
            <div>
              <strong>User Agent:</strong> {typeof window !== 'undefined' ? navigator.userAgent.slice(0, 50) + '...' : 'N/A'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
