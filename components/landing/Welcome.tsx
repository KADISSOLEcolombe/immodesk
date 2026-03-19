import Image from 'next/image';
import { ChevronRight } from 'lucide-react';

export default function Welcome() {
  return (
    <section className="py-20 bg-white overflow-hidden">
      <div className="container mx-auto px-6">
        <div className="flex flex-col lg:flex-row gap-16 items-center">
          {/* Images Grid */}
          <div className="w-full lg:w-1/2 h-[500px]">
            <div className="relative h-full w-full overflow-hidden shadow-2xl">
              <Image
                  src="https://images.unsplash.com/photo-1611892440504-42a792e24d32?q=80&w=1000&auto=format&fit=crop"
                  alt="Luxury Interior"
                  fill
                  className="object-cover"
              />
            </div>
          </div>

          {/* Content */}
          <div className="w-full lg:w-1/2">
            <div className="text-[10px] font-bold tracking-widest text-amber-600 uppercase mb-4">
              Welcome to IMMODESK
            </div>
            <h2 className="font-serif text-4xl md:text-5xl text-gray-900 mb-8 leading-tight">
              Luxury hotel in the <br/> heart of the city.
            </h2>
            <p className="text-gray-500 text-sm leading-relaxed mb-8 max-w-md">
              IMMODESK, ce sont plus de 500 appartements et maisons de luxe au cœur de la ville. Confort moderne, prestations premium et service personnalisé : offrez-vous le meilleur de l'hospitalité avec une vue imprenable. Réservez votre havre de paix avec IMMODESK.
            </p>
            
            <button className="px-8 py-3 bg-[#C19B76] text-white text-[10px] font-bold tracking-widest uppercase hover:bg-[#a68564] transition-colors flex items-center gap-2">
              Read More <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
