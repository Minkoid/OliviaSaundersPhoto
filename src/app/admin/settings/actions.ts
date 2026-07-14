'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth/authorization';
import { siteSettingsSchema, pageContentSchema } from '@/lib/validation';
import { recordAudit } from '@/lib/audit';

export interface SettingsFormState {
  ok?: boolean;
  error?: string;
}

export async function updateSettings(
  _prev: SettingsFormState,
  formData: FormData,
): Promise<SettingsFormState> {
  const admin = await requireAdmin();
  const parsed = siteSettingsSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }
  const d = parsed.data;
  const data = {
    studioName: d.studioName,
    tagline: d.tagline || null,
    contactEmail: d.contactEmail || null,
    contactPhone: d.contactPhone || null,
    areasServed: d.areasServed || null,
    responseTime: d.responseTime || null,
    studioLocation: d.studioLocation || null,
    instagramUrl: d.instagramUrl || null,
    pinterestUrl: d.pinterestUrl || null,
    facebookUrl: d.facebookUrl || null,
    footerText: d.footerText || null,
    seoTitle: d.seoTitle || null,
    seoDescription: d.seoDescription || null,
  };
  await prisma.siteSettings.upsert({
    where: { id: 'singleton' },
    create: { id: 'singleton', ...data },
    update: data,
  });
  await recordAudit({ action: 'SETTINGS_UPDATED', actorId: admin.id });
  revalidatePath('/', 'layout');
  return { ok: true };
}

export async function updatePage(
  key: string,
  _prev: SettingsFormState,
  formData: FormData,
): Promise<SettingsFormState> {
  const admin = await requireAdmin();
  const parsed = pageContentSchema.safeParse({
    key,
    title: formData.get('title') ?? '',
    body: formData.get('body') ?? '',
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }
  const data = { title: parsed.data.title || null, body: parsed.data.body || null };
  await prisma.pageContent.upsert({
    where: { key },
    create: { key, ...data },
    update: data,
  });
  await recordAudit({ action: 'PAGE_UPDATED', actorId: admin.id, target: `page:${key}` });
  revalidatePath('/', 'layout');
  return { ok: true };
}
