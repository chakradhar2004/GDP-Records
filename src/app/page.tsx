'use client';
import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { GdpRecord } from '@/lib/definitions';

import { GdpDataTable } from '@/components/gdp/data-table';
import { AddRecordForm } from '@/components/gdp/add-record-form';
import { AnalysisDrawer } from '@/components/gdp/analysis-drawer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Globe, TrendingUp } from 'lucide-react';

export default function Home() {
  const [data, setData] = useState<GdpRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalysisOpen, setAnalysisOpen] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'gdp_records'), orderBy('year', 'asc'));
    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const records: GdpRecord[] = [];
        querySnapshot.forEach((doc) => {
          records.push({ id: doc.id, ...doc.data() } as GdpRecord);
        });
        setData(records);
        setIsLoading(false);
      },
      (error) => {
        console.error('Error fetching GDP records: ', error);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
        <div className="flex items-center gap-2">
          <Globe className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">GDP Insights</h1>
        </div>
      </header>
      <main className="flex flex-1 flex-col gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
        <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-3">
          <Card className="lg:col-span-1">
            <CardContent className="pt-6">
              <AddRecordForm />
            </CardContent>
          </Card>
          <div className="lg:col-span-2 flex items-center justify-end">
            <Button
              onClick={() => setAnalysisOpen(true)}
              disabled={data.length === 0}
            >
              <TrendingUp className="mr-2 h-4 w-4" />
              Analyze Trends
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : (
          <GdpDataTable data={data} />
        )}
      </main>
      <AnalysisDrawer
        data={data}
        isOpen={isAnalysisOpen}
        onClose={() => setAnalysisOpen(false)}
      />
    </div>
  );
}
