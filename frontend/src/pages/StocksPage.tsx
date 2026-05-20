import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { stockApi } from '@/api/client';
import type { Stock } from '@/types';
import {
  Package, AlertTriangle, Search, Filter,
  TrendingUp, TrendingDown, RefreshCw, Download,
  ChevronUp, ChevronDown,
} from 'lucide-react';

// ─── Demo data ────────────────────────────────────────────────────
const DEMO_STOCKS: Stock[] = [
  { id:1, produit: { id:1, reference:'CAC-001', nom:'Cacao brut', description:'Fèves séchées', prixUnitaire:2500, unite:'kg', actif:true, createdAt:'2024-01-01' }, entrepot: { id:1, nom:'Plantation Nord', adresse:'Bafoussam', type:'PLANTATION' }, quantite:1240, seuilAlerte:500, quantiteMax:5000, enAlerte:false, updatedAt:'2026-05-20' },
  { id:2, produit: { id:2, reference:'CAC-002', nom:'Cacao transformé', description:'Pâte de cacao', prixUnitaire:4200, unite:'kg', actif:true, createdAt:'2024-01-01' }, entrepot: { id:2, nom:'Usine de transformation', adresse:'Douala', type:'TRANSFORMATION' }, quantite:320, seuilAlerte:400, quantiteMax:2000, enAlerte:true, updatedAt:'2026-05-20' },
  { id:3, produit: { id:3, reference:'CAF-001', nom:'Café Arabica', description:'Grains verts', prixUnitaire:5800, unite:'kg', actif:true, createdAt:'2024-01-01' }, entrepot: { id:1, nom:'Plantation Nord', adresse:'Bafoussam', type:'PLANTATION' }, quantite:890, seuilAlerte:300, quantiteMax:3000, enAlerte:false, updatedAt:'2026-05-19' },
  { id:4, produit: { id:4, reference:'HVP-001', nom:'Huile de palme brute', description:'CPO', prixUnitaire:1200, unite:'L', actif:true, createdAt:'2024-01-01' }, entrepot: { id:3, nom:'Entrepôt Central Douala', adresse:'Port Douala', type:'ENTREPOT_CENTRAL' }, quantite:180, seuilAlerte:500, quantiteMax:10000, enAlerte:true, updatedAt:'2026-05-20' },
  { id:5, produit: { id:5, reference:'RBB-001', nom:'Caoutchouc naturel', description:'Latex coagulé', prixUnitaire:1800, unite:'kg', actif:true, createdAt:'2024-01-01' }, entrepot: { id:3, nom:'Entrepôt Central Douala', adresse:'Port Douala', type:'ENTREPOT_CENTRAL' }, quantite:3400, seuilAlerte:1000, quantiteMax:8000, enAlerte:false, updatedAt:'2026-05-18' },
  { id:6, produit: { id:6, reference:'BAN-001', nom:'Bananes Cavendish', description:'Export qualité A', prixUnitaire:350, unite:'kg', actif:true, createdAt:'2024-01-01' }, entrepot: { id:4, nom:'Point de vente Yaoundé', adresse:'Yaoundé centre', type:'POINT_VENTE' }, quantite:95, seuilAlerte:200, quantiteMax:1000, enAlerte:true, updatedAt:'2026-05-20' },
];

function StockLevelBar({ quantite, seuilAlerte, quantiteMax, enAlerte }: { quantite: number; seuilAlerte: number; quantiteMax?: number; enAlerte: boolean }) {
  const max = quantiteMax || seuilAlerte * 5;
  const pct = Math.min(100, (quantite / max) * 100);
  const alertPct = (seuilAlerte / max) * 100;
  return (
    <div className="relative w-full h-2 bg-slate-100 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all ${enAlerte ? 'bg-red-500' : pct > 60 ? 'bg-emerald-500' : 'bg-amber-400'}`}
        style={{ width: `${pct}%` }}
      />
      <div className="absolute top-0 h-full w-0.5 bg-orange-400/60"
           style={{ left: `${alertPct}%` }} />
    </div>
  );
}

type SortKey = 'produit' | 'entrepot' | 'quantite' | 'seuilAlerte';

export default function StocksPage() {
  const [search, setSearch] = useState('');
  const [alerteOnly, setAlerteOnly] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>('produit');
  const [sortAsc, setSortAsc] = useState(true);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['stocks', alerteOnly],
    queryFn: () => stockApi.getAll({ alerteSeulement: alerteOnly || undefined }).then(r => r.data),
    retry: false,
  });

  const stocks: Stock[] = (data as Stock[] | undefined) ?? DEMO_STOCKS;

  const filtered = stocks
    .filter(s => !search || s.produit.nom.toLowerCase().includes(search.toLowerCase())
      || s.produit.reference.toLowerCase().includes(search.toLowerCase())
      || s.entrepot.nom.toLowerCase().includes(search.toLowerCase()))
    .filter(s => !alerteOnly || s.enAlerte)
    .sort((a, b) => {
      let va: string | number = '';
      let vb: string | number = '';
      if (sortKey === 'produit') { va = a.produit.nom; vb = b.produit.nom; }
      else if (sortKey === 'entrepot') { va = a.entrepot.nom; vb = b.entrepot.nom; }
      else if (sortKey === 'quantite') { va = a.quantite; vb = b.quantite; }
      else if (sortKey === 'seuilAlerte') { va = a.seuilAlerte; vb = b.seuilAlerte; }
      if (typeof va === 'string') return sortAsc ? va.localeCompare(vb as string) : (vb as string).localeCompare(va);
      return sortAsc ? (va as number) - (vb as number) : (vb as number) - (va as number);
    });

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(true); }
  };

  const SortIcon = ({ k }: { k: SortKey }) => sortKey === k
    ? (sortAsc ? <ChevronUp size={14} /> : <ChevronDown size={14} />)
    : <span className="w-3.5" />;

  const nbAlertes = stocks.filter(s => s.enAlerte).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Gestion des stocks</h1>
          <p className="text-sm text-slate-400 mt-0.5">Niveaux en temps réel · Alertes automatiques</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => refetch()}
            className="flex items-center gap-2 text-sm text-slate-600 border border-slate-200
                       px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors">
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            Actualiser
          </button>
          <button className="flex items-center gap-2 text-sm bg-blue-700 text-white
                             px-4 py-2 rounded-lg hover:bg-blue-800 transition-colors">
            <Download size={14} /> Exporter
          </button>
        </div>
      </div>

      {/* Stats rapides */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total références', value: stocks.length, icon: Package, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'En alerte critique', value: nbAlertes, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
          { label: 'Entrées cette semaine', value: '+2 840 kg', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Sorties cette semaine', value: '-1 620 kg', icon: TrendingDown, color: 'text-amber-600', bg: 'bg-amber-50' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-500 font-medium">{s.label}</span>
              <div className={`${s.bg} p-2 rounded-lg`}>
                <s.icon size={14} className={s.color} />
              </div>
            </div>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-56">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher un produit, entrepôt…"
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm
                         outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <button
            onClick={() => setAlerteOnly(!alerteOnly)}
            className={`flex items-center gap-2 text-sm px-4 py-2 rounded-lg border transition-colors
              ${alerteOnly
                ? 'bg-red-50 border-red-200 text-red-700'
                : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
            <Filter size={14} />
            Alertes seulement
            {nbAlertes > 0 && (
              <span className="bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 leading-none">
                {nbAlertes}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Tableau */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {[
                  { key: 'produit' as SortKey, label: 'Produit' },
                  { key: 'entrepot' as SortKey, label: 'Entrepôt' },
                  { key: 'quantite' as SortKey, label: 'Quantité' },
                  { key: 'seuilAlerte' as SortKey, label: 'Seuil alerte' },
                ].map(col => (
                  <th key={col.key}
                    onClick={() => toggleSort(col.key)}
                    className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase
                               tracking-wide cursor-pointer hover:text-slate-700 select-none">
                    <span className="flex items-center gap-1">
                      {col.label} <SortIcon k={col.key} />
                    </span>
                  </th>
                ))}
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Niveau
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Statut
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map(stock => (
                <tr key={stock.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3.5">
                    <p className="font-medium text-slate-800">{stock.produit.nom}</p>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">{stock.produit.reference}</p>
                  </td>
                  <td className="px-4 py-3.5">
                    <p className="text-slate-700">{stock.entrepot.nom}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{stock.entrepot.type}</p>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="font-semibold text-slate-800">
                      {stock.quantite.toLocaleString('fr-FR')}
                    </span>
                    <span className="text-slate-400 ml-1">{stock.produit.unite}</span>
                  </td>
                  <td className="px-4 py-3.5 text-slate-600">
                    {stock.seuilAlerte.toLocaleString('fr-FR')} {stock.produit.unite}
                  </td>
                  <td className="px-4 py-3.5 w-36">
                    <StockLevelBar
                      quantite={stock.quantite}
                      seuilAlerte={stock.seuilAlerte}
                      quantiteMax={stock.quantiteMax}
                      enAlerte={stock.enAlerte}
                    />
                    <p className="text-xs text-slate-400 mt-1">
                      {stock.quantiteMax
                        ? `${Math.round((stock.quantite / stock.quantiteMax) * 100)}% de capacité`
                        : '—'}
                    </p>
                  </td>
                  <td className="px-4 py-3.5">
                    {stock.enAlerte ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium
                                       text-red-700 bg-red-50 border border-red-200 px-2 py-1 rounded-full">
                        <AlertTriangle size={11} /> Critique
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-medium
                                       text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-full">
                        ✓ Normal
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-12 text-slate-400">
              <Package size={32} className="mx-auto mb-3 opacity-30" />
              <p>Aucun stock trouvé</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
