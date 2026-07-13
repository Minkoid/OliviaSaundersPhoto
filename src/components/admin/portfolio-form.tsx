'use client';

import { useFormState, useFormStatus } from 'react-dom';
import {
  createPortfolio,
  updatePortfolio,
  type PortfolioFormState,
} from '@/app/admin/portfolios/actions';

interface PortfolioFormValues {
  id?: string;
  title?: string;
  slug?: string;
  category?: string;
  intro?: string;
  description?: string;
  isPublished?: boolean;
  sortOrder?: number;
}

const CATEGORIES = [
  'Weddings',
  'Portraits',
  'Families',
  'Country life',
  'Events',
  'Editorial',
  'Equine',
  'Commercial',
];

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary" disabled={pending}>
      {pending ? 'Saving…' : label}
    </button>
  );
}

export function PortfolioForm({ portfolio }: { portfolio?: PortfolioFormValues }) {
  const isNew = !portfolio?.id;
  const action = isNew ? createPortfolio : updatePortfolio.bind(null, portfolio!.id!);
  const [state, formAction] = useFormState<PortfolioFormState, FormData>(action, {});

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
          <label htmlFor="title" className="field-label">
            Title
          </label>
          <input id="title" name="title" required defaultValue={portfolio?.title} className="field-input" />
        </div>
        <div>
          <label htmlFor="category" className="field-label">
            Category
          </label>
          <input
            id="category"
            name="category"
            required
            list="categories"
            defaultValue={portfolio?.category}
            className="field-input"
          />
          <datalist id="categories">
            {CATEGORIES.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>
      </div>

      {!isNew && (
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <label htmlFor="slug" className="field-label">
              URL slug
            </label>
            <input id="slug" name="slug" defaultValue={portfolio?.slug} className="field-input" />
          </div>
          <div>
            <label htmlFor="sortOrder" className="field-label">
              Sort order
            </label>
            <input
              id="sortOrder"
              name="sortOrder"
              type="number"
              min={0}
              defaultValue={portfolio?.sortOrder ?? 0}
              className="field-input"
            />
          </div>
        </div>
      )}

      <div>
        <label htmlFor="intro" className="field-label">
          Short introduction
        </label>
        <input id="intro" name="intro" defaultValue={portfolio?.intro} className="field-input" />
      </div>

      <div>
        <label htmlFor="description" className="field-label">
          Editorial description
        </label>
        <textarea
          id="description"
          name="description"
          rows={4}
          defaultValue={portfolio?.description}
          className="field-input resize-y"
        />
      </div>

      <label className="flex items-center gap-3">
        <input
          type="checkbox"
          name="isPublished"
          defaultChecked={portfolio?.isPublished}
          className="h-4 w-4 accent-olive"
        />
        <span className="font-sans text-sm text-charcoal">Published (visible on the public site)</span>
      </label>

      <div className="flex items-center gap-4 pt-2">
        <SubmitButton label={isNew ? 'Create portfolio' : 'Save changes'} />
      </div>
    </form>
  );
}
