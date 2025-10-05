'use client';
import { useFormStatus } from 'react-dom';
import { addGdpRecord } from '@/lib/actions';
import { useEffect, useRef, useActionState } from 'react';
import { useToast } from '@/hooks/use-toast';

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { LoaderCircle, PlusCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? (
        <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <PlusCircle className="mr-2 h-4 w-4" />
      )}
      Add Record
    </Button>
  );
}

export function AddRecordForm() {
  const initialState = { message: '', errors: {} };
  const [state, dispatch] = useActionState(addGdpRecord, initialState);
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.message) {
      toast({
        title: 'Success!',
        description: state.message,
      });
      formRef.current?.reset();
    }
    if (state?.errors?._form) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: state.errors._form.join(', '),
      });
    }
  }, [state, toast]);

  return (
    <form ref={formRef} action={dispatch} className="space-y-4">
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
        />
        <div id="year-error" aria-live="polite" aria-atomic="true">
          {state?.errors?.year &&
            state.errors.year.map((error: string) => (
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
        />
        <div id="value-error" aria-live="polite" aria-atomic="true">
          {state?.errors?.value &&
            state.errors.value.map((error: string) => (
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
        />
        <div id="country-error" aria-live="polite" aria-atomic="true">
          {state?.errors?.country &&
            state.errors.country.map((error: string) => (
              <p className="mt-2 text-sm text-destructive" key={error}>
                {error}
              </p>
            ))}
        </div>
      </div>
      
      {state?.errors?._form && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {state.errors._form.join(', ')}
          </AlertDescription>
        </Alert>
      )}

      <SubmitButton />
    </form>
  );
}
