
import Image from 'next/image';
import { ChevronRight } from 'lucide-react';

export default function Hero() {
  return (
    <section className="relative h-screen w-full overflow-hidden rounded-t-[40px] md:rounded-t-[80px]">
      {/* Background Image */}
      <div className="absolute inset-0">
        <Image
          src="https://images.unsplash.com/photo-1618773928121-c32242e63f39?q=80&w=2070&auto=format&fit=crop"
          alt="Luxury Hotel Room"
          fill
          className="object-cover brightness-[0.85]"
          priority
        />
        <div className="absolute inset-0 bg-[#2a1a0f]/40" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex h-full flex-col items-center justify-center text-center text-white px-4">
        <div className="flex items-center gap-1 mb-4 text-amber-400">
          {[...Array(5)].map((_, i) => (
            <span key={i} className="text-xs">★</span>
          ))}
        </div>
        
        <h1 className="font-serif text-5xl md:text-7xl mb-6 tracking-wide">
        IMMODESK
        </h1>
        
        <p className="max-w-2xl text-sm md:text-base font-light tracking-wide mb-10 text-gray-200">
          Votre meilleure site pour toutes vos location .
        </p>
        
        <button className="flex items-center gap-2 text-xs font-medium tracking-widest uppercase border-b border-white/50 pb-1 hover:text-amber-200 hover:border-amber-200 transition-colors">
          Explore <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      {/* Bottom Bar */}
      <div className="absolute bottom-0 left-0 right-0 z-10 flex flex-col md:flex-row justify-between items-end px-6 py-8 md:items-center">
       
        
    
      </div>
    </section>
  );
}
