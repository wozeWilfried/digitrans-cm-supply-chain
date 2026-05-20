import { useQuery } from '@tanstack/react-query';
import {
  Package, Truck, ShoppingCart, AlertTriangle,
  TrendingUp, Wifi, WifiOff, RefreshCw
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, BarChart, Bar
} from 'recharts';
import { dashboardApi } from '@/api/client';

// ─── Données de démo (remplacées par l'API) ────────────────────────
const fluxData = [
  { mois: 'Jan', entrees: 420, sorties: 380 },
  { mois: 'Fév', entrees: 510, sorties: 460 },
  { mois: 'Mar', entrees: 380, sorties: 390 },
  { mois: 'Avr', entrees: 620, sorties: 540 },
  { mois: 'Mai', entrees: 580, sorties: 510 },
];

const livraisonsData = [
  { statut: 'Planifiée', count: 4 },
  { statut: 'En transit', count: 7 },
  { statut: 'Port Douala', count: 2 },
  { statut: 'Livrée', count: 18 },
];

// ─── Composants UI ────────────────────────────────────────────────
function KpiCard({
  title, value, subtitle, icon: Icon, color, trend
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  color: string;
  trend?: { value: number; label: string };
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5
                    hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500 font-medium">{title}</p>
          <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
          {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-xl ${color.replace('text-', 'bg-').replace('600', '100')}`}>
          <Icon size={22} className={color} />
        </div>
      </div>
      {trend && (
        <div className="mt-3 pt-3 border-t border-slate-50">
          <span className={`text-xs font-medium ${trend.value >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
            {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}%
          </span>
          <span className="text-xs text-slate-400 ml-1">{trend.label}</span>
        </div>
      )}
    </div>
  );
}

// ─── Page Dashboard ───────────────────────────────────────────────
export default function DashboardPage() {
  const { data: kpis, isLoading, refetch } = useQuery({
    queryKey: ['dashboard-kpis'],
    queryFn: () => dashboardApi.getKpis().then(r => r.data),
    refetchInterval: 30000, // Actualise toutes les 30s
  });

  const online = navigator.onLine;

  return (
    <div className="space-y-6">
      {/* ── En-tête ──────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Tableau de bord</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Supply Chain AGROCAM S.A. — Vue temps réel
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full
            ${online ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
            {online ? <Wifi size={12} /> : <WifiOff size={12} />}
            {online ? 'En ligne' : 'Hors ligne (mode dégradé)'}
          </div>
          <button
            onClick={() => refetch()}
            disabled={isLoading}
            className="flex items-center gap-2 text-sm bg-blue-600 text-white
                       px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors
                       disabled:opacity-50"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            Actualiser
          </button>
        </div>
      </div>

      {/* ── KPI Cards ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Stocks en alerte"
          value={kpis?.stocksEnAlerte ?? 3}
          subtitle="Sous le seuil critique"
          icon={AlertTriangle}
          color="text-red-600"
          trend={{ value: -12, label: 'vs semaine dernière' }}
        />
        <KpiCard
          title="Commandes en cours"
          value={kpis?.commandesEnCours ?? 8}
          subtitle="En attente de livraison"
          icon={ShoppingCart}
          color="text-blue-600"
          trend={{ value: 5, label: 'vs mois dernier' }}
        />
        <KpiCard
          title="Livraisons aujourd'hui"
          value={kpis?.livraisonsAujourdhui ?? 4}
          subtitle="Dont 1 au Port de Douala"
          icon={Truck}
          color="text-amber-600"
        />
        <KpiCard
          title="Disponibilité offline"
          value={`${kpis?.tauxDisponibiliteOffline ?? 65}%`}
          subtitle="Cible : 70%"
          icon={TrendingUp}
          color="text-emerald-600"
          trend={{ value: 3, label: 'amélioration ce sprint' }}
        />
      </div>

      {/* ── Graphiques ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Flux de marchandises */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-100 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Package size={16} className="text-blue-600" />
            <h2 className="font-semibold text-slate-700">Flux de marchandises (tonnes)</h2>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={fluxData}>
              <defs>
                <linearGradient id="colorEntrees" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorSorties" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="mois" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip />
              <Area type="monotone" dataKey="entrees" stroke="#3b82f6"
                    fill="url(#colorEntrees)" name="Entrées" strokeWidth={2} />
              <Area type="monotone" dataKey="sorties" stroke="#f59e0b"
                    fill="url(#colorSorties)" name="Sorties" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Statut livraisons */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Truck size={16} className="text-amber-500" />
            <h2 className="font-semibold text-slate-700">Statut livraisons</h2>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={livraisonsData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis dataKey="statut" type="category" tick={{ fontSize: 11 }}
                     axisLine={false} tickLine={false} width={80} />
              <Tooltip />
              <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} name="Livraisons" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Footer info ──────────────────────────────────────── */}
      <p className="text-xs text-slate-300 text-center">
        DIGITRANS-SCM v1.0.0 — CAMTECH SOLUTIONS S.A. © 2026 |
        Données hébergées sur AWS af-south-1
      </p>
    </div>
  );
}
