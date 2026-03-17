"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';

type UserRole = 'tenant' | 'owner' | 'admin';

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('tenant');

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!fullName.trim() || !email.trim() || !password.trim()) {
      return;
    }

    router.push(`/login?role=${role}`);
  };

  return (
    <div
      className="min-h-screen bg-zinc-950"
      style={{
        backgroundImage:
          'linear-gradient(90deg, rgba(14,19,31,0.75) 0%, rgba(14,19,31,0.45) 50%, rgba(14,19,31,0.75) 100%), url(https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1800&q=80)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <main className="mx-auto flex min-h-screen w-full max-w-5xl items-center px-4 py-8 sm:px-6">
        <section className="grid w-full overflow-hidden rounded-3xl border border-white/20 bg-white/10 shadow-2xl backdrop-blur-md md:grid-cols-2">
          <div className="relative hidden min-h-[560px] md:block">
            <div className="absolute inset-0 bg-black/20" />
            <div className="absolute right-0 top-8 h-[75%] w-px bg-white/60" />
          </div>

          <div className="p-6 text-white sm:p-8">
            <h1 className="text-4xl font-semibold tracking-tight">Register</h1>
            <p className="mt-2 text-sm text-zinc-200">Create your account and choose your access role.</p>

            <form onSubmit={handleSubmit} className="mt-7 space-y-4">
              <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-100">
              Nom complet
              <input
                type="text"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder="Nom et prénom"
                required
                className="h-11 rounded-lg border border-white/20 bg-white/15 px-3 text-sm text-white placeholder:text-zinc-300 outline-none transition focus:border-white/45"
              />
            </label>

            <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-100">
              Email
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="exemple@immodesk.tg"
                required
                className="h-11 rounded-lg border border-white/20 bg-white/15 px-3 text-sm text-white placeholder:text-zinc-300 outline-none transition focus:border-white/45"
              />
            </label>

            <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-100">
              Mot de passe
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                required
                className="h-11 rounded-lg border border-white/20 bg-white/15 px-3 text-sm text-white placeholder:text-zinc-300 outline-none transition focus:border-white/45"
              />
            </label>

            <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-100">
              Rôle
              <select
                value={role}
                onChange={(event) => setRole(event.target.value as UserRole)}
                className="h-11 rounded-lg border border-white/20 bg-white/15 px-3 text-sm text-white outline-none transition focus:border-white/45"
              >
                <option value="tenant">Locataire</option>
                <option value="owner">Propriétaire</option>
                <option value="admin">Super admin</option>
              </select>
            </label>

            <button
              type="submit"
              className="mt-2 inline-flex h-11 w-full items-center justify-center rounded-md bg-red-600 px-4 text-sm font-semibold text-white transition hover:bg-red-500"
            >
              Register
            </button>
          </form>

          <p className="mt-5 text-sm text-zinc-200">
            Déjà un compte ?{' '}
            <Link href="/login" className="font-medium text-white underline decoration-white/50 underline-offset-4 hover:decoration-white">
              Se connecter
            </Link>
          </p>

            <div className="mt-6 border-t border-white/20 pt-5 text-center">
              <p className="text-xs uppercase tracking-wider text-zinc-300">Or continue with</p>
              <button
                type="button"
                className="mt-3 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/30 bg-white/10 font-semibold text-white transition hover:bg-white/20"
                aria-label="Continuer avec Google"
              >
                G
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
