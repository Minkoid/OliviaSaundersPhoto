'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth/authorization';

const statusSchema = z.enum(['NEW', 'READ', 'ARCHIVED']);

export async function updateEnquiryStatus(id: string, status: string) {
  await requireAdmin();
  const parsed = statusSchema.safeParse(status);
  if (!parsed.success) return;
  await prisma.enquiry.update({ where: { id }, data: { status: parsed.data } });
  revalidatePath('/admin/enquiries');
}
