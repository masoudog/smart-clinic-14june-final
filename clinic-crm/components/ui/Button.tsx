'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export type ButtonVariant = 'primary' | 'secondary';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  icon?: React.ReactNode;
}

/**
 * Figma-grounded button primitive.
 * - primary/enabled: node 184:2251 (bg primary-500, white text, optional leading icon)
 * - primary/disabled: node 184:1008 (bg neutral-100, same shape, text stays white)
 * - secondary: node 184:1259 ("قبلی" back button — white bg, neutral-100 border, neutral-800 text, no icon)
 *
 * Hover/focus states are not shown in any static Figma frame — the hover styles below
 * are an inferred, non-Figma-sourced addition (flagged in the Phase 2 QA report), added
 * only so the primitive isn't visually inert on interaction.
 */
export default function Button({
  variant = 'primary',
  icon,
  disabled,
  className,
  children,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-[8px] px-5 py-2 text-body font-semibold transition-opacity disabled:cursor-not-allowed',
        variant === 'primary' && !disabled && 'bg-primary-500 text-white hover:opacity-90',
        variant === 'primary' && disabled && 'bg-neutral-100 text-white',
        variant === 'secondary' && '!border !border-solid !border-neutral-100 bg-white font-medium text-neutral-800 hover:bg-neutral-50',
        className
      )}
      {...rest}
    >
      {icon && <span className="size-6 shrink-0">{icon}</span>}
      {children}
    </button>
  );
}
