import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';

/**
 * Hook to manage dynamic back navigation based on the referrer
 * Returns a function that navigates back to the previous page or a fallback route
 */
export function useNavigationHistory(fallbackRoute: string = '/') {
  const router = useRouter();
  const referrerRef = useRef<string | null>(null);

  useEffect(() => {
    // Capture the referrer when the component mounts
    if (typeof window !== 'undefined' && document.referrer) {
      const referrerUrl = new URL(document.referrer);
      const currentUrl = new URL(window.location.href);
      
      // Only use referrer if it's from the same origin
      if (referrerUrl.origin === currentUrl.origin) {
        referrerRef.current = referrerUrl.pathname + referrerUrl.search;
      }
    }
  }, []);

  const goBack = () => {
    // Try to use browser history first
    if (typeof window !== 'undefined' && window.history.length > 1) {
      // Check if we have a referrer from our app
      if (referrerRef.current) {
        router.push(referrerRef.current);
      } else {
        // Use browser back
        router.back();
      }
    } else {
      // Fallback to the specified route
      router.push(fallbackRoute);
    }
  };

  return { goBack, referrer: referrerRef.current };
}
