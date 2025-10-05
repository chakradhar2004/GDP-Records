'use client';
import { useState } from 'react';
import { collection, query, orderBy } from 'firebase/firestore';
import { useCollection, useFirestore, useUser, useAuth, useMemoFirebase } from '@/firebase';
import type { GdpRecord } from '@/lib/definitions';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { GdpDataTable } from '@/components/gdp/data-table';
import { AddRecordForm } from '@/components/gdp/add-record-form';
import { AnalysisDrawer } from '@/components/gdp/analysis-drawer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Globe, TrendingUp, LogOut } from 'lucide-react';

export default function Home() {
  const [isAnalysisOpen, setAnalysisOpen] = useState(false);
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const router = useRouter();

  const firestore = useFirestore();
  const gdpRecordsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'gdp_records'), orderBy('year', 'asc'));
  }, [firestore]);

  const { data, isLoading } = useCollection<GdpRecord>(gdpRecordsQuery);

  const handleSignOut = async () => {
    await auth.signOut();
    router.push('/login');
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
        <div className="flex items-center gap-2">
          <Globe className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">GDP Insights</h1>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {isUserLoading ? (
            <Skeleton className="h-8 w-20" />
          ) : user ? (
            <Button variant="ghost" size="icon" onClick={handleSignOut}>
              <LogOut className="h-4 w-4" />
              <span className="sr-only">Sign Out</span>
            </Button>
          ) : (
            <>
              <Button asChild variant="outline">
                <Link href="/login">Login</Link>
              </Button>
              <Button asChild>
                <Link href="/register">Register</Link>
              </Button>
            </>
          )}
        </div>
      </header>
      <main className="flex flex-1 flex-col gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
        {isUserLoading ? (
          <div className="flex flex-1 items-center justify-center">
            <Skeleton className="h-32 w-full" />
          </div>
        ) : user ? (
          <>
            <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-3">
              <Card className="lg:col-span-1">
                <CardContent className="pt-6">
                  <AddRecordForm />
                </CardContent>
              </Card>
              <div className="lg:col-span-2 flex items-center justify-end">
                <Button
                  onClick={() => setAnalysisOpen(true)}
                  disabled={!data || data.length === 0}
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
              <GdpDataTable data={data || []} />
            )}
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <Card className="max-w-md text-center">
              <CardHeader>
                <CardTitle>Welcome to GDP Insights</CardTitle>
                <CardDescription>
                  Please log in or register to manage and analyze GDP data.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center gap-4">
                <Button asChild>
                  <Link href="/login">Login</Link>
                </Button>
                <Button asChild variant="secondary">
                  <Link href="/register">Register</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
      <AnalysisDrawer
        data={data || []}
        isOpen={isAnalysisOpen}
        onClose={() => setAnalysisOpen(false)}
      />
    </div>
  );
}
