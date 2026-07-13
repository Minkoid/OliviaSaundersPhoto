'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { createGallery, updateGallery, type GalleryFormState } from '@/app/admin/galleries/actions';

interface GalleryFormValues {
  id?: string;
  title?: string;
  slug?: string;
  clientName?: string;
  shootDate?: string;
  message?: string;
  expiresAt?: string;
  isPublished?: boolean;
  isDisabled?: boolean;
  hasPassword?: boolean;
  allowImageDownload?: boolean;
  allowGalleryDownload?: boolean;
  allowFullResolution?: boolean;
  showImageNumbers?: boolean;
  watermarkEnabled?: boolean;
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary" disabled={pending}>
      {pending ? 'Saving…' : label}
    </button>
  );
}

function Toggle({
  name,
  label,
  hint,
  defaultChecked,
}: {
  name: string;
  label: string;
  hint?: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="flex items-start gap-3 py-2">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="mt-1 h-4 w-4 accent-olive" />
      <span>
        <span className="block font-sans text-sm text-charcoal">{label}</span>
        {hint && <span className="block font-sans text-xs text-stone-deep">{hint}</span>}
      </span>
    </label>
  );
}

export function GalleryForm({ gallery }: { gallery?: GalleryFormValues }) {
  const isNew = !gallery?.id;
  const action = isNew ? createGallery : updateGallery.bind(null, gallery!.id!);
  const [state, formAction] = useFormState<GalleryFormState, FormData>(action, {});

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

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <label htmlFor="title" className="field-label">
            Gallery name
          </label>
          <input id="title" name="title" required defaultValue={gallery?.title} className="field-input" />
        </div>
        <div>
          <label htmlFor="clientName" className="field-label">
            Client name
          </label>
          <input
            id="clientName"
            name="clientName"
            required
            defaultValue={gallery?.clientName}
            className="field-input"
          />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <label htmlFor="shootDate" className="field-label">
            Shoot date
          </label>
          <input
            id="shootDate"
            name="shootDate"
            type="date"
            defaultValue={gallery?.shootDate}
            className="field-input"
          />
        </div>
        <div>
          <label htmlFor="expiresAt" className="field-label">
            Expiry date
          </label>
          <input
            id="expiresAt"
            name="expiresAt"
            type="date"
            defaultValue={gallery?.expiresAt}
            className="field-input"
          />
        </div>
      </div>

      {!isNew && (
        <div>
          <label htmlFor="slug" className="field-label">
            URL slug
          </label>
          <input id="slug" name="slug" defaultValue={gallery?.slug} className="field-input" />
        </div>
      )}

      <div>
        <label htmlFor="message" className="field-label">
          Message to the client
        </label>
        <textarea
          id="message"
          name="message"
          rows={3}
          defaultValue={gallery?.message}
          className="field-input resize-y"
        />
      </div>

      <fieldset className="border border-hairline p-5">
        <legend className="px-2 font-sans text-xs uppercase tracking-widest text-stone-deep">
          Access & permissions
        </legend>
        <div className="grid gap-x-8 md:grid-cols-2">
          <Toggle name="isPublished" label="Published" hint="Visible to assigned clients" defaultChecked={gallery?.isPublished} />
          <Toggle name="isDisabled" label="Access disabled" hint="Temporarily pause all access" defaultChecked={gallery?.isDisabled} />
          <Toggle name="allowImageDownload" label="Allow individual downloads" defaultChecked={gallery?.allowImageDownload} />
          <Toggle name="allowGalleryDownload" label="Allow full-gallery download" defaultChecked={gallery?.allowGalleryDownload} />
          <Toggle name="allowFullResolution" label="Allow full-resolution downloads" defaultChecked={gallery?.allowFullResolution} />
          <Toggle name="showImageNumbers" label="Show image numbers" defaultChecked={gallery?.showImageNumbers} />
          <Toggle name="watermarkEnabled" label="Watermark previews" hint="Applies to newly uploaded images" defaultChecked={gallery?.watermarkEnabled} />
        </div>
      </fieldset>

      <fieldset className="border border-hairline p-5">
        <legend className="px-2 font-sans text-xs uppercase tracking-widest text-stone-deep">
          Optional gallery password
        </legend>
        <p className="mb-3 font-sans text-xs text-stone-deep">
          An extra password required in addition to the client&apos;s login.
          {gallery?.hasPassword && ' A password is currently set.'}
        </p>
        <input
          name="galleryPassword"
          type="text"
          autoComplete="off"
          placeholder={gallery?.hasPassword ? 'Enter a new password to change it' : 'Leave blank for none'}
          className="field-input"
        />
        {gallery?.hasPassword && (
          <label className="mt-3 flex items-center gap-2">
            <input type="checkbox" name="removePassword" className="h-4 w-4 accent-olive" />
            <span className="font-sans text-xs text-charcoal">Remove the password</span>
          </label>
        )}
      </fieldset>

      <div className="flex items-center gap-4">
        <SubmitButton label={isNew ? 'Create gallery' : 'Save changes'} />
      </div>
    </form>
  );
}
