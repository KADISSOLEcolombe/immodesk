import type { Metadata } from "next";

import Navbar from '@/components/landing/Navbar';
import Hero from '@/components/landing/Hero';
import Features from '@/components/landing/Features';
import Welcome from '@/components/landing/Welcome';
import Rooms from '@/components/landing/Rooms';
import Footer from '@/components/landing/Footer';

export const metadata: Metadata = {
  title: 'IMMODESK — Immobilier de Prestige',
  description: 'Découvrez notre sélection exclusive de biens immobiliers haut de gamme. Confort moderne, prestations premium et service personnalisé.',
};

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-background text-foreground transition-colors duration-500 overflow-x-hidden">
      <Navbar />
      <Hero />
      <Features />
      <Welcome />
      <Rooms />
      <Footer />
    </main>
  );
}
