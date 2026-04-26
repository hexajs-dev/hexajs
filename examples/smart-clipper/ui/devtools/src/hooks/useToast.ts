import { useEffect, useState } from 'react';

export function useToast() {
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    if (!toastMessage) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setToastMessage('');
    }, 1600);

    return () => window.clearTimeout(timeoutId);
  }, [toastMessage]);

  return { toastMessage, setToastMessage };
}
