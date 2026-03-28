"use client";

import Image from 'next/image';
import Link from 'next/link';
import { ChevronRight, Building2, Users, MapPin } from 'lucide-react';
import { useEffect, useState } from 'react';

const stats = [
  { icon: Building2, value: 500, suffix: '+', label: 'Biens disponibles' },
  { icon: Users, value: 200, suffix: '+', label: 'Clients satisfaits' },
  { icon: MapPin, value: 50, suffix: '+', label: 'Villes couvertes' },
];

function AnimatedCounter({ target, suffix }: { target: number; suffix: string }) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setStarted(true), 600);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!started) return;
    const duration = 2000;
    const steps = 60;
    const increment = target / steps;
    let current = 0;
    const interval = setInterval(() => {
      current += increment;
      if (current >= target) {
        setCount(target);
        clearInterval(interval);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(interval);
  }, [started, target]);

  return <span>{count}{suffix}</span>;
}

export default function Hero() {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(true);
  }, []);

  return (
    <section id="accueil" className="relative h-screen w-full overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <Image
          src="https://images.unsplash.com/photo-1618773928121-c32242e63f39?q=80&w=2070&auto=format&fit=crop"
          alt="Luxury Property"
          fill
          className="object-cover brightness-[0.65]"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-background/80 dark:to-background" />
      </div>

      {/* 3D Floating Shapes */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Shape 1 - Top Right */}
        <div
          className="absolute top-[15%] right-[10%] w-24 h-24 opacity-10"
          style={{
            animation: 'float3d 12s ease-in-out infinite',
            perspective: '600px',
          }}
        >
          <div
            className="w-full h-full border border-amber-300/40 rounded-lg"
            style={{
              animation: 'spin3d 20s linear infinite',
              transformStyle: 'preserve-3d',
            }}
          />
        </div>
        {/* Shape 2 - Bottom Left */}
        <div
          className="absolute bottom-[25%] left-[8%] w-16 h-16 opacity-10"
          style={{
            animation: 'float3d 15s ease-in-out infinite reverse',
            perspective: '600px',
          }}
        >
          <div
            className="w-full h-full border border-amber-200/30 rotate-45"
            style={{
              animation: 'spin3d 25s linear infinite reverse',
              transformStyle: 'preserve-3d',
            }}
          />
        </div>
        {/* Shape 3 - Center Right */}
        <div
          className="absolute top-[50%] right-[20%] w-32 h-32 opacity-[0.05]"
          style={{
            animation: 'float3d 18s ease-in-out infinite',
            perspective: '800px',
          }}
        >
          <div
            className="w-full h-full rounded-full border-2 border-amber-100/40"
            style={{
              animation: 'spin3d 30s linear infinite',
              transformStyle: 'preserve-3d',
            }}
          />
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex h-full flex-col items-center justify-center text-center text-white px-4">
        <div
          className={`transition-all duration-1000 delay-200 ${
            loaded ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`}
        >
          <div className="flex items-center justify-center gap-1.5 mb-5">
            {[...Array(5)].map((_, i) => (
              <span key={i} className="text-amber-400 text-sm">★</span>
            ))}
          </div>

          <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl mb-4 tracking-wide leading-tight">
            <span className="block">Votre Espace</span>
            <span className="block bg-gradient-to-r from-amber-200 via-amber-300 to-amber-200 bg-clip-text text-transparent">
              D&apos;Exception
            </span>
          </h1>

          <p className="max-w-xl mx-auto text-sm md:text-base font-light tracking-wide mb-10 text-gray-300 leading-relaxed">
            Découvrez notre sélection exclusive de biens immobiliers haut de gamme.
            Confort moderne, prestations premium et service personnalisé.
          </p>
        </div>

        <div
          className={`flex flex-col sm:flex-row gap-4 transition-all duration-1000 delay-500 ${
            loaded ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`}
        >
          <a
            href="#biens"
            onClick={(e) => {
              e.preventDefault();
              document.querySelector('#biens')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="flex items-center justify-center gap-2 px-8 py-3.5 bg-amber-200 text-zinc-900 font-bold text-xs tracking-widest uppercase rounded-full hover:bg-amber-100 transition-all shadow-2xl shadow-amber-200/20 hover:scale-105"
          >
            Explorer nos biens <ChevronRight className="w-4 h-4" />
          </a>
          <Link
            href="/login?tab=visite"
            className="flex items-center justify-center gap-2 px-8 py-3.5 border border-white/30 text-white font-medium text-xs tracking-widest uppercase rounded-full hover:bg-white/10 transition-all"
          >
            Visite Virtuelle 360°
          </Link>
        </div>
      </div>

      {/* Stats Bar */}
      <div
        className={`absolute bottom-0 left-0 right-0 z-10 transition-all duration-1000 delay-700 ${
          loaded ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
        }`}
      >
        <div className="bg-background/60 backdrop-blur-xl border-t border-border/50">
          <div className="container mx-auto px-6 py-6">
            <div className="grid grid-cols-3 gap-6 max-w-2xl mx-auto">
              {stats.map(({ icon: Icon, value, suffix, label }) => (
                <div key={label} className="text-center">
                  <Icon className="w-5 h-5 text-amber-300 mx-auto mb-2" strokeWidth={1.5} />
                  <div className="text-2xl md:text-3xl font-bold text-foreground font-serif tracking-wide transition-colors duration-500">
                    <AnimatedCounter target={value} suffix={suffix} />
                  </div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes float3d {
          0%, 100% { transform: translateY(0) translateX(0); }
          25% { transform: translateY(-20px) translateX(10px); }
          50% { transform: translateY(-10px) translateX(-10px); }
          75% { transform: translateY(-25px) translateX(5px); }
        }
        @keyframes spin3d {
          0% { transform: rotateX(0deg) rotateY(0deg) rotateZ(0deg); }
          100% { transform: rotateX(360deg) rotateY(360deg) rotateZ(360deg); }
        }
      `}</style>
    </section>
  );
}
