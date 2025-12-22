'use client';

export function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="pb-20 min-h-full">
      {children}
    </div>
  );
}

