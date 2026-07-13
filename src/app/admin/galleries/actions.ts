'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth/authorization';
import { gallerySchema, imageMetadataSchema, reorderSchema } from '@/lib/validation';
import { hashPassword } from '@/lib/auth/password';
import { slugify } from '@/lib/utils';
import { recordAudit } from '@/lib/audit';
import { deleteAsset } from '@/lib/images/ingest';

export interface GalleryFormState {
  ok?: boolean;
  error?: string;
}

async function uniqueGallerySlug(base: string, excludeId?: string): Promise<string> {
  const slug = slugify(base) || 'gallery';
  let candidate = slug;
  let n = 2;
  while (true) {
    const existing = await prisma.gallery.findFirst({ where: { slug: candidate } });
    if (!existing || existing.id === excludeId) return candidate;
    candidate = `${slug}-${n++}`;
  }
}

function parseGalleryForm(formData: FormData) {
  return gallerySchema.safeParse({
    ...Object.fromEntries(formData.entries()),
    isPublished: formData.get('isPublished') === 'on',
    isDisabled: formData.get('isDisabled') === 'on',
    allowImageDownload: formData.get('allowImageDownload') === 'on',
    allowGalleryDownload: formData.get('allowGalleryDownload') === 'on',
    allowFullResolution: formData.get('allowFullResolution') === 'on',
    showImageNumbers: formData.get('showImageNumbers') === 'on',
    watermarkEnabled: formData.get('watermarkEnabled') === 'on',
  });
}

export async function createGallery(
  _prev: GalleryFormState,
  formData: FormData,
): Promise<GalleryFormState> {
  const admin = await requireAdmin();
  const parsed = parseGalleryForm(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  const data = parsed.data;
  const slug = await uniqueGallerySlug(data.slug || data.title);

  const gallery = await prisma.gallery.create({
    data: {
      slug,
      title: data.title,
      clientName: data.clientName,
      shootDate: data.shootDate ? new Date(data.shootDate) : null,
      message: data.message || null,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      isPublished: data.isPublished,
      isDisabled: data.isDisabled,
      passwordHash: data.galleryPassword ? await hashPassword(data.galleryPassword) : null,
      allowImageDownload: data.allowImageDownload,
      allowGalleryDownload: data.allowGalleryDownload,
      allowFullResolution: data.allowFullResolution,
      showImageNumbers: data.showImageNumbers,
      watermarkEnabled: data.watermarkEnabled,
    },
  });
  await recordAudit({ action: 'GALLERY_CREATED', actorId: admin.id, target: `gallery:${gallery.id}` });
  revalidatePath('/admin/galleries');
  redirect(`/admin/galleries/${gallery.id}`);
}

export async function updateGallery(
  id: string,
  _prev: GalleryFormState,
  formData: FormData,
): Promise<GalleryFormState> {
  const admin = await requireAdmin();
  const parsed = parseGalleryForm(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  const data = parsed.data;
  const slug = data.slug ? await uniqueGallerySlug(data.slug, id) : undefined;

  const removePassword = formData.get('removePassword') === 'on';
  const passwordUpdate = removePassword
    ? { passwordHash: null }
    : data.galleryPassword
      ? { passwordHash: await hashPassword(data.galleryPassword) }
      : {};

  await prisma.gallery.update({
    where: { id },
    data: {
      title: data.title,
      clientName: data.clientName,
      shootDate: data.shootDate ? new Date(data.shootDate) : null,
      message: data.message || null,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      isPublished: data.isPublished,
      isDisabled: data.isDisabled,
      allowImageDownload: data.allowImageDownload,
      allowGalleryDownload: data.allowGalleryDownload,
      allowFullResolution: data.allowFullResolution,
      showImageNumbers: data.showImageNumbers,
      watermarkEnabled: data.watermarkEnabled,
      ...(slug ? { slug } : {}),
      ...passwordUpdate,
    },
  });
  await recordAudit({ action: 'GALLERY_UPDATED', actorId: admin.id, target: `gallery:${id}` });
  revalidatePath('/admin/galleries');
  revalidatePath(`/admin/galleries/${id}`);
  return { ok: true };
}

export async function toggleGalleryPublish(id: string, publish: boolean) {
  const admin = await requireAdmin();
  await prisma.gallery.update({ where: { id }, data: { isPublished: publish } });
  await recordAudit({
    action: 'GALLERY_PUBLISHED',
    actorId: admin.id,
    target: `gallery:${id}`,
    metadata: { published: publish },
  });
  revalidatePath('/admin/galleries');
  revalidatePath(`/admin/galleries/${id}`);
}

export async function toggleGalleryDisabled(id: string, disabled: boolean) {
  const admin = await requireAdmin();
  await prisma.gallery.update({ where: { id }, data: { isDisabled: disabled } });
  await recordAudit({ action: 'GALLERY_UPDATED', actorId: admin.id, target: `gallery:${id}`, metadata: { disabled } });
  revalidatePath(`/admin/galleries/${id}`);
}

export async function deleteGallery(id: string) {
  const admin = await requireAdmin();
  await prisma.gallery.update({
    where: { id },
    data: { deletedAt: new Date(), isPublished: false, isDisabled: true },
  });
  await recordAudit({ action: 'GALLERY_DELETED', actorId: admin.id, target: `gallery:${id}` });
  revalidatePath('/admin/galleries');
  redirect('/admin/galleries');
}

export async function assignClientToGallery(galleryId: string, userId: string) {
  const admin = await requireAdmin();
  await prisma.galleryAccess.upsert({
    where: { galleryId_userId: { galleryId, userId } },
    create: { galleryId, userId },
    update: { revokedAt: null },
  });
  await recordAudit({
    action: 'GALLERY_ACCESS_GRANTED',
    actorId: admin.id,
    target: `gallery:${galleryId}`,
    metadata: { userId },
  });
  revalidatePath(`/admin/galleries/${galleryId}`);
}

export async function revokeClientFromGallery(galleryId: string, userId: string) {
  const admin = await requireAdmin();
  await prisma.galleryAccess.updateMany({
    where: { galleryId, userId },
    data: { revokedAt: new Date() },
  });
  await recordAudit({
    action: 'GALLERY_ACCESS_REVOKED',
    actorId: admin.id,
    target: `gallery:${galleryId}`,
    metadata: { userId },
  });
  revalidatePath(`/admin/galleries/${galleryId}`);
}

export async function setGalleryCover(galleryId: string, galleryImageId: string) {
  await requireAdmin();
  await prisma.gallery.update({ where: { id: galleryId }, data: { coverImageId: galleryImageId } });
  revalidatePath(`/admin/galleries/${galleryId}`);
}

export async function reorderGalleryImages(galleryId: string, ids: string[]) {
  await requireAdmin();
  const parsed = reorderSchema.safeParse({ ids });
  if (!parsed.success) return;
  await prisma.$transaction(
    parsed.data.ids.map((id, index) =>
      prisma.galleryImage.update({ where: { id }, data: { sortOrder: index } }),
    ),
  );
  revalidatePath(`/admin/galleries/${galleryId}`);
}

export async function updateGalleryImageMeta(
  galleryId: string,
  galleryImageId: string,
  formData: FormData,
) {
  await requireAdmin();
  const parsed = imageMetadataSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { ok: false as const };
  const image = await prisma.galleryImage.update({
    where: { id: galleryImageId },
    data: { caption: parsed.data.caption || null },
    select: { assetId: true },
  });
  if (parsed.data.altText !== undefined) {
    await prisma.imageAsset.update({
      where: { id: image.assetId },
      data: { altText: parsed.data.altText || null },
    });
  }
  revalidatePath(`/admin/galleries/${galleryId}`);
  return { ok: true as const };
}

export async function deleteGalleryImage(galleryId: string, galleryImageId: string) {
  const admin = await requireAdmin();
  const image = await prisma.galleryImage.findUnique({
    where: { id: galleryImageId },
    select: { assetId: true },
  });
  if (!image) return;
  await prisma.galleryImage.delete({ where: { id: galleryImageId } });
  await deleteAsset(image.assetId);
  await recordAudit({ action: 'IMAGE_DELETED', actorId: admin.id, target: `galleryImage:${galleryImageId}` });
  revalidatePath(`/admin/galleries/${galleryId}`);
}
