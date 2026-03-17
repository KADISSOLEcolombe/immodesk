"use client";

import { FormEvent, useState } from 'react';
import { Mail, Phone } from 'lucide-react';

export default function TenantContactPage() {
  const [contactMessage, setContactMessage] = useState('');

  const handleContactSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!contactMessage.trim()) return;
    const subject = encodeURIComponent('Demande locataire - ImmoDesk Togo');
    const body = encodeURIComponent(`Bonjour,\n\n${contactMessage}\n\nMerci.`);
    window.location.href = `mailto:gestion@immodesk.tg?subject=${subject}&body=${body}`;
  };

  return (
    <>
      <div className="mb-6 flex items-center gap-2 text-zinc-900">
        <Mail className="h-5 w-5" aria-hidden="true" />
        <h1 className="text-xl font-bold">Contact</h1>
      </div>

      <section className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-5 space-y-2 text-sm text-zinc-600">
          <p className="inline-flex items-center gap-2">
            <Mail className="h-4 w-4" aria-hidden="true" />
            gestion@immodesk.tg
          </p>
          <p className="inline-flex items-center gap-2">
            <Phone className="h-4 w-4" aria-hidden="true" />
            +228 90 00 00 00
          </p>
        </div>

        <form onSubmit={handleContactSubmit} className="space-y-3">
          <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700">
            Votre message
            <textarea
              value={contactMessage}
              onChange={(e) => setContactMessage(e.target.value)}
              rows={5}
              placeholder="Explique ta demande…"
              className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-zinc-400"
            />
          </label>
          <button
            type="submit"
            className="inline-flex h-10 w-full items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100"
          >
            Envoyer un message
          </button>
        </form>
      </section>
    </>
  );
}
