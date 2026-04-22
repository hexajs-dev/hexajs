import { Check } from 'lucide-react';

type ToastProps = { message: string };

export function Toast({ message }: ToastProps) {
  if (!message) return null;
  return <div className="dt-toast"><Check size={14} /> {message}</div>;
}
