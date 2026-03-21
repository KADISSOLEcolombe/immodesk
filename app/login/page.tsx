"use client";

import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { FormEvent, useEffect, useState, Suspense, useRef } from 'react';
import { Mail, Lock, User, ArrowRight, ArrowLeft, Loader2, ShieldCheck, Smartphone, Check, MessageSquare } from 'lucide-react';
import { AuthService } from '@/lib/auth-service';

type UserRole = 'tenant' | 'owner' | 'admin';
type LoginStep = 'credentials' | '2fa_selection' | '2fa_verify';
type TwoFactorMethod = 'email' | 'sms' | null;

function normalizeRole(role: string | null): UserRole {
  if (role === 'tenant' || role === 'locataire') return 'tenant';
  if (role === 'owner' || role === 'proprietaire') return 'owner';
  if (role === 'admin') return 'admin';
  return 'tenant';
}

function roleTarget(role: UserRole) {
  if (role === 'tenant') return '/tenant';
  if (role === 'owner') return '/owner';
  if (role === 'admin') return '/admin';
  return '/tenant';
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState<LoginStep>('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('tenant');
  const [isLoading, setIsLoading] = useState(false);
  
  // 2FA States
  const [twoFactorMethod, setTwoFactorMethod] = useState<TwoFactorMethod>(null);
  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const paramRole = searchParams.get('role');
    if (paramRole) {
        setRole(normalizeRole(paramRole));
    }
  }, [searchParams]);

  const handleCredentialsSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!email.trim() || !password.trim()) return;

    setIsLoading(true);
    
    try {
      // Utiliser le service d'authentification réel
      const response = await AuthService.login({
        email: email.trim(),
        password: password.trim(),
      });
      
      if (response.success) {
        // Rediriger selon le rôle de l'utilisateur
        const userRole = AuthService.getUserRole();
        
        // Pour la démo, on utilise le rôle sélectionné dans le formulaire
        // En production, on utilisera le rôle retourné par le backend
        router.push(roleTarget(role));
      } else {
        // Afficher l'erreur du backend
        alert(response.message || 'Erreur lors de la connexion');
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('Erreur technique lors de la connexion');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMethodSelect = async (method: 'email' | 'sms') => {
    setTwoFactorMethod(method);
    setIsLoading(true);
    // Simulate sending code
    await new Promise(resolve => setTimeout(resolve, 800));
    // For demo purposes, we auto-fill the code so the user doesn't get blocked
    setVerificationCode(['1', '2', '3', '4', '5', '6']);
    setIsLoading(false);
    setStep('2fa_verify');
  };

  const handleCodeChange = (index: number, value: string) => {
    if (value.length > 1) return; // Prevent multi-char input per box
    
    const newCode = [...verificationCode];
    newCode[index] = value;
    setVerificationCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !verificationCode[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifySubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (verificationCode.some(c => !c)) return;

    setIsLoading(true);
    // Simulate verification
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    router.push(roleTarget(role));
  };

  return (
    <div className="min-h-screen w-full flex bg-[#F9F7F4]">
      {/* Left Side - Visual */}
      <div className="hidden lg:block w-1/2 relative bg-zinc-900 overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1613545325278-f24b0cae1224?q=80&w=1400&auto=format&fit=crop"
          alt="Luxury Interior"
          fill
          className="object-cover opacity-80"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
        
        <div className="absolute bottom-12 left-12 max-w-lg text-white">
          <h2 className="text-4xl font-serif font-bold mb-4">Bon retour parmi nous.</h2>
          <p className="text-zinc-200 text-lg font-light">
            Accédez à votre espace personnel et retrouvez vos favoris, vos demandes et vos documents.
          </p>
        </div>

        <div className="absolute top-12 left-12">
            <Link href="/" className="text-2xl font-serif font-bold tracking-widest text-white">IMMODESK</Link>
        </div>
      </div>

      {/* Right Side - Forms */}
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

        <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 mt-12 lg:mt-0">
          
          {/* STEP 1: Credentials */}
          {step === 'credentials' && (
            <>
              <div className="text-center lg:text-left">
                <h1 className="text-3xl font-bold text-zinc-900">Connexion</h1>
                <p className="mt-2 text-zinc-500">Heureux de vous revoir ! Veuillez saisir vos coordonnées.</p>
              </div>

              <form onSubmit={handleCredentialsSubmit} className="space-y-6">
                <div className="space-y-4">
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

                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1.5">Je me connecte en tant que</label>
                    <div className="relative">
                       <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                       <select
                        value={role}
                        onChange={(e) => setRole(e.target.value as UserRole)}
                        className="w-full pl-10 pr-10 py-3 rounded-xl border border-zinc-200 bg-white text-zinc-900 focus:border-zinc-900 focus:ring-4 focus:ring-zinc-900/5 outline-none transition-all appearance-none cursor-pointer"
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
                </div>

                <div className="flex items-center justify-between text-sm">
                    <label className="flex items-center gap-2 cursor-pointer group">
                        <input type="checkbox" className="w-4 h-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900" />
                        <span className="text-zinc-500 group-hover:text-zinc-900 transition-colors">Se souvenir de moi</span>
                    </label>
                    <a href="#" className="font-medium text-zinc-900 hover:underline">Mot de passe oublié ?</a>
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
                      Se connecter
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              <p className="text-center text-sm text-zinc-500">
                Pas encore de compte ?{' '}
                <Link href="/register" className="font-semibold text-zinc-900 hover:underline">
                  S'inscrire
                </Link>
              </p>
            </>
          )}

          {/* STEP 2: 2FA Method Selection */}
          {step === '2fa_selection' && (
            <div className="text-center">
              <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <ShieldCheck className="w-8 h-8 text-zinc-900" />
              </div>
              <h1 className="text-2xl font-bold text-zinc-900 mb-2">Double Authentification</h1>
              <p className="text-zinc-500 mb-8">Pour sécuriser votre compte, veuillez choisir une méthode de vérification.</p>

              <div className="space-y-4">
                <button
                  onClick={() => handleMethodSelect('sms')}
                  disabled={isLoading}
                  className="w-full flex items-center justify-between p-4 rounded-xl border border-zinc-200 hover:border-zinc-900 hover:bg-zinc-50 transition-all group text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center group-hover:bg-white group-hover:shadow-sm transition-all">
                      <Smartphone className="w-5 h-5 text-zinc-600 group-hover:text-zinc-900" />
                    </div>
                    <div>
                      <div className="font-semibold text-zinc-900">SMS</div>
                      <div className="text-sm text-zinc-500">Recevoir un code par SMS</div>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-zinc-300 group-hover:text-zinc-900 transition-colors" />
                </button>

                <button
                  onClick={() => handleMethodSelect('email')}
                  disabled={isLoading}
                  className="w-full flex items-center justify-between p-4 rounded-xl border border-zinc-200 hover:border-zinc-900 hover:bg-zinc-50 transition-all group text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center group-hover:bg-white group-hover:shadow-sm transition-all">
                      <Mail className="w-5 h-5 text-zinc-600 group-hover:text-zinc-900" />
                    </div>
                    <div>
                      <div className="font-semibold text-zinc-900">Email</div>
                      <div className="text-sm text-zinc-500">Recevoir un code par email</div>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-zinc-300 group-hover:text-zinc-900 transition-colors" />
                </button>
              </div>

              <button 
                onClick={() => setStep('credentials')}
                className="mt-8 text-sm text-zinc-500 hover:text-zinc-900 underline"
              >
                Retour à la connexion
              </button>
            </div>
          )}

          {/* STEP 3: Verification Code */}
          {step === '2fa_verify' && (
            <div className="text-center">
              <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-6">
                {twoFactorMethod === 'sms' ? (
                   <MessageSquare className="w-8 h-8 text-zinc-900" />
                ) : (
                   <Mail className="w-8 h-8 text-zinc-900" />
                )}
              </div>
              <h1 className="text-2xl font-bold text-zinc-900 mb-2">Vérification</h1>
              <p className="text-zinc-500 mb-8">
                Nous avons envoyé un code à 6 chiffres par {twoFactorMethod === 'sms' ? 'SMS' : 'email'}.
              </p>

              <form onSubmit={handleVerifySubmit} className="space-y-8">
                <div className="flex justify-center gap-2 sm:gap-4">
                  {verificationCode.map((digit, index) => (
                    <input
                      key={index}
                      ref={el => { inputRefs.current[index] = el }}
                      type="text"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleCodeChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      className="w-10 h-12 sm:w-12 sm:h-14 text-center text-xl font-bold rounded-xl border border-zinc-200 bg-white text-zinc-900 focus:border-zinc-900 focus:ring-4 focus:ring-zinc-900/5 outline-none transition-all"
                    />
                  ))}
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
                      Vérifier
                      <Check className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 text-sm text-zinc-500">
                Vous n'avez pas reçu le code ?{' '}
                <button className="font-semibold text-zinc-900 hover:underline">
                  Renvoyer
                </button>
              </div>
              
              <button 
                onClick={() => setStep('2fa_selection')}
                className="mt-4 text-sm text-zinc-400 hover:text-zinc-600"
              >
                Changer de méthode
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#F9F7F4]"><Loader2 className="w-8 h-8 animate-spin text-zinc-900" /></div>}>
      <LoginForm />
    </Suspense>
  );
}
