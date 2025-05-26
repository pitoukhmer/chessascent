'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserIcon, Award, TrendingUp, BarChartIcon } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export default function ProfilePage() {
  // Mocked data for now
  const [userName, setUserName] = useState<string>('ChessPlayer123');
  const [rating, setRating] = useState<number>(1350);
  const [gamesPlayed, setGamesPlayed] = useState<number>(78);
  const [winRate, setWinRate] = useState<number>(55); // Percentage
  const [memberSince, setMemberSince] = useState<string>('');

  useEffect(() => {
    // Simulate fetching memberSince date
    const joinDate = new Date(new Date().setFullYear(new Date().getFullYear() - 1)); // Joined 1 year ago
    setMemberSince(joinDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }));
    
    // Simulate rating change for dynamic progress bar
    const interval = setInterval(() => {
      setRating(prev => {
        const newRating = prev + Math.floor(Math.random() * 10) - 4;
        return Math.max(800, Math.min(2200, newRating)); // Keep rating within a range
      });
    }, 5000);
    return () => clearInterval(interval);

  }, []);

  const getRatingTier = (r: number) => {
    if (r < 1000) return 'Novice';
    if (r < 1400) return 'Beginner';
    if (r < 1800) return 'Intermediate';
    if (r < 2200) return 'Advanced';
    return 'Expert';
  };

  const ratingProgress = ((rating - 800) / (2200 - 800)) * 100; // Assuming rating range 800-2200

  return (
    <div className="space-y-8">
      <header className="text-center space-y-2">
        <h1 className="text-4xl font-bold text-primary">Your Profile</h1>
        <p className="text-lg text-muted-foreground">
          Track your progress and view your chess statistics.
        </p>
      </header>

      <Card className="max-w-2xl mx-auto shadow-xl">
        <CardHeader className="flex flex-col items-center space-y-4 p-6 bg-secondary/30 rounded-t-lg">
          <Avatar className="h-24 w-24 border-4 border-primary">
            <AvatarImage src={`https://placehold.co/100x100.png?text=${userName.substring(0,1)}`} alt={userName} data-ai-hint="profile avatar" />
            <AvatarFallback className="text-3xl bg-primary text-primary-foreground">{userName.substring(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="text-center">
            <CardTitle className="text-3xl">{userName}</CardTitle>
            <CardDescription className="text-md">Member since {memberSince}</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center text-lg">
                <Award className="mr-3 h-6 w-6 text-accent" />
                <span className="font-medium">Rating:</span>
              </div>
              <span className="text-2xl font-bold text-primary">{rating}</span>
            </div>
            <div className="space-y-1">
               <div className="flex justify-between text-sm text-muted-foreground">
                 <span>{getRatingTier(rating)}</span>
                 <span>Next tier at { (Math.floor(rating/400)+1)*400 }</span>
               </div>
               <Progress value={ratingProgress} className="h-3 [&>div]:bg-gradient-to-r [&>div]:from-accent [&>div]:to-yellow-400" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="flex items-center p-4 bg-secondary/50 rounded-lg">
              <BarChartIcon className="mr-3 h-7 w-7 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Games Played</p>
                <p className="text-xl font-semibold">{gamesPlayed}</p>
              </div>
            </div>
            <div className="flex items-center p-4 bg-secondary/50 rounded-lg">
              <TrendingUp className="mr-3 h-7 w-7 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Win Rate</p>
                <p className="text-xl font-semibold">{winRate}%</p>
              </div>
            </div>
          </div>
          
          {/* Placeholder for future features like achievements or game history */}
          <div className="text-center pt-4">
            <p className="text-sm text-muted-foreground">More statistics and features coming soon!</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
