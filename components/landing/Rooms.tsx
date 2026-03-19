import Link from 'next/link';
import Image from 'next/image';
import { Star, Heart } from 'lucide-react';

const featuredListings = [
  {
    id: 'prop-1',
    title: 'Appartement meublé à Bè',
    description: 'À quelques minutes du centre de Lomé',
    rating: 4.88,
    price: 180000,
   
    image: 'https://images.unsplash.com/photo-1616046229478-9901c5536a45?auto=format&fit=crop&w=1400&q=80',
  },
  {
    id: 'prop-2',
    title: 'Villa moderne avec piscine',
    description: 'Quartier résidentiel calme',
    rating: 4.95,
    price: 450000,
   
    image: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1400&q=80',
  },
  {
    id: 'prop-3',
    title: 'Studio cosy centre-ville',
    description: 'Parfait pour les séjours courts',
    rating: 4.75,
    price: 95000,
   
    image: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1400&q=80',
  },
  {
    id: 'prop-4',
    title: 'Duplex vue panoramique',
    description: 'Vue imprenable sur la ville',
    rating: 5.0,
    price: 320000,
    image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=1400&auto=format&fit=crop',
  },
];

const currencyFormatter = new Intl.NumberFormat('fr-TG', {
  style: 'currency',
  currency: 'XOF',
  maximumFractionDigits: 0,
});

export default function Rooms() {
  return (
    <section className="py-24 bg-[#F9F7F4]">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <div className="text-[10px] font-bold tracking-widest text-amber-600 uppercase mb-3">
            Exquisite and Luxurious
          </div>
          <h2 className="font-serif text-4xl text-gray-900">
            Room and suite collection
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-10">
          {featuredListings.map((listing) => (
            <Link key={listing.id} href={`/properties/${listing.id}`} className="group block">
              <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-gray-200 mb-3">
                <Image
                  src={listing.image}
                  alt={listing.title}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <button className="absolute top-3 right-3 p-2 rounded-full hover:bg-white/10 transition-colors z-10">
                  <Heart className="w-6 h-6 text-white stroke-2 fill-black/20" />
                </button>
              </div>
              
              <div className="flex justify-between items-start gap-2">
                <h3 className="font-semibold text-gray-900 truncate pr-4 text-[15px]">
                  {listing.title}
                </h3>
                <div className="flex items-center gap-1 shrink-0 text-sm">
                  <Star className="w-3 h-3 fill-current text-gray-900" />
                  <span>{listing.rating}</span>
                </div>
              </div>
              
              <p className="text-gray-500 text-[15px] truncate">
                {listing.description}
              </p>
              v
              <div className="flex items-baseline gap-1 mt-1">
                <span className="font-semibold text-gray-900 text-[15px]">
                  {currencyFormatter.format(listing.price)}
                </span>
                
              </div>
            </Link>
          ))}
        </div>
        
        <div className="mt-16 text-center">
             <Link href="/properties" className="inline-block border border-gray-900 text-gray-900 px-8 py-3 text-[10px] font-bold tracking-widest uppercase hover:bg-gray-900 hover:text-white transition-colors">
                View All Properties
             </Link>
        </div>
      </div>
    </section>
  );
}
