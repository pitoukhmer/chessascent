import Link from 'next/link';
import { TUTORIALS_DATA } from '@/lib/constants';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, Clock, BarChart3 } from 'lucide-react';

export default function TutorialsPage() {
  return (
    <div className="space-y-8">
      <header className="text-center space-y-2">
        <h1 className="text-4xl font-bold text-primary">Chess Tutorials</h1>
        <p className="text-lg text-muted-foreground">
          Learn chess step-by-step with our interactive tutorials.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {TUTORIALS_DATA.map((tutorial) => (
          <Card key={tutorial.slug} className="flex flex-col shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader>
              <div className="flex items-center space-x-3 mb-2">
                {tutorial.icon && <tutorial.icon />}
                <CardTitle className="text-2xl">{tutorial.title}</CardTitle>
              </div>
              <CardDescription>{tutorial.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <ul className="space-y-1 text-sm text-muted-foreground list-disc list-inside">
                {tutorial.learningObjectives.slice(0, 2).map((obj, index) => (
                  <li key={index}>{obj}</li>
                ))}
                {tutorial.learningObjectives.length > 2 && <li>And more...</li>}
              </ul>
            </CardContent>
            <CardFooter className="flex flex-col items-start space-y-3 pt-4 border-t">
              <div className="flex justify-between w-full text-sm text-muted-foreground">
                <div className="flex items-center space-x-1">
                  <Clock className="h-4 w-4" />
                  <span>{tutorial.estimatedTime}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <BarChart3 className="h-4 w-4" />
                  <span>{tutorial.difficulty}</span>
                </div>
              </div>
              <Button asChild className="w-full">
                <Link href={`/tutorials/${tutorial.slug}`}>
                  Start Tutorial <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
