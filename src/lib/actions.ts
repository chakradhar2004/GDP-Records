
'use server';

import { z } from 'zod';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { collection, addDoc, doc, updateDoc, deleteDoc, getDocs, query, where } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';
import { analyzeGDPTrends } from '@/ai/flows/gdp-trends-analysis';
import type { GdpRecord } from './definitions';
import { addDocumentNonBlocking, deleteDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';

// Initialize Firebase Admin SDK for server-side actions
if (!getApps().length) {
  try {
    // This will automatically use the service account credentials from the environment
    initializeApp();
  } catch (e) {
    console.error('Failed to initialize Firebase Admin SDK automatically.', e);
    // Fallback for local development if GOOGLE_APPLICATION_CREDENTIALS is not set
    // You might need to point to your service account key file.
    // initializeApp({
    //   credential: cert(process.env.GOOGLE_APPLICATION_CREDENTIALS!)
    // });
  }
}

const serverDb = getFirestore();

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
    const q = serverDb.collection('gdp_records').where('year', '==', year);
    const querySnapshot = await q.get();

    if (!querySnapshot.empty) {
      return {
        errors: {
          _form: ['A record for this year already exists. Please edit the existing record or choose a different year.'],
        },
      };
    }
    
    // Use the admin SDK to add a document
    await serverDb.collection('gdp_records').add({
      year,
      value,
    });

  } catch (error: any) {
    console.error("Firestore Error in addGdpRecord:", error);
    return {
      errors: {
        _form: ['Database Error: Failed to create GDP record.', error.message],
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
    const recordRef = serverDb.collection('gdp_records').doc(id);
    await recordRef.update({ value });
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
    await serverDb.collection('gdp_records').doc(id).delete();
    revalidatePath('/');
    return { success: 'Record deleted successfully.' };
  } catch (error: any) {
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
