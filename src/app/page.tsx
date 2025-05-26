import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, BookOpenText, Cpu, Zap } from 'lucide-react';
import Image from 'next/image';

export default function HomePage() {
  return (
    <div className="flex flex-col items-center space-y-12">
      <section className="text-center space-y-6 pt-8">
        <h1 className="text-5xl font-bold tracking-tight text-primary">Welcome to Chess Ascent</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Elevate your chess skills from beginner to intermediate with our AI-powered learning platform. Intuitive, engaging, and designed for all skill levels.
        </p>
        <div className="space-x-4">
          <Button size="lg" asChild>
            <Link href="/tutorials">
              Start Learning <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/play">
              Play vs AI <Cpu className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>

      <section className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-3 gap-8">
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader>
            <div className="flex items-center space-x-3 mb-2">
              <BookOpenText className="h-8 w-8 text-accent" />
              <CardTitle className="text-2xl">Beginner Tutorials</CardTitle>
            </div>
            <CardDescription>Master the fundamentals with interactive lessons on piece movements and basic rules.</CardDescription>
          </CardHeader>
          <CardContent>
            <Image src="https://placehold.co/600x400.png" alt="Tutorials" width={600} height={400} className="rounded-md object-cover" data-ai-hint="chess tutorial" />
            <Button variant="link" asChild className="mt-4 p-0 text-primary">
              <Link href="/tutorials">Explore Tutorials <ArrowRight className="ml-1 h-4 w-4" /></Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader>
            <div className="flex items-center space-x-3 mb-2">
              <Cpu className="h-8 w-8 text-accent" />
              <CardTitle className="text-2xl">Play Against AI</CardTitle>
            </div>
            <CardDescription>Challenge our AI opponent, suitable for various skill levels. Practice makes perfect!</CardDescription>
          </CardHeader>
          <CardContent>
             <Image src="https://placehold.co/600x400.png" alt="Play AI" width={600} height={400} className="rounded-md object-cover" data-ai-hint="chess game" />
            <Button variant="link" asChild className="mt-4 p-0 text-primary">
              <Link href="/play">Start a Game <ArrowRight className="ml-1 h-4 w-4" /></Link>
            </Button>
          </CardContent>
        </Card>
        
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader>
            <div className="flex items-center space-x-3 mb-2">
              <Zap className="h-8 w-8 text-accent" />
              <CardTitle className="text-2xl">AI-Powered Insights</CardTitle>
            </div>
            <CardDescription>Receive personalized move suggestions during tutorials and in-depth feedback after games.</CardDescription>
          </CardHeader>
          <CardContent>
            <Image src="https://placehold.co/600x400.png" alt="AI Feedback" width={600} height={400} className="rounded-md object-cover" data-ai-hint="artificial intelligence brain" />
             <p className="mt-4 text-sm text-muted-foreground">Available in tutorials and post-game analysis.</p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
