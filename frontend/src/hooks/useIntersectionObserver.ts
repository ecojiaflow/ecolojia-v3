// /src/hooks/useIntersectionObserver.ts
import { useEffect, useRef } from 'react';

interface UseIntersectionObserverOptions {
  threshold?: number | number[];
  root?: Element | null;
  rootMargin?: string;
  freezeOnceVisible?: boolean;
}

export const useIntersectionObserver = (
  elementRef: React.RefObject<Element>,
  callback: (isIntersecting: boolean, entry?: IntersectionObserverEntry) => void,
  options: UseIntersectionObserverOptions = {},
  enabled: boolean = true
): boolean => {
  const {
    threshold = 0,
    root = null,
    rootMargin = '0px',
    freezeOnceVisible = false
  } = options;

  const observerRef = useRef<IntersectionObserver | null>(null);
  const wasVisibleRef = useRef(false);

  useEffect(() => {
    const element = elementRef.current;
    
    if (!enabled || !element || typeof IntersectionObserver === 'undefined') {
      return;
    }

    // Si freezeOnceVisible est activé et l'élément a déjà été visible
    if (freezeOnceVisible && wasVisibleRef.current) {
      return;
    }

    const observerParams = { threshold, root, rootMargin };

    const handleIntersection = (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      const isIntersecting = entry.isIntersecting;

      if (isIntersecting) {
        wasVisibleRef.current = true;
      }

      callback(isIntersecting, entry);

      // Si freezeOnceVisible et maintenant visible, déconnecter l'observer
      if (freezeOnceVisible && isIntersecting && observerRef.current) {
        observerRef.current.disconnect();
      }
    };

    observerRef.current = new IntersectionObserver(handleIntersection, observerParams);
    observerRef.current.observe(element);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [elementRef, callback, threshold, root, rootMargin, freezeOnceVisible, enabled]);

  return wasVisibleRef.current;
};