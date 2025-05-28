import { useState } from 'react';
import { useEffect } from 'react';

/**
 * Hook to check if the JavaScript is loaded.
 *
 * @returns - True if the JavaScript is loaded, false otherwise.
 */
export function useJsLoaded() {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (
      document.readyState === 'complete' ||
      document.readyState === 'interactive'
    ) {
      setLoaded(true);
      return;
    }

    const onReady = () => setLoaded(true);
    document.addEventListener('DOMContentLoaded', onReady);
    window.addEventListener('load', onReady);

    return () => {
      document.removeEventListener('DOMContentLoaded', onReady);
      window.removeEventListener('load', onReady);
    };
  }, []);

  return loaded;
}
