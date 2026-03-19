
import { MapPin, Armchair, UserCheck, Tag } from 'lucide-react';

const features = [
  {
    icon: MapPin,
    title: 'Located in the heart of the city',
    description: 'Ideally located in the city\'s heart for easy access and convenience.',
  },
  {
    icon: Armchair, // Using Armchair as a proxy for "Luxurious" icon
    title: 'Luxurious, modern, and comfortable',
    description: 'Experience a luxurious, modern, and fully equipped space for comfort.',
  },
  {
    icon: UserCheck, // Using UserCheck for "Friendly staff"
    title: 'Friendly and welcoming staff',
    description: 'Our friendly and welcoming staff ensure a delightful stay every time.',
  },
  {
    icon: Tag, // Using Tag for "Best prices"
    title: 'Best prices and great offers',
    description: 'Enjoy unbeatable prices with fantastic offers tailored just for you.',
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
