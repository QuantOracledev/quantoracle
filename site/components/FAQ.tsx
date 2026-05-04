'use client';

import { useState } from 'react';

export interface FaqItem {
  question: string;
  /** Plain text or React. JSON-LD only emits the plain-text version. */
  answer: React.ReactNode;
}

export function Faq({ items }: { items: FaqItem[] }) {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="space-y-2">
      {items.map((it, i) => {
        const isOpen = open === i;
        return (
          <div key={i} className="border border-ink-700/60 rounded-lg overflow-hidden">
            <button
              type="button"
              className="w-full flex items-center justify-between text-left px-4 py-3 hover:bg-ink-800/40"
              onClick={() => setOpen(isOpen ? null : i)}
              aria-expanded={isOpen}
            >
              <span className="font-medium text-slate-100">{it.question}</span>
              <span
                className={`text-accent transition-transform ${isOpen ? 'rotate-45' : ''}`}
                aria-hidden="true"
              >
                +
              </span>
            </button>
            {isOpen && (
              <div className="px-4 pb-4 text-sm text-slate-300 leading-relaxed border-t border-ink-700/40">
                {it.answer}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
