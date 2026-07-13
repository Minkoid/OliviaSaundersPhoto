'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth/authorization';
import { clientSchema } from '@/lib/validation';
import { createUserToken } from '@/lib/auth/tokens';
import { sendEmail } from '@/lib/email/mailer';
import { clientInvitationEmail } from '@/lib/email/templates';
import { getAppUrl } from '@/lib/env';
import { recordAudit } from '@/lib/audit';

export interface ClientFormState {
  ok?: boolean;
  error?: string;
}

async function sendInvite(userId: string, email: string, displayName: string) {
  const raw = await createUserToken({ userId, email, purpose: 'INVITE' });
  const setupUrl = `${getAppUrl()}/set-password?token=${raw}&mode=invite`;
  await sendEmail({ to: email, ...clientInvitationEmail({ displayName, setupUrl }) });
}

export async function createClient(
  _prev: ClientFormState,
  formData: FormData,
): Promise<ClientFormState> {
  const admin = await requireAdmin();
  const parsed = clientSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }
  const data = parsed.data;
  const email = data.email.toLowerCase();

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: 'A user with that email already exists.' };
  }

  const user = await prisma.user.create({
    data: {
      email,
      name: data.displayName,
      role: 'CLIENT',
      // Inactive until the invitation is accepted and a password is set.
      isActive: false,
      clientProfile: {
        create: {
          displayName: data.displayName,
          company: data.company || null,
          phone: data.phone || null,
          notes: data.notes || null,
        },
      },
    },
  });

  await sendInvite(user.id, email, data.displayName);
  await recordAudit({ action: 'CLIENT_INVITED', actorId: admin.id, target: `user:${user.id}` });
  revalidatePath('/admin/clients');
  redirect(`/admin/clients/${user.id}`);
}

export async function updateClient(
  id: string,
  _prev: ClientFormState,
  formData: FormData,
): Promise<ClientFormState> {
  await requireAdmin();
  const parsed = clientSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }
  const data = parsed.data;
  await prisma.user.update({
    where: { id },
    data: {
      name: data.displayName,
      clientProfile: {
        upsert: {
          create: {
            displayName: data.displayName,
            company: data.company || null,
            phone: data.phone || null,
            notes: data.notes || null,
          },
          update: {
            displayName: data.displayName,
            company: data.company || null,
            phone: data.phone || null,
            notes: data.notes || null,
          },
        },
      },
    },
  });
  revalidatePath(`/admin/clients/${id}`);
  return { ok: true };
}

export async function resendInvitation(userId: string) {
  const admin = await requireAdmin();
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { clientProfile: true },
  });
  if (!user) return;
  await sendInvite(user.id, user.email, user.clientProfile?.displayName ?? user.name ?? user.email);
  await recordAudit({ action: 'CLIENT_INVITE_RESENT', actorId: admin.id, target: `user:${userId}` });
  revalidatePath(`/admin/clients/${userId}`);
}

export async function resetClientAccess(userId: string) {
  const admin = await requireAdmin();
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { clientProfile: true },
  });
  if (!user) return;
  // Re-issue an invitation-style link so the client can set a fresh password.
  await sendInvite(user.id, user.email, user.clientProfile?.displayName ?? user.name ?? user.email);
  await recordAudit({ action: 'CLIENT_ACCESS_RESET', actorId: admin.id, target: `user:${userId}` });
  revalidatePath(`/admin/clients/${userId}`);
}

export async function toggleClientActive(userId: string, active: boolean) {
  const admin = await requireAdmin();
  await prisma.user.update({ where: { id: userId }, data: { isActive: active } });
  await recordAudit({
    action: active ? 'CLIENT_ACCESS_RESET' : 'CLIENT_DISABLED',
    actorId: admin.id,
    target: `user:${userId}`,
  });
  revalidatePath(`/admin/clients/${userId}`);
  revalidatePath('/admin/clients');
}
