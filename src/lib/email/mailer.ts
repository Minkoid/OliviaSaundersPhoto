import 'server-only';
import { Resend } from 'resend';
import { getServerEnv } from '@/lib/env';
import type { RenderedEmail } from './templates';

/**
 * Email delivery abstraction.
 *
 * Drivers:
 *  - console: logs the message to the server console (development default).
 *  - resend:  sends via the Resend transactional API.
 *  - smtp-noop: accepts and discards (useful for staging without a provider).
 *
 * Sending never throws into the caller's happy path — failures are logged and
 * returned as a boolean so, e.g., an enquiry is still stored even if email fails.
 */

export interface SendEmailParams extends RenderedEmail {
  to: string | string[];
}

async function sendViaResend(params: SendEmailParams): Promise<boolean> {
  const env = getServerEnv();
  if (!env.RESEND_API_KEY) {
    console.warn('[email] RESEND_API_KEY missing; falling back to console output');
    return sendViaConsole(params);
  }
  try {
    const resend = new Resend(env.RESEND_API_KEY);
    const { error } = await resend.emails.send({
      from: env.EMAIL_FROM,
      to: params.to,
      subject: params.subject,
      html: params.html,
      text: params.text,
    });
    if (error) {
      console.error('[email] resend error', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[email] resend threw', err);
    return false;
  }
}

function sendViaConsole(params: SendEmailParams): boolean {
  console.info(
    `\n──────────── EMAIL (console driver) ────────────\n` +
      `To:      ${Array.isArray(params.to) ? params.to.join(', ') : params.to}\n` +
      `Subject: ${params.subject}\n` +
      `----------------------------------------------\n` +
      `${params.text}\n` +
      `──────────────────────────────────────────────\n`,
  );
  return true;
}

export async function sendEmail(params: SendEmailParams): Promise<boolean> {
  const env = getServerEnv();
  switch (env.EMAIL_DRIVER) {
    case 'resend':
      return sendViaResend(params);
    case 'smtp-noop':
      return true;
    case 'console':
    default:
      return sendViaConsole(params);
  }
}
