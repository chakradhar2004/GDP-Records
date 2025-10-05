'use client';
import { useState, useEffect, useTransition } from 'react';
import { getGdpAnalysis } from '@/lib/actions';
import type { GdpRecord } from '@/lib/definitions';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Lightbulb, AlertTriangle } from 'lucide-react';

interface AnalysisDrawerProps {
  data: GdpRecord[];
  isOpen: boolean;
  onClose: () => void;
}

export function AnalysisDrawer({ data, isOpen, onClose }: AnalysisDrawerProps) {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (isOpen && data.length > 0) {
      setAnalysis(null);
      setError(null);
      startTransition(async () => {
        const result = await getGdpAnalysis(data);
        if (result.error) {
          setError(result.error);
        } else {
          setAnalysis(result.summary ?? null);
        }
      });
    }
  }, [isOpen, data]);

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>GDP Trend Analysis</SheetTitle>
          <SheetDescription>
            AI-powered insights based on the provided GDP data.
          </SheetDescription>
        </SheetHeader>
        <div className="py-6 space-y-4">
          {isPending && (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/6" />
            </div>
          )}
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Analysis Failed</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {analysis && (
            <div className="prose prose-sm dark:prose-invert text-foreground/90 bg-muted/50 p-4 rounded-md">
                <p className="flex items-start gap-2">
                    <Lightbulb className="h-5 w-5 text-accent flex-shrink-0 mt-1" />
                    <span className="whitespace-pre-wrap">{analysis}</span>
                </p>
            </div>
          )}
        </div>
        <SheetFooter>
          <Button onClick={onClose}>Close</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
