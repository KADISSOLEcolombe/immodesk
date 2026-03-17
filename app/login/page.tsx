"use client";

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';

type UserRole = 'tenant' | 'owner' | 'admin';

function normalizeRole(role: string | null): UserRole {
  if (role === 'tenant' || role === 'locataire') {
    return 'tenant';
  }

  if (role === 'owner' || role === 'proprietaire') {
    return 'owner';
  }

  if (role === 'admin') {
    return 'admin';
  }

  return 'tenant';
}

function roleTarget(role: UserRole) {
  if (role === 'tenant') {
    return '/tenant';
  }

  if (role === 'owner') {
    return '/owner';
  }

  if (role === 'admin') {
    return '/admin';
  }

  return '/tenant';
}

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>(normalizeRole(searchParams.get('role')));

  useEffect(() => {
    setRole(normalizeRole(searchParams.get('role')));
  }, [searchParams]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!email.trim() || !password.trim()) {
      return;
    }

    router.push(roleTarget(role));
  };

  return (
    <div
      className="relative min-h-screen overflow-hidden bg-zinc-950"
      style={{
        backgroundImage:
          'linear-gradient(180deg, rgba(75,16,67,0.52) 0%, rgba(16,16,26,0.58) 100%), url(https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1800&q=80)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <main className="mx-auto flex min-h-screen w-full max-w-md items-center px-4 py-10 sm:px-6">
        <section className="w-full rounded-3xl border border-white/20 bg-white/10 p-6 text-white shadow-2xl backdrop-blur-xl sm:p-8">
          <h1 className="text-center text-3xl font-semibold tracking-tight">Welcome</h1>

          <form onSubmit={handleSubmit} className="mt-7 space-y-4">
            <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-100">
              Email
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="exemple@immodesk.tg"
                required
                className="h-11 rounded-full border border-white/20 bg-white/15 px-4 text-sm text-white placeholder:text-zinc-300 outline-none transition focus:border-white/40"
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
                className="h-11 rounded-full border border-white/20 bg-white/15 px-4 text-sm text-white placeholder:text-zinc-300 outline-none transition focus:border-white/40"
              />
            </label>

            <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-100">
              Rôle
              <select
                value={role}
                onChange={(event) => setRole(event.target.value as UserRole)}
                className="h-11 rounded-full border border-white/20 bg-white/15 px-4 text-sm text-white outline-none transition focus:border-white/40"
              >
                <option value="tenant">Locataire</option>
                <option value="owner">Propriétaire</option>
                <option value="admin">Super admin</option>
              </select>
            </label>

            <button
              type="submit"
              className="mt-1 inline-flex h-12 w-full items-center justify-center rounded-full bg-fuchsia-900/85 px-4 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-fuchsia-800/90"
            >
              Login
            </button>
          </form>

          <div className="mt-5 flex items-center justify-between text-sm text-zinc-200">
            <button type="button" className="transition hover:text-white">
              Forgot Password ?
            </button>
            <Link href="/register" className="transition hover:text-white">
              Sign Up
            </Link>
          </div>

          <div className="mt-6 border-t border-white/20 pt-6 text-center">
            <p className="text-sm uppercase tracking-wider text-zinc-200">Or login with</p>
            <div className="mt-4 flex items-center justify-center gap-4">
              <button
                type="button"
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/25 bg-white/10 text-lg font-bold text-white transition hover:bg-white/20"
                aria-label="Connexion avec Google"
              >
                G
              </button>
              <button
                type="button"
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/25 bg-white/10 text-lg font-bold text-white transition hover:bg-white/20"
                aria-label="Connexion avec Facebook"
              >
                f
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
