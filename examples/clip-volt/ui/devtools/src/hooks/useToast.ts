import { useEffect, useState } from 'react';

export function useToast() {
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    if (!toastMessage) return;
    const timeout = window.setTimeout(() => setToastMessage(''), 1500);
    return () => window.clearTimeout(timeout);
  }, [toastMessage]);

  return { toastMessage, setToastMessage };
}
