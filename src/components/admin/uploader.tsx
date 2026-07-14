'use client';

import { useCallback, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { cn, formatFileSize } from '@/lib/utils';

type Status = 'queued' | 'uploading' | 'done' | 'error';

interface UploadItem {
  id: string;
  file: File;
  progress: number;
  status: Status;
  error?: string;
}

const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp', 'image/tiff', 'image/avif'];
const MAX_BYTES = 60 * 1024 * 1024;

/**
 * Drag-and-drop, multi-file uploader with per-file progress, retry and clear
 * error reporting. Uploads run sequentially so a large batch does not overwhelm
 * the server; successful files are never lost when others fail.
 */
export function Uploader({
  target,
  targetId,
}: {
  target: 'portfolio' | 'gallery';
  targetId: string;
}) {
  const router = useRouter();
  const [items, setItems] = useState<UploadItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback((fileList: FileList | File[]) => {
    const incoming = Array.from(fileList);
    const next: UploadItem[] = [];
    for (const file of incoming) {
      let error: string | undefined;
      if (!ACCEPTED.includes(file.type)) error = 'Unsupported file type';
      else if (file.size > MAX_BYTES) error = `Too large (max ${formatFileSize(MAX_BYTES)})`;
      next.push({
        id: `${file.name}-${file.size}-${Math.random().toString(36).slice(2, 8)}`,
        file,
        progress: 0,
        status: error ? 'error' : 'queued',
        error,
      });
    }
    setItems((prev) => [...prev, ...next]);
  }, []);

  const uploadOne = useCallback(
    (item: UploadItem) =>
      new Promise<void>((resolve) => {
        const form = new FormData();
        form.set('target', target);
        form.set('targetId', targetId);
        form.set('files', item.file);

        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/api/admin/upload');
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const progress = Math.round((e.loaded / e.total) * 100);
            setItems((prev) => prev.map((it) => (it.id === item.id ? { ...it, progress } : it)));
          }
        };
        xhr.onload = () => {
          try {
            const res = JSON.parse(xhr.responseText);
            const fileResult = res.results?.[0];
            if (xhr.status === 200 && fileResult?.ok) {
              setItems((prev) =>
                prev.map((it) => (it.id === item.id ? { ...it, status: 'done', progress: 100 } : it)),
              );
            } else {
              setItems((prev) =>
                prev.map((it) =>
                  it.id === item.id
                    ? { ...it, status: 'error', error: fileResult?.error ?? res.error ?? 'Upload failed' }
                    : it,
                ),
              );
            }
          } catch {
            setItems((prev) =>
              prev.map((it) =>
                it.id === item.id ? { ...it, status: 'error', error: 'Unexpected response' } : it,
              ),
            );
          }
          resolve();
        };
        xhr.onerror = () => {
          setItems((prev) =>
            prev.map((it) =>
              it.id === item.id ? { ...it, status: 'error', error: 'Network error' } : it,
            ),
          );
          resolve();
        };
        setItems((prev) => prev.map((it) => (it.id === item.id ? { ...it, status: 'uploading' } : it)));
        xhr.send(form);
      }),
    [target, targetId],
  );

  const startUpload = useCallback(async () => {
    setBusy(true);
    // Snapshot queued items to upload sequentially.
    const queued = items.filter((it) => it.status === 'queued');
    for (const item of queued) {
      // eslint-disable-next-line no-await-in-loop
      await uploadOne(item);
    }
    setBusy(false);
    router.refresh();
  }, [items, uploadOne, router]);

  const retry = useCallback(
    async (id: string) => {
      const item = items.find((it) => it.id === id);
      if (!item) return;
      setItems((prev) => prev.map((it) => (it.id === id ? { ...it, status: 'queued', error: undefined, progress: 0 } : it)));
      await uploadOne({ ...item, status: 'queued', progress: 0 });
      router.refresh();
    },
    [items, uploadOne, router],
  );

  const clearDone = () => setItems((prev) => prev.filter((it) => it.status !== 'done'));

  const pendingCount = items.filter((it) => it.status === 'queued').length;

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
        }}
        className={cn(
          'flex flex-col items-center justify-center border-2 border-dashed p-10 text-center transition-colors',
          isDragging ? 'border-olive bg-olive/5' : 'border-hairline bg-parchment/20',
        )}
      >
        <p className="font-serif text-xl text-ink">Drag photographs here</p>
        <p className="mt-2 font-sans text-sm text-stone-deep">
          JPEG, PNG, WebP, TIFF or AVIF · up to {formatFileSize(MAX_BYTES)} each
        </p>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="btn-outline mt-5"
        >
          Choose files
        </button>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED.join(',')}
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) addFiles(e.target.files);
            e.target.value = '';
          }}
        />
      </div>

      {items.length > 0 && (
        <div className="mt-6">
          <div className="mb-4 flex items-center justify-between">
            <p className="font-sans text-xs uppercase tracking-widest text-stone-deep">
              {items.length} file{items.length === 1 ? '' : 's'}
            </p>
            <div className="flex gap-3">
              <button type="button" onClick={clearDone} className="btn-quiet">
                Clear completed
              </button>
              <button
                type="button"
                onClick={startUpload}
                disabled={busy || pendingCount === 0}
                className="btn-primary"
              >
                {busy ? 'Uploading…' : `Upload ${pendingCount || ''}`.trim()}
              </button>
            </div>
          </div>

          <ul className="space-y-2">
            {items.map((item) => (
              <li key={item.id} className="flex items-center gap-4 border border-hairline bg-white/40 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-sans text-sm text-charcoal">{item.file.name}</p>
                  <p className="font-sans text-xs text-stone-deep">{formatFileSize(item.file.size)}</p>
                  {item.status === 'uploading' && (
                    <div className="mt-2 h-1 w-full bg-stone-soft/60">
                      <div className="h-1 bg-olive transition-all" style={{ width: `${item.progress}%` }} />
                    </div>
                  )}
                  {item.error && <p className="mt-1 font-sans text-xs text-burgundy">{item.error}</p>}
                </div>
                <div className="shrink-0">
                  {item.status === 'done' && (
                    <span className="font-sans text-xs uppercase tracking-widest text-olive">Done</span>
                  )}
                  {item.status === 'queued' && (
                    <span className="font-sans text-xs uppercase tracking-widest text-stone-deep">Queued</span>
                  )}
                  {item.status === 'uploading' && (
                    <span className="font-sans text-xs uppercase tracking-widest text-stone-deep">
                      {item.progress}%
                    </span>
                  )}
                  {item.status === 'error' && (
                    <button type="button" onClick={() => retry(item.id)} className="btn-quiet">
                      Retry
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
