import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';

export function Dialog({ className, label, close, children }: {
  className: string;
  label: string;
  close: () => void;
  children: ReactNode;
}) {
  const element = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = element.current;
    if (!dialog) return;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = 'hidden';
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus();
    };
  }, []);

  return (
    <dialog ref={element} className={className} aria-label={label}
      onCancel={(event) => { event.preventDefault(); close(); }}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const { left, right, top, bottom } = event.currentTarget.getBoundingClientRect();
        if (event.clientX < left || event.clientX > right || event.clientY < top || event.clientY > bottom) close();
      }}>
      {children}
    </dialog>
  );
}
