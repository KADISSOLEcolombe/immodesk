"use client";

import Link from 'next/link';
import Image from 'next/image';
import { Star, Heart, MapPin, Loader2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';
const formattedApiUrl = API_BASE_URL.endsWith('/api') ? API_BASE_URL : `${API_BASE_URL}/api`;

interface PublicBien {
  id: string;
  adresse: string;
  description: string;
  loyer_hc: string;
  charges: string;
  categorie?: { nom: string; type_detail?: string };
  photos?: { id: string; fichier: string; ordre: number }[];
  note_moyenne?: number;
  equipements?: string[];
  type_logement?: string;
  nb_pieces?: number;
  surface_m2?: string;
  has_virtual_tour?: boolean;
}

const currencyFormatter = new Intl.NumberFormat('fr-TG', {
  style: 'currency',
  currency: 'XOF',
  maximumFractionDigits: 0,
});

const fallbackImages = [
  'https://images.unsplash.com/photo-1616046229478-9901c5536a45?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80',
];

function PropertyCard({ bien, index }: { bien: PublicBien; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  const primaryPhoto = bien.photos && bien.photos.length > 0
    ? bien.photos[0].fichier
    : fallbackImages[index % fallbackImages.length];

  const isExternalUrl = primaryPhoto.startsWith('http');
  const imageUrl = isExternalUrl ? primaryPhoto : `http://127.0.0.1:8000${primaryPhoto}`;

  const loyerTotal = parseFloat(bien.loyer_hc || '0') + parseFloat(bien.charges || '0');
  const rating = bien.note_moyenne !== null && bien.note_moyenne !== undefined 
    ? Number(bien.note_moyenne) 
    : (4.5 + Math.random() * 0.5);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = ref.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    card.style.transform = `perspective(1000px) rotateY(${x * 5}deg) rotateX(${-y * 5}deg) translateY(-4px)`;
  };

  const handleMouseLeave = () => {
    if (ref.current) {
      ref.current.style.transform = 'perspective(1000px) rotateY(0deg) rotateX(0deg) translateY(0px)';
    }
  };

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`group block transition-all duration-700 ${
        visible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'
      }`}
      style={{
        transitionDelay: `${index * 120}ms`,
        transformStyle: 'preserve-3d',
        willChange: 'transform',
      }}
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-gray-200 mb-4 shadow-lg group-hover:shadow-2xl transition-shadow duration-300">
        <Image
          src={imageUrl}
          alt={bien.adresse || 'Propriété ImmoDesk'}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-110"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {bien.has_virtual_tour && (
          <div className="absolute top-3 left-3 px-3 py-1 bg-amber-500/90 backdrop-blur-sm rounded-full text-[10px] font-bold uppercase tracking-widest text-white z-10 animate-pulse shadow-sm border border-amber-400/20">
            Visite virtuelle incluse
          </div>
        )}

        <button className="absolute top-3 right-3 p-2.5 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/30 transition-all z-10">
          <Heart className="w-5 h-5 text-white stroke-2" />
        </button>
        {bien.categorie && (
          <div className="absolute bottom-3 left-3 px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-[10px] font-bold uppercase tracking-widest text-gray-700">
            {bien.categorie.nom}
          </div>
        )}
      </div>

      <div className="flex justify-between items-start gap-2 mb-1">
        <h3 className="font-semibold text-gray-900 truncate pr-4 text-[15px]">
          {bien.adresse}
        </h3>
        <div className="flex items-center gap-1 shrink-0 text-sm">
          <Star className="w-3 h-3 fill-current text-amber-500" />
          <span className="font-medium">{rating.toFixed(1)}</span>
        </div>
      </div>

      {bien.description && (
        <p className="text-gray-500 text-sm truncate mb-1">
          {bien.description}
        </p>
      )}

      <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
        <MapPin className="w-3 h-3" />
        {bien.nb_pieces && <span>{bien.nb_pieces} pièces</span>}
        {bien.surface_m2 && <span>• {bien.surface_m2} m²</span>}
        {bien.type_logement && <span>• {bien.type_logement}</span>}
      </div>

      <div className="flex items-baseline gap-1.5">
        <span className="font-bold text-foreground text-lg transition-colors duration-500">
          {currencyFormatter.format(loyerTotal)}
        </span>
        <span className="text-xs text-muted-foreground">/mois</span>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="animate-pulse">
      <div className="aspect-[4/3] w-full rounded-2xl bg-gray-200 mb-4" />
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
      <div className="h-3 bg-gray-200 rounded w-1/2 mb-2" />
      <div className="h-5 bg-gray-200 rounded w-1/3" />
    </div>
  );
}

export default function Rooms() {
  const [biens, setBiens] = useState<PublicBien[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchBiens = async () => {
      try {
        const res = await fetch(`${formattedApiUrl}/patrimoine/biens/public/`);
        const json = await res.json();
        if (json.success && json.data) {
          setBiens(json.data);
        } else {
          setError(true);
        }
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchBiens();
  }, []);

  return (
    <section id="biens" className="py-24 bg-secondary/30 transition-colors duration-500">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <div className="text-[10px] font-bold tracking-widest text-amber-600 uppercase mb-3">
            Découvrez nos offres
          </div>
          <h2 className="font-serif text-4xl md:text-5xl text-foreground mb-4 transition-colors duration-500">
            Biens disponibles
          </h2>
          <p className="text-sm text-muted-foreground max-w-lg mx-auto">
            Découvrez notre sélection de biens immobiliers vacants, prêts à vous accueillir.
          </p>
        </div>

        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-10">
            {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        )}

        {!loading && error && (
          <div className="text-center py-16">
            <div className="text-muted-foreground text-sm mb-4">Aucun bien disponible pour le moment.</div>
            <p className="text-xs text-muted-foreground/80">Revenez bientôt pour découvrir nos nouvelles offres.</p>
          </div>
        )}

        {!loading && !error && biens.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-10">
            {biens.slice(0, 4).map((bien, index) => (
              <PropertyCard key={bien.id} bien={bien} index={index} />
            ))}
          </div>
        )}

        {!loading && !error && biens.length === 0 && (
          <div className="text-center py-16">
            <div className="text-muted-foreground text-sm mb-4">Aucun bien vacant pour le moment.</div>
            <p className="text-xs text-muted-foreground/80">De nouveaux biens seront bientôt disponibles.</p>
          </div>
        )}

        <div className="mt-16 text-center">
          <Link
            href="/properties"
            className="inline-flex items-center gap-2 px-10 py-3.5 border-2 border-foreground text-foreground text-xs font-bold tracking-widest uppercase rounded-full hover:bg-foreground hover:text-background transition-all hover:scale-105"
          >
            Voir tous les biens
          </Link>
        </div>
      </div>
    </section>
  );
}
