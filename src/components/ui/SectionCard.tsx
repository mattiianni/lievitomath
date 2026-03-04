import type { ReactNode } from 'react';

interface SectionCardProps {
  title: string;
  children: ReactNode;
  className?: string;
}

export function SectionCard({ title, children, className = '' }: SectionCardProps) {
  return (
    <div className={`bg-white dark:bg-[#1E2D5A] rounded-2xl border border-[#A19677]/25 dark:border-[#616B8F]/30 shadow-sm p-5 ${className}`}>
      <h2 className="text-sm font-semibold uppercase tracking-wide text-[#616B8F] dark:text-[#A19677] mb-4">
        {title}
      </h2>
      {children}
    </div>
  );
}
