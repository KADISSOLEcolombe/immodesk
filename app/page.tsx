
import Navbar from '@/components/landing/Navbar';
import Hero from '@/components/landing/Hero';
import Features from '@/components/landing/Features';
import Welcome from '@/components/landing/Welcome';
import Rooms from '@/components/landing/Rooms';

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white font-sans text-gray-900">
      <Navbar />
      <Hero />
      <Features />
      <Welcome />
      <Rooms />
      
      {/* Simple Footer */}
      <footer className="bg-[#1C1C1C] text-white py-12 border-t border-white/10">
        <div className="container mx-auto px-6 text-center">
          <div className="font-serif text-2xl tracking-widest font-bold mb-8">IMMODESK</div>
          <div className="flex justify-center gap-8 text-xs font-medium tracking-widest uppercase text-gray-400 mb-8">
            <a href="#" className="hover:text-white transition-colors">Home</a>
            <a href="#" className="hover:text-white transition-colors">Rooms</a>
            <a href="#" className="hover:text-white transition-colors">About</a>
            <a href="#" className="hover:text-white transition-colors">Contact</a>
          </div>
          <div className="text-[10px] text-gray-600 uppercase tracking-widest">
            © 2026 IMMODESK . All rights reserved.
          </div>
        </div>
      </footer>
    </main>
  );
}
