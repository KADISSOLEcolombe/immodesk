"use client";

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function VisitAccessPage() {
  const router = useRouter();
  const [visitId, setVisitId] = useState('');
  const [code, setCode] = useState('');

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!visitId.trim() || !code.trim()) {
      return;
    }

    router.push(`/visit/${encodeURIComponent(visitId.trim())}?code=${encodeURIComponent(code.trim())}`);
  };

  return (
    <div className="min-h-screen bg-zinc-50">
      <main className="mx-auto flex min-h-screen w-full max-w-md items-center px-4 py-8 sm:px-6">
        <section className="w-full rounded-2xl border border-black/5 bg-white p-6 shadow-sm sm:p-7">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Accès visite virtuelle</h1>
          <p className="mt-1 text-sm text-zinc-600">Saisis ton ID de visite et ton code temporaire.</p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700">
              ID de visite
              <input
                type="text"
                value={visitId}
                onChange={(event) => setVisitId(event.target.value)}
                placeholder="visit-..."
                className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none transition focus:border-zinc-400"
              />
            </label>

            <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700">
              Code d&apos;accès
              <input
                type="text"
                value={code}
                onChange={(event) => setCode(event.target.value)}
                placeholder="123456"
                className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none transition focus:border-zinc-400"
              />
            </label>

            <button
              type="submit"
              className="inline-flex h-10 w-full items-center justify-center rounded-xl bg-zinc-900 px-4 text-sm font-medium text-white transition-colors hover:bg-zinc-700"
            >
              Accéder à la visite
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}
