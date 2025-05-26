import Link from 'next/link';
import { NavigationMenu } from '@/components/navigation-menu';
import { Crown } from 'lucide-react';

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <Crown className="h-8 w-8 text-primary" />
          <span className="font-bold text-xl text-primary">Chess Ascent</span>
        </Link>
        <NavigationMenu />
      </div>
    </header>
  );
}
