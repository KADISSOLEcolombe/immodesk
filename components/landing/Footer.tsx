"use client";

import Link from 'next/link';
import { Home, Mail, Phone, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer id="contact" className="bg-[#1C1C1C] text-white pt-16 pb-8 border-t border-white/5">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Home className="w-5 h-5 text-amber-300" strokeWidth={1.5} />
              <span className="text-xl font-serif tracking-widest font-bold">IMMODESK</span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed mb-6">
              Votre partenaire de confiance pour l&apos;immobilier de prestige. Plus de 500 biens disponibles dans les meilleures villes.
            </p>
            <div className="flex gap-3">
              {['facebook', 'twitter', 'instagram', 'linkedin'].map((social) => (
                <a
                  key={social}
                  href="#"
                  className="w-9 h-9 rounded-full border border-white/10 flex items-center justify-center text-gray-400 hover:text-amber-300 hover:border-amber-300/30 transition-all text-xs uppercase"
                >
                  {social[0].toUpperCase()}
                </a>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="text-xs font-bold tracking-widest uppercase text-amber-300 mb-5">Navigation</h4>
            <div className="space-y-3">
              {['Accueil', 'Nos Biens', 'À Propos', 'Visites Virtuelles'].map((item) => (
                <a key={item} href="#" className="block text-sm text-gray-400 hover:text-white transition-colors">
                  {item}
                </a>
              ))}
            </div>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-xs font-bold tracking-widest uppercase text-amber-300 mb-5">Services</h4>
            <div className="space-y-3">
              {['Location Résidentielle', 'Gestion Locative', 'Visites 360°', 'Assistance Juridique'].map((item) => (
                <a key={item} href="#" className="block text-sm text-gray-400 hover:text-white transition-colors">
                  {item}
                </a>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-xs font-bold tracking-widest uppercase text-amber-300 mb-5">Contact</h4>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-amber-300 mt-0.5 shrink-0" strokeWidth={1.5} />
                <span className="text-sm text-gray-400">Lomé, Togo<br />Boulevard du 13 Janvier</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-amber-300 shrink-0" strokeWidth={1.5} />
                <span className="text-sm text-gray-400">+228 90 00 00 00</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-amber-300 shrink-0" strokeWidth={1.5} />
                <span className="text-sm text-gray-400">contact@immodesk.tg</span>
              </div>
            </div>
          </div>
        </div>

        {/* Newsletter */}
        <div className="border-t border-white/5 pt-8 pb-8 mb-8">
          <div className="max-w-md mx-auto text-center">
            <h4 className="font-serif text-lg mb-3">Restez informé</h4>
            <p className="text-xs text-gray-500 mb-4">Recevez nos dernières offres et actualités directement dans votre boîte mail.</p>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="votre@email.com"
                className="flex-1 px-4 py-2.5 bg-white/5 border border-white/10 rounded-full text-sm text-white placeholder:text-gray-500 focus:border-amber-300/50 focus:outline-none transition-colors"
              />
              <button className="px-6 py-2.5 bg-amber-300 text-zinc-900 text-xs font-bold tracking-widest uppercase rounded-full hover:bg-amber-200 transition-colors">
                OK
              </button>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-white/5 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-[10px] text-gray-600 uppercase tracking-widest">
            © 2026 IMMODESK. Tous droits réservés.
          </div>
          <div className="flex gap-6 text-[10px] text-gray-600 uppercase tracking-widest">
            <a href="#" className="hover:text-gray-400 transition-colors">Mentions légales</a>
            <a href="#" className="hover:text-gray-400 transition-colors">Politique de confidentialité</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
