'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { updateSettings, type SettingsFormState } from '@/app/admin/settings/actions';

interface SettingsValues {
  studioName: string;
  tagline: string;
  contactEmail: string;
  contactPhone: string;
  areasServed: string;
  responseTime: string;
  studioLocation: string;
  instagramUrl: string;
  pinterestUrl: string;
  facebookUrl: string;
  footerText: string;
  seoTitle: string;
  seoDescription: string;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary" disabled={pending}>
      {pending ? 'Saving…' : 'Save settings'}
    </button>
  );
}

function Text({
  name,
  label,
  defaultValue,
  type = 'text',
}: {
  name: string;
  label: string;
  defaultValue?: string;
  type?: string;
}) {
  return (
    <div>
      <label htmlFor={name} className="field-label">
        {label}
      </label>
      <input id={name} name={name} type={type} defaultValue={defaultValue} className="field-input" />
    </div>
  );
}

export function SettingsForm({ settings }: { settings: SettingsValues }) {
  const [state, formAction] = useFormState<SettingsFormState, FormData>(updateSettings, {});

  return (
    <form action={formAction} className="space-y-8">
      {state.error && (
        <p role="alert" className="border border-burgundy/40 bg-burgundy/5 px-4 py-3 text-sm text-burgundy">
          {state.error}
        </p>
      )}
      {state.ok && (
        <p role="status" className="border border-olive/40 bg-olive/5 px-4 py-3 text-sm text-olive">
          Saved.
        </p>
      )}

      <fieldset className="space-y-6 border border-hairline p-6">
        <legend className="px-2 font-sans text-xs uppercase tracking-widest text-stone-deep">Studio</legend>
        <div className="grid gap-6 md:grid-cols-2">
          <Text name="studioName" label="Studio name" defaultValue={settings.studioName} />
          <Text name="tagline" label="Tagline" defaultValue={settings.tagline} />
          <Text name="contactEmail" label="Contact email" type="email" defaultValue={settings.contactEmail} />
          <Text name="contactPhone" label="Contact phone" defaultValue={settings.contactPhone} />
          <Text name="studioLocation" label="Studio location" defaultValue={settings.studioLocation} />
          <Text name="responseTime" label="Response time" defaultValue={settings.responseTime} />
        </div>
        <div>
          <label htmlFor="areasServed" className="field-label">
            Areas served
          </label>
          <textarea id="areasServed" name="areasServed" rows={2} defaultValue={settings.areasServed} className="field-input resize-y" />
        </div>
      </fieldset>

      <fieldset className="space-y-6 border border-hairline p-6">
        <legend className="px-2 font-sans text-xs uppercase tracking-widest text-stone-deep">Social & footer</legend>
        <div className="grid gap-6 md:grid-cols-3">
          <Text name="instagramUrl" label="Instagram URL" type="url" defaultValue={settings.instagramUrl} />
          <Text name="pinterestUrl" label="Pinterest URL" type="url" defaultValue={settings.pinterestUrl} />
          <Text name="facebookUrl" label="Facebook URL" type="url" defaultValue={settings.facebookUrl} />
        </div>
        <div>
          <label htmlFor="footerText" className="field-label">
            Footer text
          </label>
          <textarea id="footerText" name="footerText" rows={2} defaultValue={settings.footerText} className="field-input resize-y" />
        </div>
      </fieldset>

      <fieldset className="space-y-6 border border-hairline p-6">
        <legend className="px-2 font-sans text-xs uppercase tracking-widest text-stone-deep">SEO defaults</legend>
        <Text name="seoTitle" label="Default SEO title" defaultValue={settings.seoTitle} />
        <div>
          <label htmlFor="seoDescription" className="field-label">
            Default SEO description
          </label>
          <textarea id="seoDescription" name="seoDescription" rows={2} defaultValue={settings.seoDescription} className="field-input resize-y" />
        </div>
      </fieldset>

      <SubmitButton />
    </form>
  );
}
