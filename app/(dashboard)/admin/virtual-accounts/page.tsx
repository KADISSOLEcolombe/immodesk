"use client";

import { useEffect, useState, FormEvent } from 'react';
import { Key, Loader2, Trash2, PlusCircle, Edit2, X } from 'lucide-react';
import { VirtualVisitService, CompteEphemere } from '@/lib/virtual-visit-service';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function VirtualAccountsPage() {
  const [accounts, setAccounts] = useState<CompteEphemere[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<CompteEphemere | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    date_expiration: '',
    est_actif: true
  });

  const loadAccounts = async () => {
    try {
      setIsLoading(true);
      const res = await VirtualVisitService.getComptesEphemeres();
      if (res.success && res.data) {
        setAccounts(res.data);
      } else {
        setError(res.message || 'Erreur lors du chargement des comptes éphémères.');
      }
    } catch (err) {
      console.error(err);
      setError('Erreur serveur.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAccounts();
  }, []);

  const openEditModal = (account: CompteEphemere) => {
    setEditingAccount(account);
    setFormData({
      date_expiration: account.date_expiration ? account.date_expiration.substring(0, 16) : '',
      est_actif: account.est_actif
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingAccount(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingAccount) return;

    try {
      setIsSubmitting(true);
      const res = await VirtualVisitService.updateCompteEphemere(editingAccount.id, formData);
      if (res.success && res.data) {
        setAccounts(accounts.map(a => a.id === editingAccount.id ? res.data! : a));
        closeModal();
      } else {
        alert(res.message || 'Erreur lors de la mise à jour.');
      }
    } catch (err) {
      console.error(err);
      alert('Erreur serveur.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Voulez-vous vraiment supprimer ce compte éphémère ?')) return;
    try {
      const res = await VirtualVisitService.deleteCompteEphemere(id);
      if (res.success || res.code === 'RESOURCE_DELETED' || (!('success' in res))) {
        setAccounts(accounts.filter(a => a.id !== id));
      } else {
        alert(res.message || 'Erreur lors de la suppression.');
      }
    } catch (err) {
      console.error(err);
      alert('Erreur serveur.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-zinc-900">
          <Key className="h-6 w-6" />
          <h1 className="text-xl font-bold">Comptes Éphémères</h1>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div>
      ) : isLoading ? (
        <div className="flex h-32 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
        </div>
      ) : accounts.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-500">
          Aucun compte éphémère n'a été créé.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-50 text-xs font-semibold uppercase text-zinc-500">
                <tr>
                  <th className="px-4 py-3">Identifiant</th>
                  <th className="px-4 py-3">Mot de passe</th>
                  <th className="px-4 py-3">Visite</th>
                  <th className="px-4 py-3">Expiration</th>
                  <th className="px-4 py-3">Statut</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {accounts.map(account => (
                  <tr key={account.id} className="hover:bg-zinc-50">
                    <td className="px-4 py-3 font-medium text-zinc-900">{account.identifiant}</td>
                    <td className="px-4 py-3 font-mono text-zinc-600">{account.mot_de_passe_clair || '***'}</td>
                    <td className="px-4 py-3 text-zinc-600 truncate max-w-[150px]">{account.visite}</td>
                    <td className="px-4 py-3 text-zinc-600 line-clamp-1">
                      {account.date_expiration ? format(new Date(account.date_expiration), 'PPP à HH:mm', { locale: fr }) : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        account.est_actif 
                          ? 'bg-emerald-100 text-emerald-700' 
                          : 'bg-rose-100 text-rose-700'
                      }`}>
                        {account.est_actif ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(account)}
                          className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(account.id)}
                          className="rounded-lg p-1.5 text-zinc-400 hover:bg-rose-50 hover:text-rose-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {isModalOpen && editingAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={closeModal} />
          
          <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4">
              <h3 className="text-lg font-semibold text-zinc-900">
                Modifier le compte
              </h3>
              <button onClick={closeModal} className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700">Identifiant</label>
                  <input
                    type="text"
                    value={editingAccount.identifiant}
                    disabled
                    className="mt-1 block w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2 text-sm text-zinc-500"
                  />
                </div>

                <div>
                  <label htmlFor="date_expiration" className="block text-sm font-medium text-zinc-700">Date d'expiration</label>
                  <input
                    type="datetime-local"
                    id="date_expiration"
                    value={formData.date_expiration}
                    onChange={(e) => setFormData({ ...formData, date_expiration: e.target.value })}
                    className="mt-1 block w-full rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm text-zinc-900 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="est_actif"
                    checked={formData.est_actif}
                    onChange={(e) => setFormData({ ...formData, est_actif: e.target.checked })}
                    className="h-4 w-4 rounded border-zinc-300 text-black focus:ring-black"
                  />
                  <label htmlFor="est_actif" className="text-sm font-medium text-zinc-700">
                    Compte actif
                  </label>
                </div>
              </div>

              <div className="mt-8 flex gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full rounded-xl bg-black px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
