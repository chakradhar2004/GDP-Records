
'use server';

import { z } from 'zod';
import { db } from '@/lib/firebase';
import { collection, addDoc, doc, updateDoc, deleteDoc, getDocs, query, where } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';
import { analyzeGDPTrends } from '@/ai/flows/gdp-trends-analysis';
import type { GdpRecord } from './definitions';

const GdpSchema = z.object({
  year: z.coerce.number().int().min(1900, "Year must be 1900 or later.").max(new Date().getFullYear() + 1, "Year cannot be in the distant future."),
  value: z.coerce.number().positive("GDP value must be a positive number."),
});

export type FormState = {
  errors?: {
    year?: string[];
    value?: string[];
    _form?: string[];
  };
  message?: string;
}

export async function addGdpRecord(prevState: FormState, formData: FormData): Promise<FormState> {
  const validatedFields = GdpSchema.safeParse({
    year: formData.get('year'),
    value: formData.get('value'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { year, value } = validatedFields.data;
  
  try {
    // Check if a record for the year already exists
    const q = query(collection(db, 'gdp_records'), where('year', '==', year));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      return {
        errors: {
          _form: ['A record for this year already exists. Please edit the existing record or choose a different year.'],
        },
      };
    }

    await addDoc(collection(db, 'gdp_records'), {
      year,
      value,
    });
  } catch (error) {
    return {
      errors: {
        _form: ['Database Error: Failed to create GDP record.'],
      }
    };
  }

  revalidatePath('/');
  return { message: `Successfully added record for ${year}.`};
}

export async function updateGdpRecord(id: string, value: number) {
  if (!id || typeof value !== 'number' || value <= 0) {
    return { error: 'Invalid data provided for update.' };
  }

  try {
    const recordRef = doc(db, 'gdp_records', id);
    await updateDoc(recordRef, { value });
    revalidatePath('/');
    return { success: 'Record updated successfully.' };
  } catch (error) {
    return { error: 'Database Error: Failed to update record.' };
  }
}

export async function deleteGdpRecord(id: string) {
  if (!id) {
    return { error: 'Invalid ID provided for deletion.' };
  }
  try {
    await deleteDoc(doc(db, 'gdp_records', id));
    revalidatePath('/');
    return { success: 'Record deleted successfully.' };
  } catch (error) {
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
