import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { livraisonApi } from '@/api/client';
import type { Livraison, StatutLivraison } from '@/types';
import {
  Truck, Search, MapPin, Clock, CheckCircle,
  AlertCircle, Package, Anchor, FileCheck, XCircle,
  ChevronDown, X, ChevronRight,
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

// ─── Demo data ─────────────────────────────────────────────────────
const DEMO_LIVRAISONS: Livraison[] = [
  {
    id:1, numero:'LIV-2026-001',
    commande: { id:1, numero:'CMD-2026-001', fournisseur: { id:1, raisonSociale:'Plantation Bamiléké SA', email:'', statut:'ACTIF', scoreFiabilite:4.7, createdAt:'' }, statut:'EN_COURS_LIVRAISON', datePrevueLivraison:'2026-05-28', montantTotal:3100000, lignes:[], createdAt:'' },
    statut:'EN_TRANSIT', dateExpedition:'2026-05-18', transporteur:'CAMEX Logistics', numeroTracking:'CMX-20260518-001',
    latitudeActuelle:4.36, longitudeActuelle:9.41, notes:'Convoi de 2 camions. ETA Port Douala : 20 Mai 17h', createdAt:'2026-05-18',
  },
  {
    id:2, numero:'LIV-2026-002',
    commande: { id:3, numero:'CMD-2026-003', fournisseur: { id:5, raisonSociale:'Agro-Hévéa du Littoral', email:'', statut:'ACTIF', scoreFiabilite:4.0, createdAt:'' }, statut:'VALIDEE', datePrevueLivraison:'2026-06-15', montantTotal:2040000, lignes:[], createdAt:'' },
    statut:'PLANIFIEE', dateExpedition:'2026-06-10', transporteur:'Trans-Cameroun SARL',
    createdAt:'2026-05-20',
  },
  {
    id:3, numero:'LIV-2026-003',
    commande: { id:1, numero:'CMD-2026-001', fournisseur: { id:1, raisonSociale:'Plantation Bamiléké SA', email:'', statut:'ACTIF', scoreFiabilite:4.7, createdAt:'' }, statut:'EN_COURS_LIVRAISON', datePrevueLivraison:'2026-05-28', montantTotal:3100000, lignes:[], createdAt:'' },
    statut:'AU_PORT_DOUALA', dateExpedition:'2026-05-15', transporteur:'Marfret CMR', numeroTracking:'MFT-20260515-088',
    latitudeActuelle:4.05, longitudeActuelle:9.70, notes:'En attente de dédouanement', createdAt:'2026-05-15',
  },
  {
    id:4, numero:'LIV-2026-004',
    commande: { id:4, numero:'CMD-2026-004', fournisseur: { id:1, raisonSociale:'Plantation Bamiléké SA', email:'', statut:'ACTIF', scoreFiabilite:4.7, createdAt:'' }, statut:'LIVREE', datePrevueLivraison:'2026-05-10', montantTotal:525000, lignes:[], createdAt:'' },
    statut:'LIVREE', dateExpedition:'2026-05-05', dateLivraisonEffective:'2026-05-09', transporteur:'AgroTrans CM',
    createdAt:'2026-05-05',
  },
  {
    id:5, numero:'LIV-2026-005',
    commande: { id:2, numero:'CMD-2026-002', fournisseur: { id:2, raisonSociale:'SODECAO Export', email:'', statut:'ACTIF', scoreFiabilite:4.2, createdAt:'' }, statut:'VALIDEE', datePrevueLivraison:'2026-06-05', montantTotal:756000, lignes:[], createdAt:'' },
    statut:'EN_DEDOUANEMENT', dateExpedition:'2026-05-12', transporteur:'DHL Cameroun', numeroTracking:'DHL-CM-456789',
    latitudeActuelle:4.05, longitudeActuelle:9.70, createdAt:'2026-05-12',
  },
];

const statutConfig: Record<StatutLivraison, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  PLANIFIEE:       { label: 'Planifiée',         color: 'text-slate-600',   bg: 'bg-slate-50 border-slate-200',     icon: Clock },
  EN_TRANSIT:      { label: 'En transit',         color: 'text-blue-700',    bg: 'bg-blue-50 border-blue-200',       icon: Truck },
  AU_PORT_DOUALA:  { label: 'Port de Douala',     color: 'text-indigo-700',  bg: 'bg-indigo-50 border-indigo-200',   icon: Anchor },
  EN_DEDOUANEMENT: { label: 'Dédouanement',       color: 'text-amber-700',   bg: 'bg-amber-50 border-amber-200',     icon: FileCheck },
  LIVREE:          { label: 'Livrée',             color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', icon: CheckCircle },
  REJETEE:         { label: 'Rejetée',            color: 'text-red-700',     bg: 'bg-red-50 border-red-200',         icon: XCircle },
  PARTIELLE:       { label: 'Livraison partielle',color: 'text-orange-700',  bg: 'bg-orange-50 border-orange-200',   icon: Package },
};

const TIMELINE: StatutLivraison[] = ['PLANIFIEE','EN_TRANSIT','AU_PORT_DOUALA','EN_DEDOUANEMENT','LIVREE'];
const TRANSITIONS: Partial<Record<StatutLivraison, StatutLivraison[]>> = {
  PLANIFIEE:       ['EN_TRANSIT'],
  EN_TRANSIT:      ['AU_PORT_DOUALA'],
  AU_PORT_DOUALA:  ['EN_DEDOUANEMENT'],
  EN_DEDOUANEMENT: ['LIVREE', 'REJETEE', 'PARTIELLE'],
};

function StatutBadge({ statut }: { statut: StatutLivraison }) {
  const cfg = statutConfig[statut];
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium
                     px-2.5 py-1 rounded-full border ${cfg.bg} ${cfg.color}`}>
      <Icon size={11} /> {cfg.label}
    </span>
  );
}

function TimelineBar({ statut }: { statut: StatutLivraison }) {
  const idx = TIMELINE.indexOf(statut);
  return (
    <div className="flex items-center gap-1 mt-3">
      {TIMELINE.map((s, i) => {
        const cfg = statutConfig[s];
        const done = i < idx;
        const current = i === idx;
        return (
          <div key={s} className="flex-1 flex flex-col items-center gap-1">
            <div className={`w-full h-1.5 rounded-full transition-all
              ${done ? 'bg-emerald-400' : current ? 'bg-blue-400' : 'bg-slate-100'}`} />
            <span className={`text-[10px] font-medium truncate max-w-full
              ${current ? cfg.color : done ? 'text-emerald-600' : 'text-slate-300'}`}>
              {cfg.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function DetailModal({ livraison, onClose }: { livraison: Livraison; onClose: () => void }) {
  const qc = useQueryClient();
  const changerStatut = useMutation({
    mutationFn: (statut: string) => livraisonApi.changerStatut(livraison.id, statut),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['livraisons'] }); onClose(); },
  });
  const transitions = TRANSITIONS[livraison.statut] ?? [];

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-800">{livraison.numero}</h2>
            <p className="text-sm text-slate-400">{livraison.commande.fournisseur.raisonSociale}</p>
          </div>
          <div className="flex items-center gap-3">
            <StatutBadge statut={livraison.statut} />
            <button onClick={onClose}><X size={20} className="text-slate-400" /></button>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* Timeline */}
          {TIMELINE.includes(livraison.statut) && <TimelineBar statut={livraison.statut} />}

          {/* Infos */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            {[
              { label: 'Transporteur', value: livraison.transporteur ?? '—' },
              { label: 'N° tracking', value: livraison.numeroTracking ?? '—' },
              { label: 'Expédition', value: livraison.dateExpedition ? format(new Date(livraison.dateExpedition), 'd MMM yyyy', { locale: fr }) : '—' },
              { label: 'Livraison effective', value: livraison.dateLivraisonEffective ? format(new Date(livraison.dateLivraisonEffective), 'd MMM yyyy', { locale: fr }) : '—' },
            ].map(info => (
              <div key={info.label} className="bg-slate-50 rounded-lg p-3">
                <p className="text-xs text-slate-400 font-medium mb-1">{info.label}</p>
                <p className="font-semibold text-slate-700">{info.value}</p>
              </div>
            ))}
          </div>

          {/* Position GPS */}
          {livraison.latitudeActuelle && (
            <div className="flex items-center gap-2 text-sm text-slate-600 bg-blue-50 border border-blue-100 rounded-lg p-3">
              <MapPin size={15} className="text-blue-500 flex-shrink-0" />
              <span>
                Position GPS : {livraison.latitudeActuelle.toFixed(4)}°N,&nbsp;
                {livraison.longitudeActuelle?.toFixed(4)}°E
              </span>
            </div>
          )}

          {/* Commande liée */}
          <div className="bg-slate-50 rounded-lg p-3 text-sm">
            <p className="text-xs text-slate-400 mb-1">Commande associée</p>
            <p className="font-mono font-bold text-slate-700">{livraison.commande.numero}</p>
            <p className="text-slate-500">{livraison.commande.montantTotal.toLocaleString('fr-FR')} FCFA</p>
          </div>

          {livraison.notes && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
              <AlertCircle size={14} className="inline mr-2 mb-0.5" />
              {livraison.notes}
            </div>
          )}

          {/* Transitions */}
          {transitions.length > 0 && (
            <div className="pt-3 border-t border-slate-100">
              <p className="text-xs text-slate-500 font-medium mb-2">Avancer le statut</p>
              <div className="flex gap-2 flex-wrap">
                {transitions.map(s => {
                  const cfg = statutConfig[s];
                  const Icon = cfg.icon;
                  return (
                    <button key={s} onClick={() => changerStatut.mutate(s)}
                      className={`flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg border
                                  transition-colors hover:shadow-sm ${cfg.bg} ${cfg.color}`}>
                      <ChevronRight size={13} />
                      <Icon size={13} /> {cfg.label}
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

export default function LivraisonsPage() {
  const [search, setSearch] = useState('');
  const [statutFilter, setStatutFilter] = useState<string>('');
  const [detail, setDetail] = useState<Livraison | null>(null);

  const { data } = useQuery({
    queryKey: ['livraisons', statutFilter],
    queryFn: () => livraisonApi.getAll(statutFilter || undefined).then(r => r.data),
    retry: false,
  });
  const livraisons: Livraison[] = (data as Livraison[] | undefined) ?? DEMO_LIVRAISONS;

  const filtered = livraisons.filter(l =>
    !search ||
    l.numero.toLowerCase().includes(search.toLowerCase()) ||
    l.commande.numero.toLowerCase().includes(search.toLowerCase()) ||
    l.commande.fournisseur.raisonSociale.toLowerCase().includes(search.toLowerCase()) ||
    (l.transporteur ?? '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {detail && <DetailModal livraison={detail} onClose={() => setDetail(null)} />}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Suivi des livraisons</h1>
          <p className="text-sm text-slate-400 mt-0.5">Tracking en temps réel · Statuts & historique</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
        {(Object.keys(statutConfig) as StatutLivraison[]).map(s => {
          const cfg = statutConfig[s];
          const count = livraisons.filter(l => l.statut === s).length;
          const Icon = cfg.icon;
          return (
            <button key={s}
              onClick={() => setStatutFilter(statutFilter === s ? '' : s)}
              className={`p-3 rounded-xl border text-left transition-all
                ${statutFilter === s ? 'ring-2 ring-blue-400' : ''}
                ${count > 0 ? cfg.bg : 'bg-white border-slate-100'} hover:shadow-sm`}>
              <div className="flex items-center justify-between mb-1">
                <Icon size={14} className={count > 0 ? cfg.color : 'text-slate-300'} />
                <span className={`text-lg font-bold ${count > 0 ? cfg.color : 'text-slate-300'}`}>{count}</span>
              </div>
              <p className={`text-[10px] font-medium leading-tight ${count > 0 ? cfg.color : 'text-slate-400'}`}>
                {cfg.label}
              </p>
            </button>
          );
        })}
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-56">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="N° livraison, commande, fournisseur, transporteur…"
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm
                       outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
        </div>
        <div className="relative">
          <select value={statutFilter} onChange={e => setStatutFilter(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none
                       focus:border-blue-400 appearance-none pr-8">
            <option value="">Tous</option>
            {(Object.entries(statutConfig) as [StatutLivraison, typeof statutConfig[StatutLivraison]][]).map(([k,v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {/* Cards */}
      <div className="space-y-4">
        {filtered.map(liv => {
          const cfg = statutConfig[liv.statut];
          const Icon = cfg.icon;
          const timelineApplicable = TIMELINE.includes(liv.statut);
          return (
            <div key={liv.id}
              className="bg-white rounded-xl border border-slate-100 shadow-sm p-5
                         hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setDetail(liv)}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-mono font-bold text-slate-800">{liv.numero}</span>
                    <StatutBadge statut={liv.statut} />
                  </div>
                  <p className="text-slate-600 font-medium">{liv.commande.fournisseur.raisonSociale}</p>
                  <p className="text-xs text-slate-400 font-mono">{liv.commande.numero}</p>
                  <div className="flex items-center gap-4 mt-1.5 text-xs text-slate-400">
                    {liv.transporteur && (
                      <span className="flex items-center gap-1">
                        <Truck size={11} /> {liv.transporteur}
                      </span>
                    )}
                    {liv.numeroTracking && (
                      <span className="flex items-center gap-1 font-mono">
                        <Package size={11} /> {liv.numeroTracking}
                      </span>
                    )}
                    {liv.latitudeActuelle && (
                      <span className="flex items-center gap-1 text-blue-500">
                        <MapPin size={11} /> GPS actif
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex-shrink-0 text-right">
                  <div className={`p-2.5 rounded-xl ${cfg.bg} mb-1 inline-block`}>
                    <Icon size={18} className={cfg.color} />
                  </div>
                  {liv.dateExpedition && (
                    <p className="text-xs text-slate-400">
                      Exp. {format(new Date(liv.dateExpedition), 'd MMM', { locale: fr })}
                    </p>
                  )}
                </div>
              </div>

              {/* Timeline miniaturisée */}
              {timelineApplicable && (
                <div className="mt-3 pt-3 border-t border-slate-50">
                  <div className="flex gap-1">
                    {TIMELINE.map((s, i) => {
                      const cur = TIMELINE.indexOf(liv.statut);
                      const done = i < cur;
                      const current = i === cur;
                      return (
                        <div key={s} className={`h-1.5 flex-1 rounded-full transition-all
                          ${done ? 'bg-emerald-400' : current ? 'bg-blue-400' : 'bg-slate-100'}`} />
                      );
                    })}
                  </div>
                </div>
              )}

              {liv.notes && (
                <p className="mt-2 text-xs text-amber-600 flex items-center gap-1">
                  <AlertCircle size={11} /> {liv.notes}
                </p>
              )}
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-center py-16 text-slate-400">
            <Truck size={36} className="mx-auto mb-3 opacity-30" />
            <p>Aucune livraison trouvée</p>
          </div>
        )}
      </div>
    </div>
  );
}
