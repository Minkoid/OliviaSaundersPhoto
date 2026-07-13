'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { createClient, updateClient, type ClientFormState } from '@/app/admin/clients/actions';

interface ClientFormValues {
  id?: string;
  email?: string;
  displayName?: string;
  company?: string;
  phone?: string;
  notes?: string;
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary" disabled={pending}>
      {pending ? 'Saving…' : label}
    </button>
  );
}

export function ClientForm({ client }: { client?: ClientFormValues }) {
  const isNew = !client?.id;
  const action = isNew ? createClient : updateClient.bind(null, client!.id!);
  const [state, formAction] = useFormState<ClientFormState, FormData>(action, {});

  return (
    <form action={formAction} className="space-y-6">
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
          <label htmlFor="displayName" className="field-label">
            Name
          </label>
          <input id="displayName" name="displayName" required defaultValue={client?.displayName} className="field-input" />
        </div>
        <div>
          <label htmlFor="email" className="field-label">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            defaultValue={client?.email}
            disabled={!isNew}
            className="field-input disabled:opacity-60"
          />
          {!isNew && (
            <p className="mt-1 font-sans text-xs text-stone-deep">Email cannot be changed.</p>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <label htmlFor="company" className="field-label">
            Company <span className="normal-case tracking-normal text-stone">(optional)</span>
          </label>
          <input id="company" name="company" defaultValue={client?.company} className="field-input" />
        </div>
        <div>
          <label htmlFor="phone" className="field-label">
            Telephone <span className="normal-case tracking-normal text-stone">(optional)</span>
          </label>
          <input id="phone" name="phone" defaultValue={client?.phone} className="field-input" />
        </div>
      </div>

      <div>
        <label htmlFor="notes" className="field-label">
          Private notes <span className="normal-case tracking-normal text-stone">(admin only)</span>
        </label>
        <textarea id="notes" name="notes" rows={3} defaultValue={client?.notes} className="field-input resize-y" />
      </div>

      {isNew && (
        <p className="font-sans text-xs text-stone-deep">
          An invitation email will be sent so the client can set their own password.
        </p>
      )}

      <SubmitButton label={isNew ? 'Create & invite' : 'Save changes'} />
    </form>
  );
}
