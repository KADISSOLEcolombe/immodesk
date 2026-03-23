"use client";

import { useEffect, useMemo, useState } from 'react';
import { normalizeMediaUrl } from '@/lib/utils';

type ProtectedMediaImageProps = {
  src: string;
  alt: string;
  className?: string;
  fallbackSrc?: string;
};

const blobCache = new Map<string, string>();

function isRemoteHttpUrl(value: string): boolean {
  return value.startsWith('http://') || value.startsWith('https://');
}

function looksLikeMediaPath(value: string): boolean {
  return value.startsWith('/media/') || value.startsWith('media/');
}

function normalizeCandidateSource(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return '';
  }

  // Garantit que les chemins media relatifs pointent vers le backend Django.
  if (looksLikeMediaPath(trimmed)) {
    return normalizeMediaUrl(trimmed.startsWith('/') ? trimmed : `/${trimmed}`);
  }

  if (isRemoteHttpUrl(trimmed)) {
    try {
      const parsed = new URL(trimmed);

      // Si une URL media pointe par erreur vers le frontend, on la rebascule vers le backend.
      if (parsed.pathname.startsWith('/media/')) {
        return normalizeMediaUrl(parsed.pathname);
      }
    } catch {
      return trimmed;
    }
  }

  return trimmed;
}

export default function ProtectedMediaImage({
  src,
  alt,
  className,
  fallbackSrc = '/window.svg',
}: ProtectedMediaImageProps) {
  const [resolvedSrc, setResolvedSrc] = useState<string>(fallbackSrc);

  const normalizedSrc = useMemo(
    () => (typeof src === 'string' ? normalizeCandidateSource(src) : ''),
    [src],
  );

  useEffect(() => {
    let isActive = true;

    const loadImage = async () => {
      if (!normalizedSrc) {
        setResolvedSrc(fallbackSrc);
        return;
      }

      if (!isRemoteHttpUrl(normalizedSrc)) {
        setResolvedSrc(normalizedSrc);
        return;
      }

      const cached = blobCache.get(normalizedSrc);
      if (cached) {
        setResolvedSrc(cached);
        return;
      }

      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
        const response = await fetch(normalizedSrc, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          credentials: 'include',
        });

        // Evite d'interpréter une page login HTML comme image.
        const contentType = response.headers.get('content-type') || '';
        const redirectedToLogin = response.url.includes('/login');

        if (!response.ok || redirectedToLogin || contentType.includes('text/html')) {
          throw new Error(`Image request failed (${response.status})`);
        }

        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);
        blobCache.set(normalizedSrc, objectUrl);

        if (isActive) {
          setResolvedSrc(objectUrl);
        }
      } catch (error) {
        if (isActive) {
          // Fallback: tentative directe (utile si media est public sans auth bearer).
          if (isRemoteHttpUrl(normalizedSrc)) {
            setResolvedSrc(normalizedSrc);
          } else {
            setResolvedSrc(fallbackSrc);
          }
        }
      }
    };

    loadImage();

    return () => {
      isActive = false;
    };
  }, [fallbackSrc, normalizedSrc]);

  return (
    <img
      src={resolvedSrc}
      alt={alt}
      className={className}
      onError={(event) => {
        event.currentTarget.src = fallbackSrc;
      }}
    />
  );
}
