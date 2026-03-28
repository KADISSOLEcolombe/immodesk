"use client";

import { MapPin, Armchair, UserCheck, Tag, Shield, Clock } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

const features = [
  {
    icon: MapPin,
    title: 'Situé au cœur de la ville',
    description: 'Idéalement situé au cœur de la ville pour un accès facile et pratique.',
  },
  {
    icon: Armchair,
    title: 'Luxueux, moderne et confortable',
    description: 'Profitez d’un espace luxueux, moderne et entièrement équipé pour votre confort.',
  },
  {
    icon: UserCheck,
    title: 'Personnel accueillant et chaleureux',
    description: 'Notre personnel accueillant et chaleureux vous garantit un séjour agréable à chaque fois.',
  },
  {
    icon: Tag,
    title: 'Meilleurs prix et offres exceptionnelles',
    description: 'Profitez de prix imbattables avec des offres exceptionnelles rien que pour vous.',
  },
];

function FeatureCard({ feature, index }: { feature: typeof features[0]; index: number }) {
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

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = ref.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    card.style.transform = `perspective(800px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg) scale(1.02)`;
  };

  const handleMouseLeave = () => {
    if (ref.current) {
      ref.current.style.transform = 'perspective(800px) rotateY(0deg) rotateX(0deg) scale(1)';
    }
  };

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`group flex flex-col items-center text-center p-8 rounded-2xl border border-border bg-card/80 backdrop-blur-sm shadow-sm hover:shadow-xl hover:border-primary/20 transition-all duration-500 cursor-default ${
        visible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
      }`}
      style={{
        transitionDelay: `${index * 100}ms`,
        transformStyle: 'preserve-3d',
        willChange: 'transform',
      }}
    >
      <div className="mb-6 p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-amber-100/50 text-amber-700 group-hover:from-amber-100 group-hover:to-amber-200/50 group-hover:text-amber-900 transition-all duration-300 group-hover:scale-110">
        <feature.icon strokeWidth={1.5} className="w-7 h-7" />
      </div>
      <h3 className="font-serif text-lg font-medium mb-3 text-foreground transition-colors duration-500">
        {feature.title}
      </h3>
      <p className="text-sm leading-relaxed text-muted-foreground max-w-[240px]">
        {feature.description}
      </p>
    </div>
  );
}

export default function Features() {
  return (
    <section className="py-24 bg-background transition-colors duration-500">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <div className="text-[10px] font-bold tracking-widest text-amber-600 uppercase mb-3">
            Pourquoi nous choisir
          </div>
          <h2 className="font-serif text-4xl md:text-5xl text-foreground mb-4 transition-colors duration-500">
            L&apos;excellence immobilière
          </h2>
          <p className="text-sm text-muted-foreground max-w-lg mx-auto">
            Nous combinons expertise, technologie et passion pour vous offrir une expérience immobilière sans précédent.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {features.map((feature, index) => (
            <FeatureCard key={index} feature={feature} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
