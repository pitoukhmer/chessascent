
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { HomeIcon, LibraryIcon, CpuIcon, UserIcon, PlayIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const navItems = [
  { href: '/', label: 'Home', icon: HomeIcon },
  { href: '/tutorials', label: 'Tutorials', icon: LibraryIcon },
  { href: '/play', label: 'Play Chess', icon: PlayIcon },
  { href: '/profile', label: 'Profile', icon: UserIcon },
];

export function NavigationMenu() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center space-x-2">
      {navItems.map((item) => {
        const isActive = pathname === item.href || (item.href === '/play' && pathname.startsWith('/play')); // Highlight /play for /play/*
        return (
          <Button
            key={item.href}
            variant={isActive ? 'secondary' : 'ghost'}
            size="sm"
            asChild
            className={cn(
              "flex items-center space-x-2 px-3 py-2 rounded-md",
              isActive ? "font-semibold" : "font-normal"
            )}
          >
            <Link href={item.href}>
              <item.icon className={cn("h-5 w-5", isActive ? "text-primary" : "text-muted-foreground")} />
              <span>{item.label}</span>
            </Link>
          </Button>
        );
      })}
    </nav>
  );
}
