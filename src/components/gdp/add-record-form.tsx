'use client';
import { useState, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { LoaderCircle, PlusCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useFirestore } from '@/firebase';
import { collection } from 'firebase/firestore';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { z } from 'zod';

const GdpSchema = z.object({
  year: z.coerce.number().int().min(1900, "Year must be 1900 or later.").max(new Date().getFullYear() + 1, "Year cannot be in the distant future."),
  value: z.coerce.number().positive("GDP value must be a positive number."),
  country: z.string().min(1, "Country is required.")
});

export function AddRecordForm() {
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const firestore = useFirestore();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<any>({});


  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});
    const formData = new FormData(e.currentTarget);
    
    const validatedFields = GdpSchema.safeParse({
      year: formData.get('year'),
      value: formData.get('value'),
      country: formData.get('country'),
    });

    if (!validatedFields.success) {
        setErrors(validatedFields.error.flatten().fieldErrors);
        setIsLoading(false);
        return;
    }

    const { year, value, country } = validatedFields.data;

    try {
        if (!firestore) {
            throw new Error("Firestore is not available");
        }
        const gdpRecordsRef = collection(firestore, 'gdp_records');
        addDocumentNonBlocking(gdpRecordsRef, { year, value, country });
        
        toast({
            title: 'Success!',
            description: `Successfully added record for ${year}.`,
        });

        formRef.current?.reset();

    } catch (error: any) {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Database Error: Failed to create GDP record.'
        });
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-lg font-medium">Add New Record</h3>
      <div className="space-y-2">
        <Label htmlFor="year">Year</Label>
        <Input
          id="year"
          name="year"
          type="number"
          placeholder="e.g., 2023"
          required
          aria-describedby="year-error"
          disabled={isLoading}
        />
        <div id="year-error" aria-live="polite" aria-atomic="true">
          {errors?.year &&
            errors.year.map((error: string) => (
              <p className="mt-2 text-sm text-destructive" key={error}>
                {error}
              </p>
            ))}
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="value">GDP Value (in Billions)</Label>
        <Input
          id="value"
          name="value"
          type="number"
          step="0.01"
          placeholder="e.g., 23320.50"
          required
          aria-describedby="value-error"
           disabled={isLoading}
        />
        <div id="value-error" aria-live="polite" aria-atomic="true">
          {errors?.value &&
            errors.value.map((error: string) => (
              <p className="mt-2 text-sm text-destructive" key={error}>
                {error}
              </p>
            ))}
        </div>
      </div>
       <div className="space-y-2">
        <Label htmlFor="country">Country</Label>
        <Input
          id="country"
          name="country"
          type="text"
          placeholder="e.g., United States"
          required
          aria-describedby="country-error"
           disabled={isLoading}
        />
        <div id="country-error" aria-live="polite" aria-atomic="true">
          {errors?.country &&
            errors.country.map((error: string) => (
              <p className="mt-2 text-sm text-destructive" key={error}>
                {error}
              </p>
            ))}
        </div>
      </div>
      
      {errors?._form && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {errors._form.join(', ')}
          </AlertDescription>
        </Alert>
      )}

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? (
            <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
        ) : (
            <PlusCircle className="mr-2 h-4 w-4" />
        )}
        Add Record
        </Button>
    </form>
  );
}
