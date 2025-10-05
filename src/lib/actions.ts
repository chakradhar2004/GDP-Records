
'use server';

import { z } from 'zod';
import { getFirestore, doc, collection } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';
import { analyzeGDPTrends } from '@/ai/flows/gdp-trends-analysis';
import type { GdpRecord } from './definitions';
import { addDocumentNonBlocking, deleteDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { getApps, initializeApp } from 'firebase/app';
import { firebaseConfig } from '@/firebase/config';
import { getAuth } from 'firebase/auth';


// This is a workaround to get a db instance on the server.
// It's not ideal, but it's needed for the check for existing records.
// The actual writes are done on the client.
function getDb() {
  if (!getApps().length) {
    const app = initializeApp(firebaseConfig);
    return getFirestore(app);
  }
  return getFirestore(getApps()[0]);
}


const GdpSchema = z.object({
  year: z.coerce.number().int().min(1900, "Year must be 1900 or later.").max(new Date().getFullYear() + 1, "Year cannot be in the distant future."),
  value: z.coerce.number().positive("GDP value must be a positive number."),
  country: z.string().min(1, "Country is required.")
});

export type FormState = {
  errors?: {
    year?: string[];
    value?: string[];
    country?: string[];
    _form?: string[];
  };
  message?: string;
}

export async function addGdpRecord(prevState: FormState, formData: FormData): Promise<FormState> {
  const validatedFields = GdpSchema.safeParse({
    year: formData.get('year'),
    value: formData.get('value'),
    country: formData.get('country'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }
  
  // This server action now only revalidates the path.
  // The client will handle the database write.

  revalidatePath('/');
  return { message: `Successfully added record.`};
}

export async function updateGdpRecord(id: string, value: number) {
  if (!id || typeof value !== 'number' || value <= 0) {
    return { error: 'Invalid data provided for update.' };
  }

  try {
    const db = getDb();
    const recordRef = doc(db, 'gdp_records', id);
    updateDocumentNonBlocking(recordRef, { value });
    revalidatePath('/');
    return { success: 'Record updated successfully.' };
  } catch (error: any) {
     console.error("Firestore Error in updateGdpRecord:", error);
    return { error: 'Database Error: Failed to update record.' };
  }
}

export async function deleteGdpRecord(id: string) {
  if (!id) {
    return { error: 'Invalid ID provided for deletion.' };
  }
  try {
    const db = getDb();
    const recordRef = doc(db, 'gdp_records', id);
    deleteDocumentNonBlocking(recordRef);
    revalidatePath('/');
    return { success: 'Record deleted successfully.' };
  } catch (error: any)
{
    console.error("Firestore Error in deleteGdpRecord:", error);
    return { error: 'Database Error: Failed to delete record.' };
  }
}

export async function getGdpAnalysis(data: GdpRecord[]) {
  if (!data || data.length === 0) {
    return { error: 'No data available for analysis.' };
  }
  
  try {
    const analysisInput = data.map(({ year, value }) => ({ year, value }));
    const result = await analyzeGDPTrends(analysisInput);
    return { summary: result.summary };
  } catch (error) {
    console.error('AI Analysis Error:', error);
    return { error: 'Failed to perform trend analysis.' };
  }
}
