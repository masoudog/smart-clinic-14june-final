import React from 'react';
import { cn } from '@/lib/utils';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padded?: boolean;
}

/**
 * Generic content shell — grounded in the booking wizard's own card container
 * (node 184:997 / 184:1209 "ReservedFromIran" root: bg-white, p-[24px], rounded-[16px]).
 *
 * No dedicated "Card" component-states sheet exists in Figma for the landing-page
 * service/contact cards specifically — that pull was blocked by the Figma MCP rate
 * limit this session (see Phase 2 QA report). This primitive implements the one card
 * shell pattern that IS Figma-grounded (the wizard's own container). The landing-page
 * service/contact card variants (IconCard) are deferred to a follow-up phase per your
 * decision, rather than guessed at here.
 */
export default function Card({ children, className, padded = true }: CardProps) {
  return (
    <div className={cn('rounded-[16px] bg-white', padded && 'p-6', className)}>
      {children}
    </div>
  );
}
