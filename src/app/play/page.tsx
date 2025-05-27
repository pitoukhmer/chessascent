
'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bot, Zap, Handshake, ArrowRight, Users } from 'lucide-react'; // Added Users icon
import { useToast } from '@/hooks/use-toast';

export default function PlayOptionsPage() {
  const { toast } = useToast();

  const handleComingSoon = () => {
    toast({
      title: "Feature Coming Soon!",
      description: "This game mode is under development. Stay tuned!",
      duration: 3000,
    });
  };

  return (
    <div className="space-y-8">
      <header className="text-center space-y-2">
        <h1 className="text-4xl font-bold text-primary">Play Chess</h1>
        <p className="text-lg text-muted-foreground">
          Choose how you want to engage with the game.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col rounded-lg overflow-hidden">
          <CardHeader className="bg-secondary/30 p-6">
            <div className="flex items-center space-x-3 mb-2">
              <Bot className="h-10 w-10 text-accent" />
              <CardTitle className="text-2xl">Play Bot</CardTitle>
            </div>
            <CardDescription>Challenge our AI opponent. Sharpen your skills and test your strategies.</CardDescription>
          </CardHeader>
          <CardContent className="p-6 flex-grow flex flex-col justify-end">
            <Button asChild className="w-full mt-auto">
              <Link href="/play/bot">
                Start Game <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col rounded-lg overflow-hidden">
          <CardHeader className="bg-secondary/30 p-6">
            <div className="flex items-center space-x-3 mb-2">
              <Users className="h-10 w-10 text-accent" /> {/* Changed Icon */}
              <CardTitle className="text-2xl">Play a Friend (Local)</CardTitle>
            </div>
            <CardDescription>Play against a friend on the same device. Pass and play!</CardDescription>
          </CardHeader>
          <CardContent className="p-6 flex-grow flex flex-col justify-end">
            <Button asChild className="w-full mt-auto">
              <Link href="/play/local">
                Start Local Game <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col rounded-lg overflow-hidden bg-card/60 opacity-70">
          <CardHeader className="bg-secondary/20 p-6">
            <div className="flex items-center space-x-3 mb-2">
              <Zap className="h-10 w-10 text-muted-foreground" />
              <CardTitle className="text-2xl text-muted-foreground/80">Play Online</CardTitle>
            </div>
            <CardDescription className="text-muted-foreground/90">Play against a person of similar skill. (Coming Soon)</CardDescription>
          </CardHeader>
          <CardContent className="p-6 flex-grow flex flex-col justify-end">
            <Button onClick={handleComingSoon} className="w-full mt-auto" variant="outline" disabled>
              Find Match <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
