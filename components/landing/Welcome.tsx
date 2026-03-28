"use client";

import Image from 'next/image';
import { ChevronRight, Award, Globe, Headphones } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

const highlights = [
  { icon: Award, value: '10+', label: 'Années d\'expérience' },
  { icon: Globe, value: '50+', label: 'Villes couvertes' },
  { icon: Headphones, value: '24/7', label: 'Support client' },
];

export default function Welcome() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.2 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="biens" className="py-24 bg-background overflow-hidden transition-colors duration-500">
      <div ref={ref} className="container mx-auto px-6">
        <div className="flex flex-col lg:flex-row gap-16 items-center">
          {/* Image */}
          <div
            className={`w-full lg:w-1/2 transition-all duration-1000 ${
              visible ? 'translate-x-0 opacity-100' : '-translate-x-12 opacity-0'
            }`}
          >
            <div className="relative">
              <div className="relative h-[500px] w-full overflow-hidden rounded-3xl shadow-2xl">
                <Image
                  src="https://images.unsplash.com/photo-1611892440504-42a792e24d32?q=80&w=1000&auto=format&fit=crop"
                  alt="Intérieur luxueux"
                  fill
                  className="object-cover"
                />
              </div>
              {/* Floating Accent Card */}
              <div className="absolute -bottom-6 -right-6 bg-foreground text-background p-6 rounded-2xl shadow-2xl max-w-[200px]">
                <div className="text-3xl font-serif font-bold text-amber-600 mb-1">98%</div>
                <div className="text-xs text-muted-foreground uppercase tracking-widest">Taux de satisfaction</div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div
            className={`w-full lg:w-1/2 transition-all duration-1000 delay-200 ${
              visible ? 'translate-x-0 opacity-100' : 'translate-x-12 opacity-0'
            }`}
          >
            <div className="text-[10px] font-bold tracking-widest text-amber-600 uppercase mb-4">
              Bienvenue chez IMMODESK
            </div>
            <h2 className="font-serif text-4xl md:text-5xl text-foreground mb-6 leading-tight transition-colors duration-500">
              L&apos;immobilier de prestige<br />
              <span className="text-amber-700 dark:text-amber-500">au cœur de la ville.</span>
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed mb-8 max-w-md">
              IMMODESK, ce sont plus de 500 appartements et maisons de luxe au cœur de la ville.
              Confort moderne, prestations premium et service personnalisé : offrez-vous le meilleur
              de l&apos;immobilier avec une qualité incomparable.
            </p>

            {/* Highlights */}
            <div className="grid grid-cols-3 gap-6 mb-10">
              {highlights.map(({ icon: Icon, value, label }) => (
                <div key={label} className="text-center">
                  <Icon className="w-5 h-5 text-amber-600 mx-auto mb-2" strokeWidth={1.5} />
                  <div className="text-xl font-bold text-foreground font-serif transition-colors duration-500">{value}</div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">{label}</div>
                </div>
              ))}
            </div>

            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-primary text-primary-foreground text-xs font-bold tracking-widest uppercase rounded-full hover:bg-primary/90 transition-all shadow-lg hover:scale-105"
            >
              En savoir plus <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
