'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { updatePage, type SettingsFormState } from '@/app/admin/settings/actions';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-outline" disabled={pending}>
      {pending ? 'Saving…' : 'Save'}
    </button>
  );
}

export function PageContentForm({
  contentKey,
  label,
  title,
  body,
  bodyLabel = 'Body',
  rows = 4,
}: {
  contentKey: string;
  label: string;
  title: string;
  body: string;
  bodyLabel?: string;
  rows?: number;
}) {
  const action = updatePage.bind(null, contentKey);
  const [state, formAction] = useFormState<SettingsFormState, FormData>(action, {});

  return (
    <form action={formAction} className="space-y-4 border border-hairline p-6">
      <div className="flex items-center justify-between">
        <h3 className="font-serif text-xl text-ink">{label}</h3>
        <code className="font-sans text-xs text-stone">{contentKey}</code>
      </div>
      {state.ok && <p className="font-sans text-xs text-olive">Saved.</p>}
      {state.error && <p className="font-sans text-xs text-burgundy">{state.error}</p>}
      <div>
        <label htmlFor={`${contentKey}-title`} className="field-label">
          Heading
        </label>
        <input id={`${contentKey}-title`} name="title" defaultValue={title} className="field-input" />
      </div>
      <div>
        <label htmlFor={`${contentKey}-body`} className="field-label">
          {bodyLabel}
        </label>
        <textarea
          id={`${contentKey}-body`}
          name="body"
          rows={rows}
          defaultValue={body}
          className="field-input resize-y"
        />
      </div>
      <SubmitButton />
    </form>
  );
}
