'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth/authorization';
import { portfolioSchema, imageMetadataSchema, reorderSchema } from '@/lib/validation';
import { slugify } from '@/lib/utils';
import { recordAudit } from '@/lib/audit';
import { deleteAsset } from '@/lib/images/ingest';

async function uniquePortfolioSlug(base: string, excludeId?: string): Promise<string> {
  let slug = slugify(base) || 'portfolio';
  let candidate = slug;
  let n = 2;
  while (true) {
    const existing = await prisma.portfolio.findFirst({ where: { slug: candidate } });
    if (!existing || existing.id === excludeId) return candidate;
    candidate = `${slug}-${n++}`;
  }
}

export interface PortfolioFormState {
  ok?: boolean;
  error?: string;
}

export async function createPortfolio(
  _prev: PortfolioFormState,
  formData: FormData,
): Promise<PortfolioFormState> {
  const admin = await requireAdmin();
  const parsed = portfolioSchema.safeParse({
    ...Object.fromEntries(formData.entries()),
    isPublished: formData.get('isPublished') === 'on',
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }
  const data = parsed.data;
  const slug = await uniquePortfolioSlug(data.slug || data.title);

  const portfolio = await prisma.portfolio.create({
    data: {
      slug,
      title: data.title,
      category: data.category,
      intro: data.intro || null,
      description: data.description || null,
      isPublished: data.isPublished,
      sortOrder: data.sortOrder,
    },
  });
  await recordAudit({ action: 'PORTFOLIO_CREATED', actorId: admin.id, target: `portfolio:${portfolio.id}` });
  revalidatePath('/admin/portfolios');
  redirect(`/admin/portfolios/${portfolio.id}`);
}

export async function updatePortfolio(
  id: string,
  _prev: PortfolioFormState,
  formData: FormData,
): Promise<PortfolioFormState> {
  const admin = await requireAdmin();
  const parsed = portfolioSchema.safeParse({
    ...Object.fromEntries(formData.entries()),
    isPublished: formData.get('isPublished') === 'on',
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }
  const data = parsed.data;
  const slug = data.slug ? await uniquePortfolioSlug(data.slug, id) : undefined;

  await prisma.portfolio.update({
    where: { id },
    data: {
      title: data.title,
      category: data.category,
      intro: data.intro || null,
      description: data.description || null,
      isPublished: data.isPublished,
      sortOrder: data.sortOrder,
      ...(slug ? { slug } : {}),
    },
  });
  await recordAudit({ action: 'PORTFOLIO_UPDATED', actorId: admin.id, target: `portfolio:${id}` });
  revalidatePath('/admin/portfolios');
  revalidatePath(`/admin/portfolios/${id}`);
  return { ok: true };
}

export async function togglePortfolioPublish(id: string, publish: boolean) {
  const admin = await requireAdmin();
  await prisma.portfolio.update({ where: { id }, data: { isPublished: publish } });
  await recordAudit({
    action: 'PORTFOLIO_PUBLISHED',
    actorId: admin.id,
    target: `portfolio:${id}`,
    metadata: { published: publish },
  });
  revalidatePath('/admin/portfolios');
  revalidatePath(`/admin/portfolios/${id}`);
}

export async function deletePortfolio(id: string) {
  const admin = await requireAdmin();
  // Soft-delete keeps records; hard-delete images to free storage.
  const images = await prisma.portfolioImage.findMany({ where: { portfolioId: id }, select: { assetId: true } });
  await prisma.portfolio.update({ where: { id }, data: { deletedAt: new Date(), isPublished: false } });
  await recordAudit({ action: 'PORTFOLIO_DELETED', actorId: admin.id, target: `portfolio:${id}` });
  revalidatePath('/admin/portfolios');
  // Best-effort asset cleanup happens on explicit image deletion; keep assets on soft-delete.
  void images;
  redirect('/admin/portfolios');
}

export async function setPortfolioCover(portfolioId: string, portfolioImageId: string) {
  await requireAdmin();
  await prisma.portfolio.update({ where: { id: portfolioId }, data: { coverImageId: portfolioImageId } });
  revalidatePath(`/admin/portfolios/${portfolioId}`);
}

export async function togglePortfolioImageFeatured(portfolioId: string, portfolioImageId: string, featured: boolean) {
  await requireAdmin();
  await prisma.portfolioImage.update({ where: { id: portfolioImageId }, data: { isFeatured: featured } });
  revalidatePath(`/admin/portfolios/${portfolioId}`);
}

export async function updatePortfolioImageMeta(
  portfolioId: string,
  portfolioImageId: string,
  formData: FormData,
) {
  await requireAdmin();
  const parsed = imageMetadataSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { ok: false as const };
  const image = await prisma.portfolioImage.update({
    where: { id: portfolioImageId },
    data: { caption: parsed.data.caption || null },
    select: { assetId: true },
  });
  if (parsed.data.altText !== undefined) {
    await prisma.imageAsset.update({
      where: { id: image.assetId },
      data: { altText: parsed.data.altText || null },
    });
  }
  revalidatePath(`/admin/portfolios/${portfolioId}`);
  return { ok: true as const };
}

export async function reorderPortfolioImages(portfolioId: string, ids: string[]) {
  await requireAdmin();
  const parsed = reorderSchema.safeParse({ ids });
  if (!parsed.success) return;
  await prisma.$transaction(
    parsed.data.ids.map((id, index) =>
      prisma.portfolioImage.update({ where: { id }, data: { sortOrder: index } }),
    ),
  );
  revalidatePath(`/admin/portfolios/${portfolioId}`);
}

export async function deletePortfolioImage(portfolioId: string, portfolioImageId: string) {
  const admin = await requireAdmin();
  const image = await prisma.portfolioImage.findUnique({
    where: { id: portfolioImageId },
    select: { assetId: true },
  });
  if (!image) return;
  await prisma.portfolioImage.delete({ where: { id: portfolioImageId } });
  await deleteAsset(image.assetId);
  await recordAudit({ action: 'IMAGE_DELETED', actorId: admin.id, target: `portfolioImage:${portfolioImageId}` });
  revalidatePath(`/admin/portfolios/${portfolioId}`);
}
