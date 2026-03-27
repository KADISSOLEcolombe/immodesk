
import { MapPin, Armchair, UserCheck, Tag } from 'lucide-react';

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

export default function Features() {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 text-center">
          {features.map((feature, index) => (
            <div key={index} className="flex flex-col items-center group">
              <div className="mb-6 p-4 rounded-full border border-amber-100 text-amber-900/60 group-hover:bg-amber-50 group-hover:text-amber-900 transition-colors">
                <feature.icon strokeWidth={1} className="w-8 h-8" />
              </div>
              <h3 className="font-serif text-lg font-medium mb-3 text-gray-900">
                {feature.title}
              </h3>
              <p className="text-xs leading-relaxed text-gray-500 max-w-[200px]">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
