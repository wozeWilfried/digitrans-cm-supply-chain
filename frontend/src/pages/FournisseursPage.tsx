import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { fournisseurApi } from '@/api/client';
import type { Fournisseur, StatutFournisseur } from '@/types';
import {
  Users, Plus, Search, Star, Phone, Mail,
  MapPin, Edit2, X, ChevronDown, Loader2, CheckCircle,
} from 'lucide-react';

// ─── Demo data ─────────────────────────────────────────────────────
const DEMO_FOURNISSEURS: Fournisseur[] = [
  { id:1, raisonSociale:'Plantation Bamiléké SA', email:'contact@plantation-bamileke.cm', telephone:'+237 699 001 002', adresse:'Zone Rurale Bafoussam', ville:'Bafoussam', numeroContribuable:'CM2009000123', statut:'ACTIF', scoreFiabilite:4.7, createdAt:'2020-03-15' },
  { id:2, raisonSociale:'SODECAO Export', email:'export@sodecao.cm', telephone:'+237 676 445 231', adresse:'Boulevard de la Liberté', ville:'Douala', numeroContribuable:'CM2011000456', statut:'ACTIF', scoreFiabilite:4.2, createdAt:'2019-07-22' },
  { id:3, raisonSociale:'Coopérative Café du Noun', email:'info@cafe-noun.cm', telephone:'+237 655 789 012', adresse:'Route Nationale n°4', ville:'Foumban', numeroContribuable:'CM2015000789', statut:'EN_EVALUATION', scoreFiabilite:3.5, createdAt:'2023-01-10' },
  { id:4, raisonSociale:'Palm Industries SARL', email:'direction@palm-ind.cm', telephone:'+237 690 123 456', adresse:'Zone Industrielle Bassa', ville:'Douala', numeroContribuable:'CM2008001234', statut:'SUSPENDU', scoreFiabilite:2.8, createdAt:'2018-11-05' },
  { id:5, raisonSociale:'Agro-Hévéa du Littoral', email:'gestion@agroheveea.cm', telephone:'+237 677 654 321', adresse:'Route de Mungo', ville:'Nkongsamba', numeroContribuable:'CM2017002345', statut:'ACTIF', scoreFiabilite:4.0, createdAt:'2021-04-18' },
];

const fournisseurSchema = z.object({
  raisonSociale: z.string().min(2, 'Raison sociale requise'),
  email: z.string().email('Email invalide'),
  telephone: z.string().optional(),
  adresse: z.string().optional(),
  ville: z.string().optional(),
  numeroContribuable: z.string().optional(),
  statut: z.enum(['ACTIF','INACTIF','SUSPENDU','EN_EVALUATION']),
});
type FournisseurForm = z.infer<typeof fournisseurSchema>;

const statutColors: Record<StatutFournisseur, string> = {
  ACTIF: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  INACTIF: 'text-slate-600 bg-slate-50 border-slate-200',
  SUSPENDU: 'text-red-700 bg-red-50 border-red-200',
  EN_EVALUATION: 'text-amber-700 bg-amber-50 border-amber-200',
};
const statutLabels: Record<StatutFournisseur, string> = {
  ACTIF: 'Actif', INACTIF: 'Inactif', SUSPENDU: 'Suspendu', EN_EVALUATION: 'Évaluation',
};

function ScoreStars({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1,2,3,4,5].map(i => (
        <Star key={i} size={13}
          className={i <= Math.round(score) ? 'fill-amber-400 text-amber-400' : 'text-slate-200 fill-slate-200'} />
      ))}
      <span className="text-xs text-slate-500 ml-1">{score.toFixed(1)}</span>
    </div>
  );
}

function FournisseurModal({
  fournisseur, onClose,
}: { fournisseur?: Fournisseur; onClose: () => void }) {
  const qc = useQueryClient();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FournisseurForm>({
    resolver: zodResolver(fournisseurSchema),
    defaultValues: fournisseur ? {
      raisonSociale: fournisseur.raisonSociale,
      email: fournisseur.email,
      telephone: fournisseur.telephone,
      adresse: fournisseur.adresse,
      ville: fournisseur.ville,
      numeroContribuable: fournisseur.numeroContribuable,
      statut: fournisseur.statut,
    } : { statut: 'ACTIF' },
  });

  const createMutation = useMutation({
    mutationFn: (data: FournisseurForm) => fournisseurApi.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['fournisseurs'] }); onClose(); },
  });
  const updateMutation = useMutation({
    mutationFn: (data: FournisseurForm) => fournisseurApi.update(fournisseur!.id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['fournisseurs'] }); onClose(); },
  });

  const onSubmit = async (data: FournisseurForm) => {
    try {
      if (fournisseur) await updateMutation.mutateAsync(data);
      else await createMutation.mutateAsync(data);
    } catch {
      // demo mode fallback — pas de backend
      qc.invalidateQueries({ queryKey: ['fournisseurs'] });
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800">
            {fournisseur ? 'Modifier le fournisseur' : 'Nouveau fournisseur'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-600 mb-1">Raison sociale *</label>
              <input {...register('raisonSociale')}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
              {errors.raisonSociale && <p className="text-xs text-red-500 mt-1">{errors.raisonSociale.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Email *</label>
              <input {...register('email')} type="email"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
              {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Téléphone</label>
              <input {...register('telephone')}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Ville</label>
              <input {...register('ville')}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">N° Contribuable</label>
              <input {...register('numeroContribuable')}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-600 mb-1">Adresse</label>
              <input {...register('adresse')}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Statut</label>
              <div className="relative">
                <select {...register('statut')}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none
                             focus:border-blue-400 focus:ring-2 focus:ring-blue-100 appearance-none pr-8">
                  <option value="ACTIF">Actif</option>
                  <option value="EN_EVALUATION">En évaluation</option>
                  <option value="INACTIF">Inactif</option>
                  <option value="SUSPENDU">Suspendu</option>
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">
              Annuler
            </button>
            <button type="submit" disabled={isSubmitting}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-700 text-white
                         rounded-lg hover:bg-blue-800 disabled:opacity-60">
              {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
              {fournisseur ? 'Enregistrer' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function FournisseursPage() {
  const [search, setSearch] = useState('');
  const [statutFilter, setStatutFilter] = useState<string>('');
  const [modal, setModal] = useState<{ open: boolean; fournisseur?: Fournisseur }>({ open: false });

  const { data } = useQuery({
    queryKey: ['fournisseurs', statutFilter],
    queryFn: () => fournisseurApi.getAll(statutFilter || undefined).then(r => r.data),
    retry: false,
  });
  const fournisseurs: Fournisseur[] = (data as Fournisseur[] | undefined) ?? DEMO_FOURNISSEURS;

  const filtered = fournisseurs.filter(f =>
    !search ||
    f.raisonSociale.toLowerCase().includes(search.toLowerCase()) ||
    f.ville?.toLowerCase().includes(search.toLowerCase()) ||
    f.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {modal.open && (
        <FournisseurModal
          fournisseur={modal.fournisseur}
          onClose={() => setModal({ open: false })}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Fournisseurs</h1>
          <p className="text-sm text-slate-400 mt-0.5">Plantations, partenaires et prestataires</p>
        </div>
        <button
          onClick={() => setModal({ open: true })}
          className="flex items-center gap-2 text-sm bg-blue-700 text-white
                     px-4 py-2.5 rounded-lg hover:bg-blue-800 transition-colors font-medium">
          <Plus size={16} /> Nouveau fournisseur
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {(['ACTIF','EN_EVALUATION','SUSPENDU','INACTIF'] as StatutFournisseur[]).map(s => (
          <button key={s}
            onClick={() => setStatutFilter(statutFilter === s ? '' : s)}
            className={`p-4 rounded-xl border text-left transition-all
              ${statutFilter === s ? 'ring-2 ring-blue-400 border-blue-200' : 'border-slate-100 hover:border-slate-200'}
              bg-white shadow-sm`}>
            <p className="text-2xl font-bold text-slate-800">
              {fournisseurs.filter(f => f.statut === s).length}
            </p>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full border mt-1 inline-block ${statutColors[s]}`}>
              {statutLabels[s]}
            </span>
          </button>
        ))}
      </div>

      {/* Barre de recherche */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher par raison sociale, ville, email…"
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm
                       outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
        </div>
      </div>

      {/* Cards fournisseurs */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(f => (
          <div key={f.id}
            className="bg-white rounded-xl border border-slate-100 shadow-sm p-5
                       hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-slate-800 truncate">{f.raisonSociale}</h3>
                <ScoreStars score={f.scoreFiabilite} />
              </div>
              <div className="flex items-center gap-2 ml-2">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${statutColors[f.statut]}`}>
                  {statutLabels[f.statut]}
                </span>
                <button onClick={() => setModal({ open: true, fournisseur: f })}
                  className="text-slate-400 hover:text-blue-600 transition-colors">
                  <Edit2 size={15} />
                </button>
              </div>
            </div>
            <div className="space-y-1.5 text-sm">
              <div className="flex items-center gap-2 text-slate-500">
                <Mail size={13} className="text-slate-400 flex-shrink-0" />
                <span className="truncate">{f.email}</span>
              </div>
              {f.telephone && (
                <div className="flex items-center gap-2 text-slate-500">
                  <Phone size={13} className="text-slate-400 flex-shrink-0" />
                  <span>{f.telephone}</span>
                </div>
              )}
              {f.ville && (
                <div className="flex items-center gap-2 text-slate-500">
                  <MapPin size={13} className="text-slate-400 flex-shrink-0" />
                  <span>{f.ville}</span>
                </div>
              )}
            </div>
            {f.numeroContribuable && (
              <div className="mt-3 pt-3 border-t border-slate-50">
                <p className="text-xs text-slate-400 font-mono">
                  N° {f.numeroContribuable}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-slate-400">
          <Users size={36} className="mx-auto mb-3 opacity-30" />
          <p>Aucun fournisseur trouvé</p>
        </div>
      )}
    </div>
  );
}
