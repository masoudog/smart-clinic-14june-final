'use client';

import React from 'react';
import Card from './Card';
import { cn } from '@/lib/utils';

interface ModalProps {
  isOpen: boolean;
  onClose?: () => void;
  children: React.ReactNode;
  className?: string;
}

/**
 * Overlay + centered Card shell, intended for the booking wizard modal.
 *
 * The card sizing/shell is Figma-grounded (see Card.tsx). The backdrop/overlay
 * treatment itself is NOT documented in Figma — static frames don't show scrim
 * opacity, blur, or dismiss behavior. It is carried over from the current app's
 * existing `.bw-overlay` pattern (dark scrim, click-outside-to-close) as a
 * deliberate, flagged judgment call, not a new invention. The `shadow-lg` used
 * below is the pre-existing (Phase-1-untouched) shadow token, reused because no
 * Figma-exact modal shadow value was obtained this session (rate-limited before
 * that pull) — flagged in the Phase 2 QA report rather than assumed silently.
 */
export default function Modal({ isOpen, onClose, children, className }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <Card className={cn('max-h-[90vh] w-full max-w-[524px] overflow-y-auto shadow-lg', className)}>
        {children}
      </Card>
    </div>
  );
}
