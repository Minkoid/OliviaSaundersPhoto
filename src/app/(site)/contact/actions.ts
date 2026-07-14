'use server';

import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { enquirySchema } from '@/lib/validation';
import { hashIp } from '@/lib/crypto';
import { rateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { getServerEnv } from '@/lib/env';
import { sendEmail } from '@/lib/email/mailer';
import { enquiryAcknowledgementEmail, newEnquiryAdminEmail } from '@/lib/email/templates';

export interface EnquiryActionState {
  status: 'idle' | 'success' | 'error';
  message?: string;
  fieldErrors?: Record<string, string>;
}

/**
 * Public contact form submission. Validates, rate-limits by IP, stores the
 * enquiry, and sends acknowledgement + admin notification emails. A honeypot
 * field silently rejects obvious bots.
 */
export async function submitEnquiry(
  _prev: EnquiryActionState,
  formData: FormData,
): Promise<EnquiryActionState> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = enquirySchema.safeParse(raw);

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === 'string' && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { status: 'error', message: 'Please review the highlighted fields.', fieldErrors };
  }

  const data = parsed.data;

  // Honeypot: pretend success without storing anything.
  if (data.website && data.website.length > 0) {
    return { status: 'success', message: 'Thank you for your enquiry.' };
  }

  const hdrs = headers();
  const ip = hdrs.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null;
  const ipHash = hashIp(ip);

  const limit = rateLimit({ key: `enquiry:${ipHash ?? 'unknown'}`, ...RATE_LIMITS.enquiry });
  if (!limit.success) {
    return {
      status: 'error',
      message: 'You have sent several enquiries recently. Please try again a little later.',
    };
  }

  try {
    await prisma.enquiry.create({
      data: {
        name: data.name,
        email: data.email.toLowerCase(),
        phone: data.phone || null,
        type: data.type,
        eventDate: data.eventDate ? new Date(data.eventDate) : null,
        location: data.location || null,
        message: data.message,
        ipHash,
      },
    });
  } catch (err) {
    console.error('[enquiry] failed to store', err);
    return {
      status: 'error',
      message: 'Something went wrong saving your enquiry. Please email us directly.',
    };
  }

  // Emails are best-effort; a failure here does not fail the submission.
  const env = getServerEnv();
  const ack = enquiryAcknowledgementEmail({ name: data.name });
  const notify = newEnquiryAdminEmail({
    name: data.name,
    email: data.email,
    type: data.type,
    message: data.message,
  });
  await Promise.allSettled([
    sendEmail({ to: data.email, ...ack }),
    sendEmail({ to: env.ADMIN_NOTIFICATION_EMAIL, ...notify }),
  ]);

  return {
    status: 'success',
    message: 'Thank you — your enquiry has been received. You will hear from the studio shortly.',
  };
}
