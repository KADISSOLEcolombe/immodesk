"use client";

import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { FormEvent, useEffect, useState, Suspense, useRef } from 'react';
import { Mail, Lock, ArrowRight, ArrowLeft, Loader2, Check, MessageSquare, Eye, AlertTriangle, Play, X, KeyRound, Hash } from 'lucide-react';
import { AuthService } from '@/lib/auth-service';

type UserRole = 'tenant' | 'owner' | 'admin';
type LoginStep = 'credentials' | '2fa_verify';
type TwoFactorMethod = 'email' | 'sms' | null;
type LoginTab = 'login' | 'visite';
type VisiteStep = 'credentials' | 'warning';

type TwoFAChallengeData = {
  otp_token?: string;
  canal?: 'mail' | 'sms';
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';
const formattedApiUrl = API_BASE_URL.endsWith('/api') ? API_BASE_URL : `${API_BASE_URL}/api`;

function normalizeRole(role: string | null): UserRole {
  if (role === 'tenant' || role === 'locataire') return 'tenant';
  if (role === 'owner' || role === 'proprietaire') return 'owner';
  if (role === 'admin' || role === 'superadmin') return 'admin';
  return 'tenant';
}

function resolvePostLoginTarget(defaultTarget: string, redirectTarget: string | null): string {
  if (!redirectTarget) return defaultTarget;
  if (!redirectTarget.startsWith('/') || redirectTarget.startsWith('//')) return defaultTarget;
  return redirectTarget;
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<LoginTab>('login');
  const [step, setStep] = useState<LoginStep>('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('tenant');
  const [isLoading, setIsLoading] = useState(false);
  
  // 2FA States
  const [twoFactorMethod, setTwoFactorMethod] = useState<TwoFactorMethod>(null);
  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Visite states
  const [visiteStep, setVisiteStep] = useState<VisiteStep>('credentials');
  const [visiteIdentifiant, setVisiteIdentifiant] = useState('');
  const [visiteCode, setVisiteCode] = useState('');
  const [visiteToken, setVisiteToken] = useState('');
  const [visiteInfo, setVisiteInfo] = useState<{ id: string; nom: string; bien_adresse: string } | null>(null);
  const [visiteError, setVisiteError] = useState('');

  useEffect(() => {
    const paramRole = searchParams.get('role');
    if (paramRole) setRole(normalizeRole(paramRole));
    const paramTab = searchParams.get('tab');
    if (paramTab === 'visite') setActiveTab('visite');
  }, [searchParams]);

  // ────── LOGIN HANDLERS ──────

  const handleCredentialsSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email.trim() || !password.trim()) return;
    setIsLoading(true);
    try {
      const response = await AuthService.login({ email: email.trim(), password: password.trim() });
      if (response.success) {
        if (response.code === 'AUTH_2FA_REQUIRED') {
          const twoFaData = (response.data ?? {}) as TwoFAChallengeData;
          const otpToken = twoFaData.otp_token;
          const canal = twoFaData.canal;
          if (otpToken) AuthService.setTempOTPData(otpToken, canal || 'mail');
          setTwoFactorMethod(canal === 'sms' ? 'sms' : 'email');
          setStep('2fa_verify');
          return;
        }
        const defaultTarget = AuthService.getDashboardRouteForCurrentUser();
        const redirectTarget = searchParams.get('redirect');
        router.push(resolvePostLoginTarget(defaultTarget, redirectTarget));
      }
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCodeChange = (index: number, value: string) => {
    if (value.length > 1) return;
    const newCode = [...verificationCode];
    newCode[index] = value;
    setVerificationCode(newCode);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
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
    try {
      const code = verificationCode.join('');
      const response = await AuthService.verifyOTP(code);
      if (response.success) {
        const defaultTarget = AuthService.getDashboardRouteForCurrentUser();
        const redirectTarget = searchParams.get('redirect');
        router.push(resolvePostLoginTarget(defaultTarget, redirectTarget));
      } else {
        setVerificationCode(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (error) {
      console.error('2FA verification error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    setIsLoading(true);
    try {
      await AuthService.resendOTP();
    } catch (error) {
      console.error('Resend OTP error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // ────── VISITE HANDLERS ──────

  const handleVisiteLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!visiteIdentifiant.trim() || !visiteCode.trim()) return;
    setIsLoading(true);
    setVisiteError('');
    try {
      const res = await fetch(`${formattedApiUrl}/visites/connexion/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifiant: visiteIdentifiant.trim(), code: visiteCode.trim() }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        setVisiteToken(json.data.token);
        setVisiteInfo(json.data.visite || null);
        setVisiteStep('warning');
      } else {
        // Build error message from response
        let errMsg = json.message || 'Identifiant ou code invalide.';
        if (json.errors && json.errors.length > 0) {
          errMsg += '\n' + json.errors.map((e: { message: string }) => e.message).join('\n');
        }
        setVisiteError(errMsg);
      }
    } catch {
      setVisiteError('Impossible de contacter le serveur. Vérifiez votre connexion.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartVisit = () => {
    // Store the token and redirect to the tour viewer
    if (typeof window !== 'undefined') {
      localStorage.setItem('visiteur_token', visiteToken);
      if (visiteInfo) {
        localStorage.setItem('visite_id', visiteInfo.id);
      }
    }
    // Navigate to the public tour viewer with the token
    router.push(`/tour/viewer?token=${encodeURIComponent(visiteToken)}`);
  };

  const handleCancelVisit = () => {
    setVisiteStep('credentials');
    setVisiteToken('');
    setVisiteInfo(null);
  };

  return (
    <div className="min-h-screen w-full flex bg-background">
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
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-6 lg:p-12 relative bg-white overflow-y-auto h-screen">
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

        <div className="w-full max-w-md space-y-6 mt-12 lg:mt-0">

          {/* Tab Selector */}
          <div className="flex bg-zinc-100/80 rounded-2xl p-1.5 shadow-inner">
            <button
              onClick={() => { setActiveTab('login'); setVisiteStep('credentials'); setVisiteError(''); }}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-300 ${
                activeTab === 'login'
                  ? 'bg-white text-zinc-900 shadow-sm ring-1 ring-zinc-200'
                  : 'text-zinc-500 hover:text-zinc-700 hover:bg-zinc-200/50'
              }`}
            >
              <Lock className="w-4 h-4" />
              Connexion
            </button>
            <button
              onClick={() => { setActiveTab('visite'); setStep('credentials'); }}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-300 ${
                activeTab === 'visite'
                  ? 'bg-white text-zinc-900 shadow-sm ring-1 ring-zinc-200'
                  : 'text-zinc-500 hover:text-zinc-700 hover:bg-zinc-200/50'
              }`}
            >
              <Eye className="w-4 h-4" />
              Visite Virtuelle
            </button>
          </div>
          
          {/* ═══════════════════════════════════════════ */}
          {/* LOGIN TAB */}
          {/* ═══════════════════════════════════════════ */}
          {activeTab === 'login' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* STEP 1: Credentials */}
              {step === 'credentials' && (
                <>
                  <div className="text-center lg:text-left mb-6">
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
                </>
              )}

              {/* STEP 2: 2FA Verification */}
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
                    Vous n&apos;avez pas reçu le code ?{' '}
                    <button 
                      onClick={handleResendCode}
                      disabled={isLoading}
                      className="font-semibold text-zinc-900 hover:underline disabled:opacity-50"
                    >
                      Renvoyer
                    </button>
                  </div>
                  
                  <button 
                    onClick={() => {
                      setVerificationCode(['', '', '', '', '', '']);
                      setStep('credentials');
                    }}
                    className="mt-4 text-sm text-zinc-400 hover:text-zinc-600"
                  >
                    Retour à la connexion
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ═══════════════════════════════════════════ */}
          {/* VISITE VIRTUELLE TAB */}
          {/* ═══════════════════════════════════════════ */}
          {activeTab === 'visite' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              
              {/* VISITE STEP 1: Credentials */}
              {visiteStep === 'credentials' && (
                <>
                  <div className="text-center lg:text-left mb-6">
                    <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center mb-4 mx-auto lg:mx-0">
                      <Eye className="w-7 h-7 text-amber-700" />
                    </div>
                    <h1 className="text-3xl font-bold text-zinc-900">Visite Virtuelle</h1>
                    <p className="mt-2 text-zinc-500">Saisissez l&apos;identifiant et le code reçus par email.</p>
                  </div>

                  <form onSubmit={handleVisiteLogin} className="space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 mb-1.5">Identifiant</label>
                      <div className="relative">
                        <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                        <input
                          type="text"
                          value={visiteIdentifiant}
                          onChange={(e) => setVisiteIdentifiant(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 rounded-xl border border-zinc-200 bg-white text-zinc-900 placeholder:text-zinc-400 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 outline-none transition-all"
                          placeholder="VISIT-XXXXXXXX"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-zinc-700 mb-1.5">Code d&apos;accès</label>
                      <div className="relative">
                        <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                        <input
                          type="password"
                          value={visiteCode}
                          onChange={(e) => setVisiteCode(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 rounded-xl border border-zinc-200 bg-white text-zinc-900 placeholder:text-zinc-400 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 outline-none transition-all"
                          placeholder="••••••••"
                          required
                        />
                      </div>
                    </div>

                    {visiteError && (
                      <div className="p-4 bg-red-50 border border-red-100 rounded-xl">
                        <div className="flex items-start gap-3">
                          <X className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                          <div className="text-sm text-red-700 whitespace-pre-line">{visiteError}</div>
                        </div>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold py-3.5 rounded-xl transition-all shadow-lg shadow-amber-600/20 hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {isLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          Valider mes identifiants
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>

                  <p className="text-center text-xs text-zinc-400 mt-6">
                    Les identifiants sont envoyés par email après le paiement de la visite.
                  </p>
                </>
              )}

              {/* VISITE STEP 2: Warning + Start */}
              {visiteStep === 'warning' && (
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center mb-4 mx-auto">
                      <AlertTriangle className="w-7 h-7 text-amber-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-zinc-900 mb-2">Attention</h1>
                  </div>

                  {visiteInfo && (
                    <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-100">
                      <div className="text-xs text-zinc-500 uppercase tracking-widest mb-1">Bien concerné</div>
                      <div className="font-semibold text-zinc-900">{visiteInfo.bien_adresse}</div>
                      {visiteInfo.nom && (
                        <div className="text-sm text-zinc-500 mt-1">{visiteInfo.nom}</div>
                      )}
                    </div>
                  )}

                  <div className="p-5 bg-amber-50/80 border border-amber-200/50 rounded-2xl">
                    <div className="flex gap-3">
                      <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                      <div className="text-sm text-amber-900 leading-relaxed">
                        <strong>Votre visite n&apos;est valide que pour une seule utilisation.</strong>
                        <br /><br />
                        Après utilisation, ces identifiants seront invalides. Êtes-vous prêt pour votre visite ?
                        Vous pouvez toujours faire marche arrière.
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    <button
                      onClick={handleStartVisit}
                      className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3.5 rounded-xl transition-all shadow-lg shadow-emerald-600/20 hover:scale-[1.02]"
                    >
                      <Play className="w-4 h-4" />
                      Démarrer la visite
                    </button>
                    <button
                      onClick={handleCancelVisit}
                      className="w-full flex items-center justify-center gap-2 border border-zinc-200 text-zinc-700 font-medium py-3 rounded-xl transition-all hover:bg-zinc-50"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Annuler et revenir
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Contact Admin & Information Section */}
        <div className="w-full max-w-md mt-8 p-6 bg-card/40 backdrop-blur-md border border-border rounded-3xl shadow-lg transition-all hover:shadow-xl group">
          <div className="flex items-start gap-4 mb-4">
            <div className="p-3 rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20 transition-transform group-hover:scale-110">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">Besoin d&apos;assistance ?</h3>
              <p className="text-xs text-muted-foreground">Notre équipe est à votre écoute</p>
            </div>
          </div>
          
          <div className="space-y-4 mb-6">
            <div className="relative pl-4 border-l-2 border-primary/20">
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                <strong className="text-foreground">Propriétaire ?</strong> Contactez l&apos;admin ici pour discuter de l&apos;intégration de vos biens.
              </p>
            </div>
            <div className="relative pl-4 border-l-2 border-amber-500/20">
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                <strong className="text-foreground">Un bien vous intéresse ?</strong> Visitez nos biens et contactez le propriétaire associé pour discuter des détails de votre intégration afin d&apos;avoir un compte utilisateur pour pouvoir vous connecter.
              </p>
            </div>
          </div>

          <Link
            href="mailto:admin@immodesk.tg"
            className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl bg-secondary text-sm font-bold text-foreground hover:bg-secondary/80 transition-all active:scale-[0.98]"
          >
            <Mail className="w-4 h-4" />
            Contacter l&apos;administrateur
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}>
      <LoginForm />
    </Suspense>
  );
}
