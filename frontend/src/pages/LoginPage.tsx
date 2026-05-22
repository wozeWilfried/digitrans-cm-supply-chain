import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authApi } from '@/api/client';
import { Truck, Mail, Lock, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  motDePasse: z.string().min(1, 'Mot de passe requis'),
});
type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const [showPwd, setShowPwd] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register, handleSubmit, formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (values: LoginForm) => {
    setApiError(null);
    try {
      const { data } = await authApi.login(values.email, values.motDePasse);
      localStorage.setItem('jwt_token', data.token);
      localStorage.setItem('refresh_token', data.refreshToken);
      localStorage.setItem('user', JSON.stringify(data.user));
      navigate('/dashboard');
    } catch (err: unknown) {
      // Fallback demo mode — backend pas encore connecté
      if ((err as { response?: { status?: number } })?.response?.status === undefined ||
          (err as { response?: { status?: number } })?.response?.status !== 401) {
        // Demo : on accepte les identifiants de démo
        localStorage.setItem('jwt_token', 'demo_token_agrocam');
        localStorage.setItem('user', JSON.stringify({
          id: 1, nom: 'DONGMO', prenom: 'Wilfried', email: values.email,
          role: 'MANAGER', actif: true,
        }));
        navigate('/dashboard');
      } else {
        setApiError('Identifiants incorrects. Vérifiez votre email et mot de passe.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-blue-800 flex items-center justify-center p-4">
      {/* Background decorative */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-amber-400/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Card */}
        <div className="bg-white/95 backdrop-blur rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-900 to-blue-800 p-8 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-amber-400 rounded-2xl mb-4 shadow-lg">
              <Truck size={28} className="text-blue-900" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">DIGITRANS-SCM</h1>
            <p className="text-blue-300 text-sm mt-1">Supply Chain AGROCAM S.A.</p>
          </div>

          {/* Form */}
          <div className="p-8">
            <h2 className="text-lg font-semibold text-slate-800 mb-6">Connexion</h2>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Adresse email
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    {...register('email')}
                    type="email"
                    placeholder="vous@agrocam.cm"
                    className={`w-full pl-10 pr-4 py-2.5 border rounded-lg text-sm outline-none
                      transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-100
                      ${errors.email ? 'border-red-400 bg-red-50' : 'border-slate-200 bg-white'}`}
                  />
                </div>
                {errors.email && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle size={12} /> {errors.email.message}
                  </p>
                )}
              </div>

              {/* Mot de passe */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Mot de passe
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    {...register('motDePasse')}
                    type={showPwd ? 'text' : 'password'}
                    placeholder="••••••••"
                    className={`w-full pl-10 pr-10 py-2.5 border rounded-lg text-sm outline-none
                      transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-100
                      ${errors.motDePasse ? 'border-red-400 bg-red-50' : 'border-slate-200 bg-white'}`}
                  />
                  <button type="button" onClick={() => setShowPwd(!showPwd)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.motDePasse && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle size={12} /> {errors.motDePasse.message}
                  </p>
                )}
              </div>

              {/* API Error */}
              {apiError && (
                <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
                  <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                  <span>{apiError}</span>
                </div>
              )}

              <button type="submit" disabled={isSubmitting}
                className="w-full bg-blue-700 hover:bg-blue-800 disabled:opacity-60
                           text-white font-semibold py-3 rounded-lg transition-colors
                           flex items-center justify-center gap-2 text-sm">
                {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                {isSubmitting ? 'Connexion…' : 'Se connecter'}
              </button>
            </form>

            {/* Demo hint */}
            <div className="mt-6 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-xs text-amber-700 font-medium">Mode démonstration</p>
              <p className="text-xs text-amber-600 mt-0.5">
                Utilisez n'importe quel email valide pour explorer l'interface.
              </p>
            </div>
          </div>
        </div>

        <p className="text-center text-blue-300/60 text-xs mt-6">
          CAMTECH SOLUTIONS S.A. © 2026 — AWS af-south-1
        </p>
      </div>
    </div>
  );
}
