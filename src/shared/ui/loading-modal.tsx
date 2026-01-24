'use client';

import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { cn } from '@/lib/utils';

interface LoadingModalProps {
  isOpen: boolean;
  message?: string;
  className?: string;
}

export function LoadingModal({
  isOpen,
  message = "One moment while we setup your account",
  className
}: LoadingModalProps) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  React.useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  if (!mounted || !isOpen) return null;

  return ReactDOM.createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Loading"
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center",
        "animate-in fade-in duration-200",
        !isOpen && "animate-out fade-out duration-200"
      )}
    >
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        aria-hidden="true"
      />

      <div
        className={cn(
          "relative z-10 mx-4 flex flex-col items-center gap-4 rounded-xl bg-card px-8 py-6 shadow-lg",
          "animate-in zoom-in-95 duration-200",
          !isOpen && "animate-out zoom-out-95 duration-200",
          className
        )}
      >
        <div className="flex space-x-1" aria-label="Loading animation">
          <span className="sr-only">Loading...</span>
          <div className="h-2 w-2 animate-pulse rounded-full bg-primary animation-delay-0"></div>
          <div className="h-2 w-2 animate-pulse rounded-full bg-primary animation-delay-200"></div>
          <div className="h-2 w-2 animate-pulse rounded-full bg-primary animation-delay-400"></div>
        </div>

        <p className="text-center text-sm font-medium text-card-foreground">
          {message}
        </p>
      </div>
    </div>,
    document.body
  );
}