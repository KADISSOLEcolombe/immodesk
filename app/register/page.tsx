"use client";

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { ArrowRight, ArrowLeft, Mail, Lock, User, Check, Building2, Loader2 } from 'lucide-react';

type UserRole = 'tenant' | 'owner' | 'admin';

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('tenant');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!fullName.trim() || !email.trim() || !password.trim()) return;
    
    setIsLoading(true);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setIsLoading(false);
    setIsSuccess(true);
    
    // Redirect after delay
    setTimeout(() => {
      router.push(`/login?role=${role}`);
    }, 2000);
  };

  return (
    <div className="min-h-screen w-full flex bg-[#F9F7F4]">
      {/* Left Side - Image & Brand */}
      <div className="hidden lg:flex w-1/2 relative bg-zinc-900 text-white flex-col justify-between p-12 overflow-hidden">
        <div className="absolute inset-0 z-0">
           <Image 
             src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=1400&auto=format&fit=crop"
             alt="Luxury Home"
             fill
             className="object-cover opacity-60"
             priority
           />
           <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/20 to-black/80" />
        </div>

        <div className="relative z-10">
          <Link href="/" className="text-3xl font-serif font-bold tracking-widest text-white">IMMODESK</Link>
        </div>

        <div className="relative z-10 max-w-lg">
           <h2 className="text-4xl font-serif mb-6 leading-tight">Trouvez le logement de vos rêves ou gérez vos biens en toute simplicité.</h2>
           <ul className="space-y-4">
             <li className="flex items-center gap-3">
               <div className="p-1 rounded-full bg-white/20 backdrop-blur-sm">
                 <Check className="w-4 h-4 text-white" />
               </div>
               <span className="text-zinc-200">Accès à plus de 500 biens exclusifs</span>
             </li>
             <li className="flex items-center gap-3">
               <div className="p-1 rounded-full bg-white/20 backdrop-blur-sm">
                 <Check className="w-4 h-4 text-white" />
               </div>
               <span className="text-zinc-200">Visites virtuelles et physiques</span>
             </li>
             <li className="flex items-center gap-3">
               <div className="p-1 rounded-full bg-white/20 backdrop-blur-sm">
                 <Check className="w-4 h-4 text-white" />
               </div>
               <span className="text-zinc-200">Gestion locative simplifiée</span>
             </li>
           </ul>
        </div>

        <div className="relative z-10 text-sm text-zinc-400">
          © 2026 IMMODESK. Tous droits réservés.
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12 relative">
        {/* Back Button */}
        <Link 
          href="/" 
          className="absolute top-8 left-8 hidden lg:flex items-center gap-2 text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour
        </Link>
        <Link 
          href="/" 
          className="absolute top-6 left-6 lg:hidden flex items-center gap-2 text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour
        </Link>

        <div className="w-full max-w-md space-y-8 mt-12 lg:mt-0">
          {isSuccess ? (
            <div className="flex flex-col items-center justify-center text-center animate-in fade-in zoom-in duration-500">
              <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6">
                <Check className="w-12 h-12 text-green-600" />
              </div>
              <h2 className="text-3xl font-bold text-zinc-900 mb-3">Inscription terminée !</h2>
              <p className="text-zinc-500">Votre compte a été créé avec succès.</p>
              <div className="mt-8 flex items-center gap-2 text-sm text-zinc-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                Redirection vers la connexion...
              </div>
            </div>
          ) : (
            <>
              <div className="text-center lg:text-left">
                <h1 className="text-3xl font-bold text-zinc-900">Créer un compte</h1>
                <p className="mt-2 text-zinc-500">Commencez votre expérience immobilière aujourd'hui.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Role Selection */}
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1.5">Je suis</label>
                  <div className="relative">
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value as UserRole)}
                      className="w-full pl-4 pr-10 py-3 rounded-xl border border-zinc-200 bg-white text-zinc-900 focus:border-zinc-900 focus:ring-4 focus:ring-zinc-900/5 outline-none transition-all appearance-none cursor-pointer"
                    >
                      <option value="tenant">Locataire</option>
                      <option value="owner">Propriétaire</option>
                      <option value="admin">Administrateur</option>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                      <svg className="w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1.5">Nom complet</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-zinc-200 bg-white text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:ring-4 focus:ring-zinc-900/5 outline-none transition-all"
                        placeholder="John Doe"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1.5">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-zinc-200 bg-white text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:ring-4 focus:ring-zinc-900/5 outline-none transition-all"
                        placeholder="exemple@immodesk.tg"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1.5">Mot de passe</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-zinc-200 bg-white text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:ring-4 focus:ring-zinc-900/5 outline-none transition-all"
                        placeholder="••••••••"
                        required
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-white font-semibold py-3.5 rounded-xl transition-all shadow-lg shadow-zinc-900/20 hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      S'inscrire
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              <p className="text-center text-sm text-zinc-500">
                Vous avez déjà un compte ?{' '}
                <Link href="/login" className="font-semibold text-zinc-900 hover:underline">
                  Se connecter
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
