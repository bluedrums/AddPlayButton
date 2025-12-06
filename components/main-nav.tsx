'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { PlaylistIcon, PlayIcon } from '@/components/icons/main-nav-icons';

export function MainNav() {
  const pathname = usePathname();


  const navItems = [
    { href: '/', label: 'Buttons', icon: PlayIcon },
    { href: '/playlists', label: 'Playlists', icon: PlaylistIcon },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#9334EB] border-t border-gray-200 shadow-md z-[999999]">
      <div className="flex justify-around max-w-lg mx-auto">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link href={href} key={href}>
            <div
              className={cn(
                'flex flex-col items-center justify-center w-full pt-2 pb-1 text-sm font-medium transition-colors',
                pathname === href
                  ? 'text-white'
                  : 'text-white hover:text-white'
              )}
            >
              <Icon className="w-6 h-6 mb-1 text-white" />
              <span>{label}</span>
            </div>
          </Link>
        ))}
      </div>
    </nav>
  );
}

