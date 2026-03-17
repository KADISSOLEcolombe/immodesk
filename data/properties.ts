export interface Property {
  id: string;
  title: string;
  description: string;
  address: {
    street: string;
    city: string;
    postalCode: string;
  };
  financial: {
    rentAmount: number;
    chargesAmount: number;
  };
  features: {
    surface: number;
    rooms: number;
    bedrooms: number;
  };
  images: string[];
  status: 'vacant' | 'rented' | 'maintenance';
}

export const mockProperties: Property[] = [
  {
    id: 'prop-1',
    title: 'Appartement meublé à Bè',
    description: 'Appartement rénové, idéalement situé à quelques minutes du centre de Lomé.',
    address: {
      street: 'Avenue de la Libération, Bè',
      city: 'Lomé',
      postalCode: 'BP 1001',
    },
    financial: {
      rentAmount: 180000,
      chargesAmount: 15000,
    },
    features: {
      surface: 68,
      rooms: 3,
      bedrooms: 2,
    },
    images: [
      'https://images.unsplash.com/photo-1616046229478-9901c5536a45?auto=format&fit=crop&w=1400&q=80',
      'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1400&q=80',
      'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1400&q=80',
    ],
    status: 'vacant',
  },
  {
    id: 'prop-2',
    title: 'Studio moderne proche université',
    description: 'Studio compact et sécurisé, adapté aux étudiants et jeunes actifs.',
    address: {
      street: 'Quartier Kpota',
      city: 'Kara',
      postalCode: 'BP 204',
    },
    financial: {
      rentAmount: 75000,
      chargesAmount: 8000,
    },
    features: {
      surface: 28,
      rooms: 1,
      bedrooms: 1,
    },
    images: [
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1400&q=80',
      'https://images.unsplash.com/photo-1631049552240-59c37f38802b?auto=format&fit=crop&w=1400&q=80',
      'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=1400&q=80',
    ],
    status: 'rented',
  },
  {
    id: 'prop-3',
    title: 'Maison familiale avec cour',
    description: 'Grande maison dans un environnement calme, parfaite pour une famille.',
    address: {
      street: 'Route de Tchamba',
      city: 'Sokodé',
      postalCode: 'BP 356',
    },
    financial: {
      rentAmount: 250000,
      chargesAmount: 20000,
    },
    features: {
      surface: 122,
      rooms: 5,
      bedrooms: 4,
    },
    images: [
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=80',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1400&q=80',
      'https://images.unsplash.com/photo-1600210492493-0946911123ea?auto=format&fit=crop&w=1400&q=80',
    ],
    status: 'maintenance',
  },
  {
    id: 'prop-4',
    title: 'T2 proche du marché',
    description: 'Appartement avec balcon, commerces et transport à proximité.',
    address: {
      street: 'Quartier Nyivé',
      city: 'Kpalimé',
      postalCode: 'BP 478',
    },
    financial: {
      rentAmount: 110000,
      chargesAmount: 10000,
    },
    features: {
      surface: 46,
      rooms: 2,
      bedrooms: 1,
    },
    images: [
      'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1400&q=80',
      'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?auto=format&fit=crop&w=1400&q=80',
      'https://images.unsplash.com/photo-1600607687644-c7f34b5f8f3f?auto=format&fit=crop&w=1400&q=80',
    ],
    status: 'vacant',
  },
  {
    id: 'prop-5',
    title: 'Villa duplex moderne',
    description: 'Beaux volumes, finitions modernes et quartier résidentiel.',
    address: {
      street: 'Avenue des Palmiers',
      city: 'Atakpamé',
      postalCode: 'BP 612',
    },
    financial: {
      rentAmount: 230000,
      chargesAmount: 18000,
    },
    features: {
      surface: 95,
      rooms: 4,
      bedrooms: 2,
    },
    images: [
      'https://images.unsplash.com/photo-1600607687644-c7f34b5f8f3f?auto=format&fit=crop&w=1400&q=80',
      'https://images.unsplash.com/photo-1600566752355-35792bedcfea?auto=format&fit=crop&w=1400&q=80',
      'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&w=1400&q=80',
    ],
    status: 'rented',
  },
  {
    id: 'prop-6',
    title: 'Immeuble en cours de rénovation',
    description: 'Projet de rénovation en cours dans une zone en plein développement.',
    address: {
      street: 'Route nationale N°1',
      city: 'Tsévié',
      postalCode: 'BP 825',
    },
    financial: {
      rentAmount: 160000,
      chargesAmount: 12000,
    },
    features: {
      surface: 80,
      rooms: 3,
      bedrooms: 2,
    },
    images: [
      'https://images.unsplash.com/photo-1600047509358-9dc75507daeb?auto=format&fit=crop&w=1400&q=80',
      'https://images.unsplash.com/photo-1600585152915-d208bec867a1?auto=format&fit=crop&w=1400&q=80',
      'https://images.unsplash.com/photo-1600573472592-401b489a3cdc?auto=format&fit=crop&w=1400&q=80',
    ],
    status: 'maintenance',
  },
];
