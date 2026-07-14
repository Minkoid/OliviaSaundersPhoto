import { PageHeader, Card } from '@/components/admin/ui';
import { SettingsForm } from '@/components/admin/settings-form';
import { PageContentForm } from '@/components/admin/page-content-form';
import { getSiteSettings, getPageContent } from '@/lib/content';

export const dynamic = 'force-dynamic';

const HOME_ABOUT_KEYS: { key: string; label: string; bodyLabel?: string; rows?: number }[] = [
  { key: 'home.hero', label: 'Homepage hero' },
  { key: 'home.statement', label: 'Homepage statement' },
  { key: 'home.about', label: 'Homepage about intro' },
  { key: 'about.body', label: 'About page body', bodyLabel: 'Body (blank line separates paragraphs)', rows: 8 },
  { key: 'about.approach', label: 'About page approach' },
];

export default async function AdminSettingsPage() {
  const settings = await getSiteSettings();
  const pages = await Promise.all(
    HOME_ABOUT_KEYS.map(async (p) => ({ ...p, content: await getPageContent(p.key) })),
  );

  return (
    <>
      <PageHeader
        title="Site content"
        description="Studio details, social links, SEO defaults and editable page copy."
      />

      <Card className="max-w-4xl">
        <h2 className="mb-6 font-serif text-2xl text-ink">Settings</h2>
        <SettingsForm settings={settings} />
      </Card>

      <div className="mt-10 max-w-4xl">
        <h2 className="mb-4 font-serif text-2xl text-ink">Page content</h2>
        <div className="space-y-6">
          {pages.map((p) => (
            <PageContentForm
              key={p.key}
              contentKey={p.key}
              label={p.label}
              title={p.content.title}
              body={p.content.body}
              bodyLabel={p.bodyLabel}
              rows={p.rows}
            />
          ))}
        </div>
      </div>
    </>
  );
}
