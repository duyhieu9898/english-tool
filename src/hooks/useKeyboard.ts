import { useEffect } from 'react';

type KeyHandler = (e: KeyboardEvent) => void;

interface Handlers {
  [key: string]: KeyHandler;
}

export function useKeyboard(handlers: Handlers) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input or textarea
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        // Allow Enter and Escape to pass through sometimes, depending on needs
        if (e.key !== 'Enter' && e.key !== 'Escape') {
          return;
        }
      }

      const handler = handlers[e.key] || handlers[e.code];
      if (handler) {
        e.preventDefault();
        handler(e);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlers]);
}
