'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

// PlayIcon from components/icons/Icon/Filled/Play.svg
const PlayIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path d="M29.1827 23.4967C30.2937 22.5098 30.9999 21.326 31 20.0008C31.0001 18.6757 30.2941 17.4916 29.1834 16.5043C29.1214 16.4492 29.0594 16.3982 28.999 16.3511C28.534 15.9885 25.8693 13.9377 22.701 12.0748C19.3317 10.0937 15.729 8.52206 15.4962 8.42104L15.4636 8.40708C14.1835 7.86811 12.8504 7.84059 11.7215 8.46752C10.5922 9.09474 9.84357 10.2788 9.53601 11.7957C9.50998 11.924 9.49302 12.0458 9.48078 12.1594C9.39917 12.9166 9 16.7789 9 20.0002C9 23.2214 9.39915 27.0835 9.48077 27.8409C9.49302 27.9545 9.50999 28.0764 9.53604 28.2049C9.84363 29.7214 10.5922 30.9051 11.7214 31.5323C12.85 32.1591 14.1828 32.132 15.4628 31.5936L15.4965 31.5792C15.732 31.477 19.3331 29.9061 22.701 27.9259C25.8707 26.0622 28.5363 24.0102 28.9997 23.6488C29.0596 23.602 29.1211 23.5514 29.1827 23.4967Z" fill="white"/>
  </svg>
);

// PlaylistIcon from components/icons/Icon/Filled/Playlist.svg
const PlaylistIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path fillRule="evenodd" clipRule="evenodd" d="M8 12C7.44772 12 7 12.4477 7 13C7 13.5523 7.44772 14 8 14H20C20.5523 14 21 13.5523 21 13C21 12.4477 20.5523 12 20 12H8ZM8 18C7.44772 18 7 18.4477 7 19C7 19.5523 7.44772 20 8 20H20C20.5523 20 21 19.5523 21 19C21 18.4477 20.5523 18 20 18H8ZM8 24C7.44772 24 7 24.4477 7 25C7 25.5523 7.44772 26 8 26H16C16.5523 26 17 25.5523 17 25C17 24.4477 16.5523 24 16 24H8Z" fill="white"/>
    <path d="M25.9585 15.8658L29.9963 14.6387C31.7871 14.0945 33 12.4289 33 10.5546V9.01682C33 7.66561 31.6878 6.66417 30.3721 7.10267L26.8425 8.27906C25.0033 8.89208 23.9585 10.943 23.9585 12.9847V24.7817H22.9723C20.1864 24.7817 18 27.1261 18 29.9272C18 31.5836 19.2972 33 20.9862 33C23.6335 33 25.7394 30.8831 25.9424 28.269H25.9585V15.8658Z" fill="white"/>
  </svg>
);

export function MainNav() {
  const pathname = usePathname();


  const navItems = [
    { href: '/', label: 'Buttons', icon: PlayIcon },
    { href: '/playlists', label: 'Playlists', icon: PlaylistIcon },
  ];

  return (
    <nav data-main-nav="true" className="fixed bottom-0 left-0 right-0 bg-[#8A63D3] border-t border-gray-200 shadow-md z-[999999]">
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

