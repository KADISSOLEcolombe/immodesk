"use client";

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { ArrowLeft, Loader2, PlusCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useNotifications } from '@/components/notifications/NotificationProvider';
import { PatrimoineService } from '@/lib/patrimoine-service';
import { Categorie, DonneesFormulaireSoumission, Immeuble } from '@/types/api';

const LocationPickerMap = dynamic(() => import('@/components/owner/LocationPickerMap'), {
  ssr: false,
  loading: () => <div className="h-72 w-full animate-pulse rounded-xl bg-zinc-100" />,
});

type PropertySubmissionForm = {
  adresse: string;
  categorie_id: string;
  immeuble_id: string;
  loyer_hc: string;
  charges: string;
  description: string;
  equipements: string;
  latitude: string;
  longitude: string;
  lien_maps: string;
  type_logement: string;
  categorie_logement: string;
  nb_pieces: string;
  surface_m2: string;
  standing: string;
  etage: string;
  amenagement: string;
  espaces_exterieurs: string;
  accessibilite: string;
};

const INITIAL_FORM: PropertySubmissionForm = {
  adresse: '',
  categorie_id: '',
  immeuble_id: '',
  loyer_hc: '',
  charges: '',
  description: '',
  equipements: '',
  latitude: '',
  longitude: '',
  lien_maps: '',
  type_logement: '',
  categorie_logement: '',
  nb_pieces: '',
  surface_m2: '',
  standing: '',
  etage: '',
  amenagement: '',
  espaces_exterieurs: '',
  accessibilite: '',
};

const splitCsv = (value: string): string[] =>
  value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

export default function OwnerPropertyCreatePage() {
  const router = useRouter();
  const { addNotification } = useNotifications();

  const [categories, setCategories] = useState<Categorie[]>([]);
  const [immeubles, setImmeubles] = useState<Immeuble[]>([]);
  const [isLoadingMeta, setIsLoadingMeta] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [formData, setFormData] = useState<PropertySubmissionForm>(INITIAL_FORM);
  const [formFeedback, setFormFeedback] = useState('');

  useEffect(() => {
    loadFormMeta();
  }, []);

  const loadFormMeta = async () => {
    try {
      setIsLoadingMeta(true);
      const [categoriesResponse, immeublesResponse] = await Promise.all([
        PatrimoineService.getCategories(),
        PatrimoineService.getImmeubles(),
      ]);

      if (categoriesResponse.success && categoriesResponse.data) {
        setCategories(categoriesResponse.data);
      }

      if (immeublesResponse.success && immeublesResponse.data) {
        setImmeubles(immeublesResponse.data);
      }
    } catch (err) {
      console.error('Erreur lors du chargement des métadonnées du formulaire:', err);
    } finally {
      setIsLoadingMeta(false);
    }
  };

  const handleInputChange = (field: keyof PropertySubmissionForm, value: string) => {
    setFormData((current) => ({ ...current, [field]: value }));
  };

  const handleMapPick = (coords: { latitude: number; longitude: number }) => {
    setFormData((current) => ({
      ...current,
      latitude: coords.latitude.toFixed(6),
      longitude: coords.longitude.toFixed(6),
    }));
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setFormFeedback('La geolocalisation navigateur n est pas disponible sur cet appareil.');
      return;
    }

    setIsLocating(true);
    setFormFeedback('');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData((current) => ({
          ...current,
          latitude: position.coords.latitude.toFixed(6),
          longitude: position.coords.longitude.toFixed(6),
        }));
        setIsLocating(false);
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          setFormFeedback('Permission geolocalisation refusee. Active-la dans ton navigateur.');
        } else if (error.code === error.TIMEOUT) {
          setFormFeedback('La geolocalisation a expire. Reessaie en etant a l exterieur.');
        } else {
          setFormFeedback('Impossible de recuperer ta position actuelle.');
        }
        setIsLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
    );
  };

  // Nouvelle fonction pour créer un bien directement
  const handleCreateDirect = async () => {
    setFormFeedback('');
    if (!formData.adresse.trim() || !formData.categorie_id || !formData.loyer_hc) {
      setFormFeedback('Adresse, catégorie et loyer hors charges sont obligatoires.');
      return;
    }
    const hasLatitude = Boolean(formData.latitude);
    const hasLongitude = Boolean(formData.longitude);
    if (hasLatitude !== hasLongitude) {
      setFormFeedback('Merci de renseigner les deux champs latitude et longitude.');
      return;
    }
    if (hasLatitude && hasLongitude) {
      const latitude = Number(formData.latitude);
      const longitude = Number(formData.longitude);
      if (Number.isNaN(latitude) || Number.isNaN(longitude) || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
        setFormFeedback('Coordonnees invalides. Latitude entre -90 et 90, longitude entre -180 et 180.');
        return;
      }
    }
    // Construction du payload pour createBien
    const payload: Partial<import('@/types/api').Bien> = {
      adresse: formData.adresse.trim(),
      categorie: formData.categorie_id,
      loyer_hc: Number(formData.loyer_hc),
      description: formData.description.trim() || undefined,
      charges: formData.charges ? Number(formData.charges) : undefined,
      immeuble: formData.immeuble_id || undefined,
      latitude: formData.latitude ? Number(formData.latitude) : undefined,
      longitude: formData.longitude ? Number(formData.longitude) : undefined,
      lien_maps: formData.lien_maps.trim() || undefined,
      type_logement: formData.type_logement || undefined,
      categorie_logement: formData.categorie_logement || undefined,
      nombre_pieces: formData.nb_pieces ? Number(formData.nb_pieces) : undefined,
      surface: formData.surface_m2 ? Number(formData.surface_m2) : undefined,
      standing: formData.standing || undefined,
      etage: formData.etage ? Number(formData.etage) : undefined,
      amenagement: formData.amenagement || undefined,
      // Les champs suivants sont optionnels ou à adapter selon le modèle backend
      // ...
    };
    try {
      setIsSubmitting(true);
      const response = await PatrimoineService.createBien(payload);
      if (!response.success) {
        setFormFeedback(response.message || 'La création directe a échoué.');
        return;
      }
      addNotification({
        type: 'info',
        titre: 'Bien créé',
        message: 'Votre bien a été créé directement et est disponible.',
      });
      router.push('/owner/properties');
    } catch (err) {
      console.error('Erreur lors de la création directe du bien:', err);
      setFormFeedback('Erreur technique lors de la création directe du bien.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler existant pour la soumission classique
  const handleAddProperty = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormFeedback('');
    if (!formData.adresse.trim() || !formData.categorie_id || !formData.loyer_hc) {
      setFormFeedback('Adresse, catégorie et loyer hors charges sont obligatoires.');
      return;
    }
    const hasLatitude = Boolean(formData.latitude);
    const hasLongitude = Boolean(formData.longitude);
    if (hasLatitude !== hasLongitude) {
      setFormFeedback('Merci de renseigner les deux champs latitude et longitude.');
      return;
    }
    if (hasLatitude && hasLongitude) {
      const latitude = Number(formData.latitude);
      const longitude = Number(formData.longitude);
      if (Number.isNaN(latitude) || Number.isNaN(longitude) || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
        setFormFeedback('Coordonnees invalides. Latitude entre -90 et 90, longitude entre -180 et 180.');
        return;
      }
    }
    const payload: DonneesFormulaireSoumission = {
      adresse: formData.adresse.trim(),
      categorie_id: formData.categorie_id,
      loyer_hc: Number(formData.loyer_hc),
      description: formData.description.trim() || undefined,
      charges: formData.charges ? Number(formData.charges) : undefined,
      immeuble_id: formData.immeuble_id || undefined,
      equipements: splitCsv(formData.equipements),
      latitude: formData.latitude ? Number(formData.latitude) : undefined,
      longitude: formData.longitude ? Number(formData.longitude) : undefined,
      lien_maps: formData.lien_maps.trim() || undefined,
      type_logement: formData.type_logement || undefined,
      categorie_logement: formData.categorie_logement || undefined,
      nb_pieces: formData.nb_pieces ? Number(formData.nb_pieces) : undefined,
      surface_m2: formData.surface_m2 ? Number(formData.surface_m2) : undefined,
      standing: formData.standing || undefined,
      etage: formData.etage || undefined,
      amenagement: formData.amenagement || undefined,
      espaces_exterieurs: splitCsv(formData.espaces_exterieurs),
      accessibilite: splitCsv(formData.accessibilite),
    };
    try {
      setIsSubmitting(true);
      const response = await PatrimoineService.createSoumission({ donnees_formulaire: payload });
      if (!response.success) {
        setFormFeedback(response.message || 'La soumission a échoué.');
        return;
      }
      addNotification({
        type: 'info',
        titre: 'Soumission envoyée',
        message: 'Votre bien a été soumis à l’administration pour validation.',
      });
      router.push('/owner/properties');
    } catch (err) {
      console.error('Erreur lors de la soumission du bien:', err);
      setFormFeedback('Erreur technique lors de la soumission du bien.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="mb-6 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-zinc-900">
          <PlusCircle className="h-5 w-5" aria-hidden="true" />
          <h1 className="text-xl font-bold">Ajouter un bien</h1>
        </div>
        <Link
          href="/owner/properties"
          className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          Retour aux biens
        </Link>
      </div>

      <section className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm sm:p-6">
        {isLoadingMeta ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
            <p className="mt-4 text-sm text-zinc-500">Chargement des champs...</p>
          </div>
        ) : (
          <form onSubmit={handleAddProperty} className="space-y-3">
            <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700">
              Adresse *
              <input type="text" value={formData.adresse} onChange={(e) => handleInputChange('adresse', e.target.value)} placeholder="Ex: Adidogomé, Lomé" className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none transition focus:border-zinc-400" required />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700">
              Catégorie *
              <select value={formData.categorie_id} onChange={(e) => handleInputChange('categorie_id', e.target.value)} className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none transition focus:border-zinc-400" required>
                <option value="">Sélectionnez une catégorie</option>
                {categories.map((categorie) => (
                  <option key={categorie.id} value={categorie.id}>
                    {categorie.nom}{categorie.type_detail ? ` - ${categorie.type_detail}` : ''}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700">
              Immeuble (optionnel)
              <select value={formData.immeuble_id} onChange={(e) => handleInputChange('immeuble_id', e.target.value)} className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none transition focus:border-zinc-400">
                <option value="">Aucun immeuble</option>
                {immeubles.map((immeuble) => (
                  <option key={immeuble.id} value={immeuble.id}>
                    {immeuble.nom}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700">
              Loyer hors charges (FCFA) *
              <input type="number" min={0} value={formData.loyer_hc} onChange={(e) => handleInputChange('loyer_hc', e.target.value)} placeholder="120000" className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none transition focus:border-zinc-400" required />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700">
              Charges (FCFA)
              <input type="number" min={0} value={formData.charges} onChange={(e) => handleInputChange('charges', e.target.value)} placeholder="15000" className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none transition focus:border-zinc-400" />
            </label>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700">
                Type de logement
                <select value={formData.type_logement} onChange={(e) => handleInputChange('type_logement', e.target.value)} className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none transition focus:border-zinc-400">
                  <option value="">Non précisé</option>
                  <option value="studio">Studio</option>
                  <option value="t1">T1</option>
                  <option value="t2">T2</option>
                  <option value="t3">T3</option>
                  <option value="t4_plus">T4+</option>
                  <option value="duplex">Duplex</option>
                  <option value="loft">Loft</option>
                  <option value="villa">Villa</option>
                  <option value="maison">Maison</option>
                  <option value="autre">Autre</option>
                </select>
              </label>
              <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700">
                Catégorie logement
                <select value={formData.categorie_logement} onChange={(e) => handleInputChange('categorie_logement', e.target.value)} className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none transition focus:border-zinc-400">
                  <option value="">Non précisé</option>
                  <option value="etudiant">Étudiant</option>
                  <option value="familial">Familial</option>
                  <option value="luxe">Luxe</option>
                  <option value="micro">Micro</option>
                  <option value="colocation">Colocation</option>
                  <option value="professionnel">Professionnel</option>
                  <option value="autre">Autre</option>
                </select>
              </label>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700">
                Nombre de pièces
                <input type="number" min={0} value={formData.nb_pieces} onChange={(e) => handleInputChange('nb_pieces', e.target.value)} placeholder="3" className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none transition focus:border-zinc-400" />
              </label>
              <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700">
                Surface (m²)
                <input type="number" min={0} step="0.01" value={formData.surface_m2} onChange={(e) => handleInputChange('surface_m2', e.target.value)} placeholder="85" className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none transition focus:border-zinc-400" />
              </label>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700">
                Standing
                <select value={formData.standing} onChange={(e) => handleInputChange('standing', e.target.value)} className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none transition focus:border-zinc-400">
                  <option value="">Non précisé</option>
                  <option value="standard">Standard</option>
                  <option value="confort">Confort</option>
                  <option value="haut_gamme">Haut de gamme</option>
                  <option value="prestige">Prestige</option>
                </select>
              </label>
              <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700">
                Aménagement
                <select value={formData.amenagement} onChange={(e) => handleInputChange('amenagement', e.target.value)} className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none transition focus:border-zinc-400">
                  <option value="">Non précisé</option>
                  <option value="meuble">Meublé</option>
                  <option value="non_meuble">Non meublé</option>
                </select>
              </label>
            </div>

            <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700">
              Étage
              <input type="text" value={formData.etage} onChange={(e) => handleInputChange('etage', e.target.value)} placeholder="Ex: RDC, 2e" className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none transition focus:border-zinc-400" />
            </label>

            <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700">
              Équipements (séparés par des virgules)
              <input type="text" value={formData.equipements} onChange={(e) => handleInputChange('equipements', e.target.value)} placeholder="Climatisation, Internet, Cuisine équipée" className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none transition focus:border-zinc-400" />
            </label>

            <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700">
              Espaces extérieurs (virgules)
              <input type="text" value={formData.espaces_exterieurs} onChange={(e) => handleInputChange('espaces_exterieurs', e.target.value)} placeholder="Balcon, Terrasse" className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none transition focus:border-zinc-400" />
            </label>

            <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700">
              Accessibilité (virgules)
              <input type="text" value={formData.accessibilite} onChange={(e) => handleInputChange('accessibilite', e.target.value)} placeholder="Ascenseur, Parking, PMR" className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none transition focus:border-zinc-400" />
            </label>

            <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700">
              Description
              <textarea value={formData.description} onChange={(e) => handleInputChange('description', e.target.value)} placeholder="Décrivez le bien et ses points forts" className="min-h-20 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-zinc-400" />
            </label>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700">
                Latitude
                <input type="number" step="0.000001" value={formData.latitude} onChange={(e) => handleInputChange('latitude', e.target.value)} placeholder="6.1725" className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none transition focus:border-zinc-400" />
              </label>
              <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700">
                Longitude
                <input type="number" step="0.000001" value={formData.longitude} onChange={(e) => handleInputChange('longitude', e.target.value)} placeholder="1.2314" className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none transition focus:border-zinc-400" />
              </label>
            </div>

            <section className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 sm:p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-semibold text-zinc-900">Localisation du bien</h3>
                  <p className="text-xs text-zinc-600">Clique sur la carte pour remplir automatiquement latitude et longitude.</p>
                </div>
                <button
                  type="button"
                  onClick={handleUseCurrentLocation}
                  disabled={isLocating}
                  className="inline-flex h-9 items-center rounded-lg border border-zinc-300 bg-white px-3 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isLocating ? 'Localisation...' : 'Utiliser ma position actuelle'}
                </button>
              </div>

              <LocationPickerMap
                value={
                  formData.latitude && formData.longitude
                    ? { latitude: Number(formData.latitude), longitude: Number(formData.longitude) }
                    : null
                }
                onChange={handleMapPick}
              />
            </section>

            <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700">
              Lien Google Maps
              <input type="url" value={formData.lien_maps} onChange={(e) => handleInputChange('lien_maps', e.target.value)} placeholder="https://maps.google.com/..." className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none transition focus:border-zinc-400" />
            </label>

            <div className="flex flex-col gap-2 sm:flex-row sm:gap-4">
              <button type="submit" disabled={isSubmitting} className="inline-flex h-10 flex-1 items-center justify-center rounded-xl bg-zinc-900 px-4 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60">
                {isSubmitting ? 'Envoi en cours...' : 'Soumettre à l\'admin'}
              </button>
              <button type="button" onClick={handleCreateDirect} disabled={isSubmitting} className="inline-flex h-10 flex-1 items-center justify-center rounded-xl bg-emerald-700 px-4 text-sm font-medium text-white transition-colors hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60">
                {isSubmitting ? 'Création...' : 'Créer sans soumission'}
              </button>
            </div>
            {formFeedback && (
              <p className={`text-sm font-medium ${formFeedback.includes('succès') ? 'text-green-700' : 'text-red-700'}`}>
                {formFeedback}
              </p>
            )}
          </form>
        )}
      </section>
    </>
  );
}
