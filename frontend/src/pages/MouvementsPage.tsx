import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { mouvementApi } from '@/api/client';
import type { MouvementStock, TypeMouvement } from '@/types';
import {
  ArrowLeftRight, TrendingUp, TrendingDown,
  RefreshCw, ArrowRightLeft, Sliders,
  Search, Plus, X, Loader2, ChevronDown, Filter,
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

// ─── Demo data ─────────────────────────────────────────────────────
const DEMO_MOUVEMENTS: MouvementStock[] = [
  { id:1, produit: { id:1, reference:'CAC-001', nom:'Cacao brut', prixUnitaire:2500, unite:'kg', actif:true, createdAt:'' }, entrepotDestination: { id:3, nom:'Entrepôt Central Douala', adresse:'Port Douala', type:'ENTREPOT_CENTRAL' }, type:'ENTREE', quantite:500, dateMouvement:'2026-05-20T08:30:00', motif:'Réception livraison LIV-2026-003', operateur:'KAMGA Bernard' },
  { id:2, produit: { id:4, reference:'HVP-001', nom:'Huile de palme brute', prixUnitaire:1200, unite:'L', actif:true, createdAt:'' }, entrepotSource: { id:3, nom:'Entrepôt Central Douala', adresse:'Port Douala', type:'ENTREPOT_CENTRAL' }, type:'SORTIE', quantite:200, dateMouvement:'2026-05-20T10:15:00', motif:'Expédition commande client Yaoundé', operateur:'DONGMO Wilfried' },
  { id:3, produit: { id:5, reference:'RBB-001', nom:'Caoutchouc naturel', prixUnitaire:1800, unite:'kg', actif:true, createdAt:'' }, entrepotSource: { id:1, nom:'Plantation Nord', adresse:'Bafoussam', type:'PLANTATION' }, entrepotDestination: { id:3, nom:'Entrepôt Central Douala', adresse:'Port Douala', type:'ENTREPOT_CENTRAL' }, type:'TRANSFERT', quantite:1200, dateMouvement:'2026-05-19T14:00:00', motif:'Transfert vers entrepôt principal pour export', operateur:'KENNETH Mboule' },
  { id:4, produit: { id:3, reference:'CAF-001', nom:'Café Arabica', prixUnitaire:5800, unite:'kg', actif:true, createdAt:'' }, entrepotDestination: { id:1, nom:'Plantation Nord', adresse:'Bafoussam', type:'PLANTATION' }, type:'AJUSTEMENT_POSITIF', quantite:45, dateMouvement:'2026-05-19T09:00:00', motif:'Inventaire physique — écart positif constaté', operateur:'KAMGA Bernard' },
  { id:5, produit: { id:6, reference:'BAN-001', nom:'Bananes Cavendish', prixUnitaire:350, unite:'kg', actif:true, createdAt:'' }, entrepotSource: { id:4, nom:'Point de vente Yaoundé', adresse:'Yaoundé centre', type:'POINT_VENTE' }, type:'AJUSTEMENT_NEGATIF', quantite:15, dateMouvement:'2026-05-18T16:30:00', motif:'Pertes qualité — bananes non conformes export', operateur:'DONGMO Wilfried' },
  { id:6, produit: { id:2, reference:'CAC-002', nom:'Cacao transformé', prixUnitaire:4200, unite:'kg', actif:true, createdAt:'' }, entrepotDestination: { id:2, nom:'Usine de transformation', adresse:'Douala', type:'TRANSFORMATION' }, type:'ENTREE', quantite:180, dateMouvement:'2026-05-17T11:45:00', motif:'Production usine Douala — lot 2026-05-17', operateur:'KENNETH Mboule' },
];

const typeConfig: Record<TypeMouvement, { label: string; color: string; bg: string; icon: React.ElementType; sign: string }> = {
  ENTREE:             { label: 'Entrée',            color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', icon: TrendingUp,     sign: '+' },
  SORTIE:             { label: 'Sortie',             color: 'text-red-700',     bg: 'bg-red-50 border-red-200',         icon: TrendingDown,   sign: '−' },
  TRANSFERT:          { label: 'Transfert',          color: 'text-blue-700',    bg: 'bg-blue-50 border-blue-200',       icon: ArrowRightLeft, sign: '↔' },
  AJUSTEMENT_POSITIF: { label: 'Ajust. positif',    color: 'text-teal-700',    bg: 'bg-teal-50 border-teal-200',       icon: RefreshCw,      sign: '+' },
  AJUSTEMENT_NEGATIF: { label: 'Ajust. négatif',    color: 'text-orange-700',  bg: 'bg-orange-50 border-orange-200',   icon: Sliders,        sign: '−' },
};

const mouvementSchema = z.object({
  type: z.enum(['ENTREE','SORTIE','TRANSFERT','AJUSTEMENT_POSITIF','AJUSTEMENT_NEGATIF']),
  produitId: z.string().min(1, 'Produit requis'),
  quantite: z.coerce.number().min(1, 'Quantité > 0'),
  entrepotSourceId: z.string().optional(),
  entrepotDestinationId: z.string().optional(),
  motif: z.string().min(3, 'Motif requis'),
});
type MouvementForm = z.infer<typeof mouvementSchema>;

const PRODUITS = [
  { id: 1, label: 'Cacao brut (CAC-001)' },
  { id: 2, label: 'Cacao transformé (CAC-002)' },
  { id: 3, label: 'Café Arabica (CAF-001)' },
  { id: 4, label: "Huile de palme brute (HVP-001)" },
  { id: 5, label: 'Caoutchouc naturel (RBB-001)' },
  { id: 6, label: 'Bananes Cavendish (BAN-001)' },
];
const ENTREPOTS = [
  { id: 1, label: 'Plantation Nord (Bafoussam)' },
  { id: 2, label: 'Usine de transformation (Douala)' },
  { id: 3, label: 'Entrepôt Central Douala' },
  { id: 4, label: 'Point de vente Yaoundé' },
];

function NouveauMouvementModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<MouvementForm>({
    resolver: zodResolver(mouvementSchema),
    defaultValues: { type: 'ENTREE' },
  });
  const type = watch('type');
  const needsSource = ['SORTIE','TRANSFERT','AJUSTEMENT_NEGATIF'].includes(type);
  const needsDest = ['ENTREE','TRANSFERT','AJUSTEMENT_POSITIF'].includes(type);

  const create = useMutation({
    mutationFn: (data: MouvementForm) => mouvementApi.enregistrer(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['mouvements'] }); onClose(); },
  });

  const onSubmit = async (data: MouvementForm) => {
    try { await create.mutateAsync(data); }
    catch { qc.invalidateQueries({ queryKey: ['mouvements'] }); onClose(); }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800">Enregistrer un mouvement</h2>
          <button onClick={onClose}><X size={20} className="text-slate-400" /></button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Type de mouvement *</label>
            <div className="relative">
              <select {...register('type')}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none
                           focus:border-blue-400 focus:ring-2 focus:ring-blue-100 appearance-none pr-8">
                {(Object.entries(typeConfig) as [TypeMouvement, typeof typeConfig[TypeMouvement]][]).map(([k,v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Produit *</label>
            <div className="relative">
              <select {...register('produitId')}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none
                           focus:border-blue-400 focus:ring-2 focus:ring-blue-100 appearance-none pr-8">
                <option value="">Sélectionner…</option>
                {PRODUITS.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
            {errors.produitId && <p className="text-xs text-red-500 mt-1">{errors.produitId.message}</p>}
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Quantité *</label>
            <input {...register('quantite')} type="number" min="1"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none
                         focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
            {errors.quantite && <p className="text-xs text-red-500 mt-1">{errors.quantite.message}</p>}
          </div>
          {needsSource && (
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Entrepôt source</label>
              <div className="relative">
                <select {...register('entrepotSourceId')}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none
                             focus:border-blue-400 focus:ring-2 focus:ring-blue-100 appearance-none pr-8">
                  <option value="">Sélectionner…</option>
                  {ENTREPOTS.map(e => <option key={e.id} value={e.id}>{e.label}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>
          )}
          {needsDest && (
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Entrepôt destination</label>
              <div className="relative">
                <select {...register('entrepotDestinationId')}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none
                             focus:border-blue-400 focus:ring-2 focus:ring-blue-100 appearance-none pr-8">
                  <option value="">Sélectionner…</option>
                  {ENTREPOTS.map(e => <option key={e.id} value={e.id}>{e.label}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Motif *</label>
            <textarea {...register('motif')} rows={3}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none
                         focus:border-blue-400 focus:ring-2 focus:ring-blue-100 resize-none"
              placeholder="Raison du mouvement, référence commande, etc." />
            {errors.motif && <p className="text-xs text-red-500 mt-1">{errors.motif.message}</p>}
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">
              Annuler
            </button>
            <button type="submit" disabled={isSubmitting}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-700 text-white
                         rounded-lg hover:bg-blue-800 disabled:opacity-60">
              {isSubmitting && <Loader2 size={14} className="animate-spin" />}
              Enregistrer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function MouvementsPage() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [modalOpen, setModalOpen] = useState(false);

  const { data } = useQuery({
    queryKey: ['mouvements', typeFilter],
    queryFn: () => mouvementApi.getAll({ type: typeFilter || undefined }).then(r => r.data),
    retry: false,
  });
  const mouvements: MouvementStock[] = (data as MouvementStock[] | undefined) ?? DEMO_MOUVEMENTS;

  const filtered = mouvements.filter(m =>
    !search ||
    m.produit.nom.toLowerCase().includes(search.toLowerCase()) ||
    m.produit.reference.toLowerCase().includes(search.toLowerCase()) ||
    (m.motif ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (m.operateur ?? '').toLowerCase().includes(search.toLowerCase())
  ).filter(m => !typeFilter || m.type === typeFilter);

  const totalEntrees = mouvements.filter(m => ['ENTREE','AJUSTEMENT_POSITIF'].includes(m.type))
    .reduce((a,m) => a + m.quantite, 0);
  const totalSorties = mouvements.filter(m => ['SORTIE','AJUSTEMENT_NEGATIF'].includes(m.type))
    .reduce((a,m) => a + m.quantite, 0);

  return (
    <div className="space-y-6">
      {modalOpen && <NouveauMouvementModal onClose={() => setModalOpen(false)} />}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Mouvements de stock</h1>
          <p className="text-sm text-slate-400 mt-0.5">Journal de traçabilité complet</p>
        </div>
        <button onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 text-sm bg-blue-700 text-white
                     px-4 py-2.5 rounded-lg hover:bg-blue-800 transition-colors font-medium">
          <Plus size={16} /> Nouveau mouvement
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 col-span-1">
          <p className="text-xs text-slate-500 mb-1">Total mouvements</p>
          <p className="text-2xl font-bold text-slate-800">{mouvements.length}</p>
        </div>
        <div className="bg-emerald-50 rounded-xl border border-emerald-200 shadow-sm p-4">
          <p className="text-xs text-emerald-600 mb-1">Total entrées</p>
          <p className="text-2xl font-bold text-emerald-700">+{totalEntrees.toLocaleString()}</p>
        </div>
        <div className="bg-red-50 rounded-xl border border-red-200 shadow-sm p-4">
          <p className="text-xs text-red-600 mb-1">Total sorties</p>
          <p className="text-2xl font-bold text-red-700">−{totalSorties.toLocaleString()}</p>
        </div>
        <div className="bg-blue-50 rounded-xl border border-blue-200 shadow-sm p-4">
          <p className="text-xs text-blue-600 mb-1">Transferts</p>
          <p className="text-2xl font-bold text-blue-700">
            {mouvements.filter(m => m.type === 'TRANSFERT').length}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
          <p className="text-xs text-slate-500 mb-1">Ajustements</p>
          <p className="text-2xl font-bold text-slate-800">
            {mouvements.filter(m => m.type.startsWith('AJUSTEMENT')).length}
          </p>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-56">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Produit, motif, opérateur…"
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm
                       outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setTypeFilter('')}
            className={`flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border transition-colors
              ${!typeFilter ? 'bg-slate-800 text-white border-slate-800' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
            <Filter size={12} /> Tous
          </button>
          {(Object.entries(typeConfig) as [TypeMouvement, typeof typeConfig[TypeMouvement]][]).map(([k,v]) => {
            const Icon = v.icon;
            return (
              <button key={k} onClick={() => setTypeFilter(typeFilter === k ? '' : k)}
                className={`flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border transition-colors
                  ${typeFilter === k ? `${v.bg} ${v.color}` : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                <Icon size={12} /> {v.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Journal */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Date</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Type</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Produit</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Flux</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Quantité</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Motif</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Opérateur</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map(m => {
                const cfg = typeConfig[m.type];
                const Icon = cfg.icon;
                return (
                  <tr key={m.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3.5 text-xs text-slate-400 whitespace-nowrap">
                      {format(new Date(m.dateMouvement), 'd MMM HH:mm', { locale: fr })}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-medium
                                       px-2.5 py-1 rounded-full border ${cfg.bg} ${cfg.color}`}>
                        <Icon size={11} /> {cfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="font-medium text-slate-800">{m.produit.nom}</p>
                      <p className="text-xs text-slate-400 font-mono">{m.produit.reference}</p>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-400 max-w-xs">
                      {m.entrepotSource && <span>{m.entrepotSource.nom}</span>}
                      {m.entrepotSource && m.entrepotDestination && <span className="mx-1">→</span>}
                      {m.entrepotDestination && <span>{m.entrepotDestination.nom}</span>}
                      {!m.entrepotSource && !m.entrepotDestination && <span>—</span>}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`font-bold text-base ${cfg.color}`}>
                        {cfg.sign}{m.quantite.toLocaleString('fr-FR')}
                      </span>
                      <span className="text-slate-400 text-xs ml-1">{m.produit.unite}</span>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-500 max-w-48">
                      <span className="line-clamp-2">{m.motif ?? '—'}</span>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-600 whitespace-nowrap">
                      {m.operateur ?? '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-12 text-slate-400">
              <ArrowLeftRight size={32} className="mx-auto mb-3 opacity-30" />
              <p>Aucun mouvement trouvé</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
