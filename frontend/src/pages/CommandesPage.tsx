import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { commandeApi } from '@/api/client';
import type { CommandeFournisseur, StatutCommande } from '@/types';
import {
  ShoppingCart, Plus, Search, Calendar, FileText,
  ChevronDown, ChevronRight, X, Loader2, Eye,
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

// ─── Demo data ─────────────────────────────────────────────────────
const DEMO_COMMANDES: CommandeFournisseur[] = [
  {
    id:1, numero:'CMD-2026-001',
    fournisseur: { id:1, raisonSociale:'Plantation Bamiléké SA', email:'contact@pb.cm', telephone:'+237 699 001 002', statut:'ACTIF', scoreFiabilite:4.7, createdAt:'2020-03-15' },
    entrepotDestination: { id:3, nom:'Entrepôt Central Douala', adresse:'Port Douala', type:'ENTREPOT_CENTRAL' },
    statut:'EN_COURS_LIVRAISON', datePrevueLivraison:'2026-05-28', montantTotal:3100000,
    notes:'Livraison fractionnée en 2 camions', createdAt:'2026-05-10',
    lignes: [
      { id:1, produit: { id:1, reference:'CAC-001', nom:'Cacao brut', prixUnitaire:2500, unite:'kg', actif:true, createdAt:'2024-01-01' }, quantiteCommandee:800, quantiteRecue:500, prixUnitaire:2500, montantLigne:2000000 },
      { id:2, produit: { id:3, reference:'CAF-001', nom:'Café Arabica', prixUnitaire:5800, unite:'kg', actif:true, createdAt:'2024-01-01' }, quantiteCommandee:150, quantiteRecue:0, prixUnitaire:5800, montantLigne:870000 },
    ],
  },
  {
    id:2, numero:'CMD-2026-002',
    fournisseur: { id:2, raisonSociale:'SODECAO Export', email:'export@sodecao.cm', telephone:'+237 676 445 231', statut:'ACTIF', scoreFiabilite:4.2, createdAt:'2019-07-22' },
    statut:'VALIDEE', datePrevueLivraison:'2026-06-05', montantTotal:756000,
    createdAt:'2026-05-14',
    lignes: [
      { id:3, produit: { id:2, reference:'CAC-002', nom:'Cacao transformé', prixUnitaire:4200, unite:'kg', actif:true, createdAt:'2024-01-01' }, quantiteCommandee:180, quantiteRecue:0, prixUnitaire:4200, montantLigne:756000 },
    ],
  },
  {
    id:3, numero:'CMD-2026-003',
    fournisseur: { id:5, raisonSociale:'Agro-Hévéa du Littoral', email:'gestion@agroheveea.cm', statut:'ACTIF', scoreFiabilite:4.0, createdAt:'2021-04-18' },
    statut:'SOUMISE', datePrevueLivraison:'2026-06-15', montantTotal:2040000,
    notes:'Attente validation budget Q3', createdAt:'2026-05-18',
    lignes: [
      { id:4, produit: { id:5, reference:'RBB-001', nom:'Caoutchouc naturel', prixUnitaire:1800, unite:'kg', actif:true, createdAt:'2024-01-01' }, quantiteCommandee:1000, quantiteRecue:0, prixUnitaire:1800, montantLigne:1800000 },
      { id:5, produit: { id:4, reference:'HVP-001', nom:'Huile de palme brute', prixUnitaire:1200, unite:'L', actif:true, createdAt:'2024-01-01' }, quantiteCommandee:200, quantiteRecue:0, prixUnitaire:1200, montantLigne:240000 },
    ],
  },
  {
    id:4, numero:'CMD-2026-004',
    fournisseur: { id:1, raisonSociale:'Plantation Bamiléké SA', email:'contact@pb.cm', statut:'ACTIF', scoreFiabilite:4.7, createdAt:'2020-03-15' },
    statut:'LIVREE', datePrevueLivraison:'2026-05-10', montantTotal:525000,
    createdAt:'2026-04-28',
    lignes: [
      { id:6, produit: { id:6, reference:'BAN-001', nom:'Bananes Cavendish', prixUnitaire:350, unite:'kg', actif:true, createdAt:'2024-01-01' }, quantiteCommandee:1500, quantiteRecue:1500, prixUnitaire:350, montantLigne:525000 },
    ],
  },
];

const statutConfig: Record<StatutCommande, { label: string; color: string; bg: string }> = {
  BROUILLON:           { label: 'Brouillon',         color: 'text-slate-600', bg: 'bg-slate-50 border-slate-200' },
  SOUMISE:             { label: 'Soumise',            color: 'text-blue-700',  bg: 'bg-blue-50 border-blue-200' },
  VALIDEE:             { label: 'Validée',            color: 'text-indigo-700',bg: 'bg-indigo-50 border-indigo-200' },
  EN_COURS_LIVRAISON:  { label: 'En livraison',       color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
  LIVREE_PARTIELLE:    { label: 'Livraison partielle',color: 'text-orange-700',bg: 'bg-orange-50 border-orange-200' },
  LIVREE:              { label: 'Livrée',             color: 'text-emerald-700',bg:'bg-emerald-50 border-emerald-200' },
  ANNULEE:             { label: 'Annulée',            color: 'text-red-700',   bg: 'bg-red-50 border-red-200' },
};

const TRANSITIONS: Partial<Record<StatutCommande, StatutCommande[]>> = {
  SOUMISE: ['VALIDEE', 'ANNULEE'],
  VALIDEE: ['EN_COURS_LIVRAISON', 'ANNULEE'],
  EN_COURS_LIVRAISON: ['LIVREE_PARTIELLE', 'LIVREE'],
  LIVREE_PARTIELLE: ['LIVREE'],
};

function StatutBadge({ statut }: { statut: StatutCommande }) {
  const cfg = statutConfig[statut];
  return (
    <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${cfg.bg} ${cfg.color}`}>
      {cfg.label}
    </span>
  );
}

function DetailModal({ commande, onClose }: { commande: CommandeFournisseur; onClose: () => void }) {
  const qc = useQueryClient();
  const changerStatut = useMutation({
    mutationFn: (statut: string) => commandeApi.changerStatut(commande.id, statut),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['commandes'] }); onClose(); },
  });

  const transitions = TRANSITIONS[commande.statut] ?? [];

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 sticky top-0 bg-white">
          <div>
            <h2 className="text-lg font-bold text-slate-800">{commande.numero}</h2>
            <p className="text-sm text-slate-400">{commande.fournisseur.raisonSociale}</p>
          </div>
          <div className="flex items-center gap-3">
            <StatutBadge statut={commande.statut} />
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* Infos */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-xs text-slate-400 font-medium mb-1">Date prévue livraison</p>
              <p className="font-semibold text-slate-700">
                {format(new Date(commande.datePrevueLivraison), 'd MMMM yyyy', { locale: fr })}
              </p>
            </div>
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-xs text-slate-400 font-medium mb-1">Montant total</p>
              <p className="font-semibold text-slate-700">
                {commande.montantTotal.toLocaleString('fr-FR')} FCFA
              </p>
            </div>
            {commande.entrepotDestination && (
              <div className="bg-slate-50 rounded-lg p-3 col-span-2">
                <p className="text-xs text-slate-400 font-medium mb-1">Entrepôt destination</p>
                <p className="font-semibold text-slate-700">{commande.entrepotDestination.nom}</p>
              </div>
            )}
          </div>

          {/* Lignes */}
          <div>
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Lignes de commande</h3>
            <table className="w-full text-sm border border-slate-100 rounded-lg overflow-hidden">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500">Produit</th>
                  <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-500">Commandé</th>
                  <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-500">Reçu</th>
                  <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-500">Montant</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {commande.lignes.map(l => (
                  <tr key={l.id}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-800">{l.produit.nom}</p>
                      <p className="text-xs text-slate-400 font-mono">{l.produit.reference}</p>
                    </td>
                    <td className="px-4 py-3 text-right text-slate-700">
                      {l.quantiteCommandee} {l.produit.unite}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={l.quantiteRecue >= l.quantiteCommandee ? 'text-emerald-600' : 'text-slate-600'}>
                        {l.quantiteRecue} {l.produit.unite}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-slate-700">
                      {l.montantLigne.toLocaleString('fr-FR')} F
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {commande.notes && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
              <FileText size={14} className="inline mr-2 mb-0.5" />
              {commande.notes}
            </div>
          )}

          {/* Actions statut */}
          {transitions.length > 0 && (
            <div className="pt-3 border-t border-slate-100">
              <p className="text-xs text-slate-500 font-medium mb-2">Changer le statut</p>
              <div className="flex gap-2 flex-wrap">
                {transitions.map(s => {
                  const cfg = statutConfig[s];
                  return (
                    <button key={s}
                      onClick={() => changerStatut.mutate(s)}
                      disabled={changerStatut.isPending}
                      className={`flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg border
                                  transition-colors hover:shadow-sm ${cfg.bg} ${cfg.color}`}>
                      {changerStatut.isPending && <Loader2 size={13} className="animate-spin" />}
                      <ChevronRight size={13} /> {cfg.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CommandesPage() {
  const [search, setSearch] = useState('');
  const [statutFilter, setStatutFilter] = useState<string>('');
  const [detail, setDetail] = useState<CommandeFournisseur | null>(null);

  const { data } = useQuery({
    queryKey: ['commandes', statutFilter],
    queryFn: () => commandeApi.getAll(statutFilter || undefined).then(r => r.data),
    retry: false,
  });
  const commandes: CommandeFournisseur[] = (data as CommandeFournisseur[] | undefined) ?? DEMO_COMMANDES;

  const filtered = commandes.filter(c =>
    !search ||
    c.numero.toLowerCase().includes(search.toLowerCase()) ||
    c.fournisseur.raisonSociale.toLowerCase().includes(search.toLowerCase())
  );

  const totalMontant = filtered.reduce((a, c) => a + c.montantTotal, 0);
  const enCours = commandes.filter(c => ['SOUMISE','VALIDEE','EN_COURS_LIVRAISON','LIVREE_PARTIELLE'].includes(c.statut)).length;

  return (
    <div className="space-y-6">
      {detail && <DetailModal commande={detail} onClose={() => setDetail(null)} />}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Commandes fournisseurs</h1>
          <p className="text-sm text-slate-400 mt-0.5">{enCours} commande(s) en cours</p>
        </div>
        <button className="flex items-center gap-2 text-sm bg-blue-700 text-white
                           px-4 py-2.5 rounded-lg hover:bg-blue-800 transition-colors font-medium">
          <Plus size={16} /> Nouvelle commande
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total commandes', value: commandes.length },
          { label: 'En cours', value: enCours, highlight: true },
          { label: 'Livrées ce mois', value: commandes.filter(c => c.statut === 'LIVREE').length },
          { label: 'Valeur filtrée', value: `${(totalMontant/1000000).toFixed(1)} M FCFA` },
        ].map(s => (
          <div key={s.label} className={`rounded-xl border shadow-sm p-4
            ${s.highlight ? 'bg-blue-50 border-blue-200' : 'bg-white border-slate-100'}`}>
            <p className={`text-2xl font-bold ${s.highlight ? 'text-blue-700' : 'text-slate-800'}`}>{s.value}</p>
            <p className="text-xs text-slate-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-56">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="N° commande, fournisseur…"
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm
                         outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
          </div>
          <div className="relative">
            <select value={statutFilter} onChange={e => setStatutFilter(e.target.value)}
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none
                         focus:border-blue-400 focus:ring-2 focus:ring-blue-100 appearance-none pr-8">
              <option value="">Tous les statuts</option>
              {Object.entries(statutConfig).map(([k,v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Liste */}
      <div className="space-y-3">
        {filtered.map(commande => (
          <div key={commande.id}
            className="bg-white rounded-xl border border-slate-100 shadow-sm p-5
                       hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <span className="font-mono text-sm font-bold text-slate-800">{commande.numero}</span>
                  <StatutBadge statut={commande.statut} />
                </div>
                <p className="text-slate-600 font-medium">{commande.fournisseur.raisonSociale}</p>
                <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <Calendar size={11} />
                    Livraison prévue : {format(new Date(commande.datePrevueLivraison), 'd MMM yyyy', { locale: fr })}
                  </span>
                  <span className="flex items-center gap-1">
                    <ShoppingCart size={11} />
                    {commande.lignes.length} ligne(s)
                  </span>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-lg font-bold text-slate-800">
                  {commande.montantTotal.toLocaleString('fr-FR')}
                </p>
                <p className="text-xs text-slate-400">FCFA</p>
                <button
                  onClick={() => setDetail(commande)}
                  className="mt-2 flex items-center gap-1.5 text-xs text-blue-600
                             hover:text-blue-800 transition-colors ml-auto">
                  <Eye size={13} /> Voir détail
                </button>
              </div>
            </div>
            {commande.notes && (
              <div className="mt-3 pt-3 border-t border-slate-50 text-xs text-slate-400">
                <FileText size={11} className="inline mr-1" /> {commande.notes}
              </div>
            )}
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-16 text-slate-400">
            <ShoppingCart size={36} className="mx-auto mb-3 opacity-30" />
            <p>Aucune commande trouvée</p>
          </div>
        )}
      </div>
    </div>
  );
}
