'use client';

import { MainNav } from '@/components/main-nav';

export function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="pb-20 min-h-full">
      {children}
      <MainNav />
    </div>
  );
}

