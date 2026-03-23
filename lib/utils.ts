// Fonctions utilitaires pour le formattage

export function formatCurrency(amount: number, currency = 'XOF'): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getBackendOrigin(): string {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';

  try {
    const parsed = new URL(apiUrl);
    return parsed.origin;
  } catch {
    return 'http://127.0.0.1:8000';
  }
}

export function normalizeMediaUrl(pathOrUrl?: string | null): string {
  if (!pathOrUrl || typeof pathOrUrl !== 'string') {
    return '/window.svg';
  }

  const value = pathOrUrl.trim();
  if (!value) {
    return '/window.svg';
  }

  if (value.startsWith('http://') || value.startsWith('https://') || value.startsWith('data:')) {
    return value;
  }

  if (value.startsWith('/')) {
    return `${getBackendOrigin()}${value}`;
  }

  return `${getBackendOrigin()}/${value}`;
}
