import type { ReactNode } from 'react';

interface SectionCardProps {
  title: string;
  children: ReactNode;
  className?: string;
}

export function SectionCard({ title, children, className = '' }: SectionCardProps) {
  return (
    <div className={`bg-white dark:bg-neutral-800 rounded-2xl border border-stone-200 dark:border-neutral-700 shadow-sm p-5 ${className}`}>
      <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-400 dark:text-neutral-500 mb-4">
        {title}
      </h2>
      {children}
    </div>
  );
}
