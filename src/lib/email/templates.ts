import { getAppUrl } from '@/lib/env';

/**
 * Branded, email-client-safe HTML templates.
 *
 * Emails use inline styles and a table-free, simple structure that renders well
 * across Gmail, Apple Mail and Outlook while echoing the site's restrained,
 * editorial identity (ivory ground, serif headings, charcoal text).
 */

const palette = {
  ivory: '#f6f1e7',
  parchment: '#efe7d6',
  charcoal: '#2b2925',
  ink: '#1b1a17',
  olive: '#5c5c3d',
  muted: '#6f6a5f',
  hairline: '#d9cfba',
};

function layout(opts: { title: string; body: string; preview?: string }): string {
  const studio = 'Olivia Saunders';
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${opts.title}</title>
  </head>
  <body style="margin:0;padding:0;background:${palette.parchment};font-family:Georgia,'Times New Roman',serif;color:${palette.charcoal};">
    ${opts.preview ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${opts.preview}</div>` : ''}
    <div style="max-width:560px;margin:0 auto;padding:40px 24px;">
      <div style="text-align:center;padding-bottom:28px;">
        <div style="font-size:11px;letter-spacing:0.28em;text-transform:uppercase;color:${palette.olive};font-family:Helvetica,Arial,sans-serif;">${studio}</div>
        <div style="height:1px;background:${palette.hairline};margin:16px auto 0;width:60px;"></div>
      </div>
      <div style="background:${palette.ivory};border:1px solid ${palette.hairline};padding:40px 36px;">
        ${opts.body}
      </div>
      <div style="text-align:center;padding-top:24px;font-family:Helvetica,Arial,sans-serif;font-size:12px;color:${palette.muted};line-height:1.6;">
        <p style="margin:0;">${studio} Photography</p>
        <p style="margin:6px 0 0;">This message was sent from an unmonitored address. Please use the contact page to reach the studio.</p>
      </div>
    </div>
  </body>
</html>`;
}

function heading(text: string): string {
  return `<h1 style="margin:0 0 16px;font-size:24px;font-weight:400;color:${palette.ink};letter-spacing:-0.01em;">${text}</h1>`;
}

function paragraph(text: string): string {
  return `<p style="margin:0 0 16px;font-size:16px;line-height:1.7;color:${palette.charcoal};">${text}</p>`;
}

function button(href: string, label: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;">
    <tr><td style="background:${palette.charcoal};">
      <a href="${href}" style="display:inline-block;padding:14px 28px;color:${palette.ivory};text-decoration:none;font-family:Helvetica,Arial,sans-serif;font-size:12px;letter-spacing:0.18em;text-transform:uppercase;">${label}</a>
    </td></tr>
  </table>`;
}

export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

export function clientInvitationEmail(params: {
  displayName: string;
  setupUrl: string;
}): RenderedEmail {
  const body =
    heading('Welcome') +
    paragraph(`Dear ${params.displayName},`) +
    paragraph(
      'Your private client account has been created. To view the galleries prepared for you, please set your password using the button below.',
    ) +
    button(params.setupUrl, 'Set your password') +
    paragraph(
      `If the button does not work, copy and paste this link into your browser:<br/><span style="font-size:13px;color:${palette.muted};word-break:break-all;">${params.setupUrl}</span>`,
    ) +
    paragraph('This link will expire in 72 hours.');
  return {
    subject: 'Your private gallery account',
    html: layout({ title: 'Welcome', body, preview: 'Set your password to view your galleries' }),
    text: `Dear ${params.displayName},\n\nYour private client account has been created. Set your password to view your galleries:\n${params.setupUrl}\n\nThis link expires in 72 hours.`,
  };
}

export function galleryAvailableEmail(params: {
  displayName: string;
  galleryTitle: string;
  galleryUrl: string;
  expiresAt?: string | null;
}): RenderedEmail {
  const body =
    heading('Your gallery is ready') +
    paragraph(`Dear ${params.displayName},`) +
    paragraph(`Your gallery, <strong>${params.galleryTitle}</strong>, is now available to view.`) +
    button(params.galleryUrl, 'View your gallery') +
    (params.expiresAt
      ? paragraph(`Please note this gallery will remain available until ${params.expiresAt}.`)
      : '');
  return {
    subject: `Your gallery is ready — ${params.galleryTitle}`,
    html: layout({ title: 'Your gallery is ready', body }),
    text: `Dear ${params.displayName},\n\nYour gallery "${params.galleryTitle}" is now available:\n${params.galleryUrl}${
      params.expiresAt ? `\n\nAvailable until ${params.expiresAt}.` : ''
    }`,
  };
}

export function passwordResetEmail(params: { resetUrl: string }): RenderedEmail {
  const body =
    heading('Reset your password') +
    paragraph('We received a request to reset the password for your account.') +
    button(params.resetUrl, 'Choose a new password') +
    paragraph('If you did not request this, you can safely ignore this email. Your password will remain unchanged.') +
    paragraph('This link will expire in one hour.');
  return {
    subject: 'Reset your password',
    html: layout({ title: 'Reset your password', body }),
    text: `Reset your password using this link (expires in one hour):\n${params.resetUrl}\n\nIf you did not request this, ignore this email.`,
  };
}

export function galleryExpiryReminderEmail(params: {
  displayName: string;
  galleryTitle: string;
  galleryUrl: string;
  expiresAt: string;
}): RenderedEmail {
  const body =
    heading('A gentle reminder') +
    paragraph(`Dear ${params.displayName},`) +
    paragraph(
      `Your gallery, <strong>${params.galleryTitle}</strong>, will be available until ${params.expiresAt}. Do revisit to download any images you would like to keep.`,
    ) +
    button(params.galleryUrl, 'Open your gallery');
  return {
    subject: `Reminder — ${params.galleryTitle} expires soon`,
    html: layout({ title: 'Gallery expiring soon', body }),
    text: `Dear ${params.displayName},\n\nYour gallery "${params.galleryTitle}" is available until ${params.expiresAt}.\n${params.galleryUrl}`,
  };
}

export function enquiryAcknowledgementEmail(params: { name: string }): RenderedEmail {
  const body =
    heading('Thank you for your enquiry') +
    paragraph(`Dear ${params.name},`) +
    paragraph(
      'Thank you for getting in touch. Your message has been received and you can expect a considered, personal reply shortly.',
    ) +
    paragraph('With warm regards,<br/>Olivia');
  return {
    subject: 'Thank you for your enquiry',
    html: layout({ title: 'Thank you', body }),
    text: `Dear ${params.name},\n\nThank you for getting in touch. Your message has been received and you can expect a personal reply shortly.\n\nWith warm regards,\nOlivia`,
  };
}

export function newEnquiryAdminEmail(params: {
  name: string;
  email: string;
  type: string;
  message: string;
}): RenderedEmail {
  const body =
    heading('New enquiry') +
    paragraph(`<strong>From:</strong> ${params.name} (${params.email})`) +
    paragraph(`<strong>Type:</strong> ${params.type}`) +
    paragraph(`<strong>Message:</strong><br/>${params.message.replace(/\n/g, '<br/>')}`) +
    button(`${getAppUrl()}/admin/enquiries`, 'View in admin');
  return {
    subject: `New enquiry — ${params.name}`,
    html: layout({ title: 'New enquiry', body }),
    text: `New enquiry from ${params.name} (${params.email})\nType: ${params.type}\n\n${params.message}`,
  };
}
