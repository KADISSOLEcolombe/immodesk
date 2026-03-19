 "use client";
 
 import Image from 'next/image';
 import { MessageCircle, Phone, ShieldCheck, UserRound, X } from 'lucide-react';
 
 interface ContactOwnerModalProps {
   isOpen: boolean;
   onClose: () => void;
   ownerName: string;
   ownerPhone: string;
   propertyTitle: string;
 }
 
 function normalizePhoneForWhatsApp(phone: string) {
   const digits = phone.replace(/\D/g, '');
   if (!digits) return '';
 
   // If local TG number like 8 digits, prefix with country code 228.
   if (digits.length === 8) return `228${digits}`;
 
   // If already includes country code, keep as-is.
   return digits;
 }
 
 export default function ContactOwnerModal({
   isOpen,
   onClose,
   ownerName,
   ownerPhone,
   propertyTitle,
 }: ContactOwnerModalProps) {
   if (!isOpen) return null;
 
   const waPhone = normalizePhoneForWhatsApp(ownerPhone);
   const waText = encodeURIComponent(
     `Bonjour ${ownerName}, je suis intéressé(e) par le bien "${propertyTitle}". Est-ce toujours disponible ?`,
   );
   const waHref = waPhone ? `https://wa.me/${waPhone}?text=${waText}` : '';
 
   return (
     <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-md animate-in fade-in duration-300">
       <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
         <button
           onClick={onClose}
           className="absolute top-4 right-4 z-20 p-2 rounded-full bg-black/10 md:bg-white/10 hover:bg-black/20 md:hover:bg-white/20 backdrop-blur-sm text-zinc-900 md:text-white transition-all hover:scale-110"
           aria-label="Fermer"
         >
           <X className="w-5 h-5" />
         </button>
 
         <div className="relative w-full md:w-5/12 h-48 md:h-auto bg-zinc-900">
           <Image
             src="https://images.unsplash.com/photo-1557682260-96773eb01377?q=80&w=1400&auto=format&fit=crop"
             alt="Contact propriétaire"
             fill
             className="object-cover opacity-85"
           />
           <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent md:bg-gradient-to-r" />
 
           <div className="absolute bottom-6 left-6 right-6 text-white">
             <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center mb-4 shadow-inner border border-white/10">
               <ShieldCheck className="w-5 h-5 text-white" />
             </div>
             <h3 className="text-xl font-serif font-bold tracking-wide mb-2">Contact direct</h3>
             <p className="text-sm text-zinc-200 leading-relaxed font-light">
               Pour louer, contactez le propriétaire via WhatsApp. Réponse plus rapide et échanges centralisés.
             </p>
           </div>
         </div>
 
         <div className="w-full md:w-7/12 p-8 md:p-12 flex flex-col justify-center bg-white">
           <div className="mb-6">
             <h2 className="text-2xl font-bold text-zinc-900">Contacter le propriétaire</h2>
             <p className="mt-2 text-zinc-500 text-sm">
               Vous pouvez appeler ou envoyer un message WhatsApp pour demander une visite et finaliser la location.
             </p>
           </div>
 
           <div className="rounded-2xl border border-zinc-100 bg-zinc-50 p-5">
             <div className="flex items-start gap-3">
               <div className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white ring-1 ring-zinc-200 text-zinc-900">
                 <UserRound className="h-5 w-5" aria-hidden="true" />
               </div>
               <div className="min-w-0">
                 <div className="font-bold text-zinc-900 truncate">{ownerName}</div>
                 <div className="mt-1 inline-flex items-center gap-2 text-sm font-semibold text-zinc-700">
                   <Phone className="h-4 w-4 text-zinc-500" aria-hidden="true" />
                   {ownerPhone}
                 </div>
               </div>
             </div>
           </div>
 
           <div className="mt-5 space-y-3">
             {waHref ? (
               <a
                 href={waHref}
                 target="_blank"
                 rel="noreferrer"
                 className="group flex items-center justify-center gap-3 w-full py-4 px-6 bg-zinc-900 hover:bg-zinc-800 text-white font-semibold rounded-xl transition-all shadow-lg shadow-zinc-900/20 hover:shadow-xl hover:-translate-y-0.5"
               >
                 <MessageCircle className="w-5 h-5" aria-hidden="true" />
                 Contacter sur WhatsApp
               </a>
             ) : (
               <div className="w-full rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
                 Numéro WhatsApp indisponible pour ce bien.
               </div>
             )}
 
             <button
               type="button"
               onClick={onClose}
               className="w-full py-3.5 px-6 border-2 border-zinc-100 hover:border-zinc-900 bg-white text-zinc-900 font-semibold rounded-xl transition-all hover:bg-zinc-50"
             >
               Fermer
             </button>
           </div>
         </div>
       </div>
     </div>
   );
 }
