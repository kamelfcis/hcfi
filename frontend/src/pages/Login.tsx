import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { toast } from 'react-toastify';
import { Shield, Star, Eye, EyeOff, Lock, User, LogIn, Rocket } from 'lucide-react';
import logoImage from '../../../logo.png';

export default function Login() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { setAuth, loadFromStorage } = useAuthStore();
  const primaryColor = 'var(--JKqx2, #1e293b)';
  const secondaryColor = '#f31415';
  const secondarySoft = 'rgba(243,20,21,0.2)';
  const secondaryMid = 'rgba(243,20,21,0.45)';
  const loginBackground = 'radial-gradient(circle at 18% 22%, rgb(20 163 212 / 20%) 0%, #28879e00 42%), radial-gradient(circle at 82% 78%, rgb(23 140 193 / 14%) 0%, #1f929f00 45%), linear-gradient(140deg, var(--JKqx2, #1e293b) 0%, #0f172a 52%, #111827 100%)';
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      loadFromStorage();
      const token = localStorage.getItem('accessToken');
      if (token) {
        try {
          await api.get('/auth/me');
          navigate('/', { replace: true });
        } catch {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          setCheckingSession(false);
        }
      } else {
        setCheckingSession(false);
      }
    };
    checkSession();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await api.post('/auth/login', { username, password });
      const { user, accessToken, refreshToken } = response.data;
      setAuth(user, accessToken, refreshToken);
      const savedToken = localStorage.getItem('accessToken');
      if (savedToken) {
        toast.success(i18n.language === 'ar' ? 'تم تسجيل الدخول بنجاح' : 'Login successful');
        navigate('/');
      } else {
        toast.error(i18n.language === 'ar' ? 'فشل حفظ الجلسة' : 'Failed to save session');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || t('auth.invalidCredentials'));
    } finally {
      setLoading(false);
    }
  };

  // --- Inline keyframe styles ---
  const animStyles = `
    @keyframes radarSweep {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    @keyframes radarPulse1 {
      0%, 100% { opacity: 0.15; transform: scale(0.5); }
      50% { opacity: 0.05; transform: scale(1.2); }
    }
    @keyframes radarPulse2 {
      0%, 100% { opacity: 0.1; transform: scale(0.7); }
      50% { opacity: 0.03; transform: scale(1.4); }
    }
    @keyframes diagonalMove {
      0% { background-position: 0 0; }
      100% { background-position: 60px 60px; }
    }
    @keyframes floatUp {
      0%, 100% { transform: translateY(0px) rotate(0deg); opacity: 0.04; }
      50% { transform: translateY(-30px) rotate(3deg); opacity: 0.08; }
    }
    @keyframes shimmer {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }
    @keyframes fadeInUp {
      0% { opacity: 0; transform: translateY(20px); }
      100% { opacity: 1; transform: translateY(0); }
    }
    @keyframes starGlow {
      0%, 100% { filter: drop-shadow(0 0 4px rgba(201,168,76,0.3)); }
      50% { filter: drop-shadow(0 0 12px rgba(201,168,76,0.6)); }
    }
    @keyframes borderGlow {
      0%, 100% { border-color: rgba(201,168,76,0.2); }
      50% { border-color: rgba(201,168,76,0.5); }
    }
    @keyframes logoFloat {
      0%, 100% { transform: translateY(0) scale(1); }
      50% { transform: translateY(-6px) scale(1.03); }
    }
    @keyframes logoStrokePulse {
      0%, 100% { box-shadow: 0 0 0 2px rgba(255,255,255,0.28), 0 0 18px rgba(243,20,21,0.35); }
      50% { box-shadow: 0 0 0 4px rgba(255,255,255,0.55), 0 0 28px rgba(243,20,21,0.55); }
    }
    @keyframes rocketFly1 {
      0% { transform: translate(0, 0) rotate(-45deg); opacity: 0; }
      10% { opacity: 0.12; }
      80% { opacity: 0.12; }
      100% { transform: translate(-500px, -500px) rotate(-45deg); opacity: 0; }
    }
    @keyframes rocketFly2 {
      0% { transform: translate(0, 0) rotate(-30deg); opacity: 0; }
      15% { opacity: 0.08; }
      75% { opacity: 0.08; }
      100% { transform: translate(-400px, -600px) rotate(-30deg); opacity: 0; }
    }
    @keyframes rocketFly3 {
      0% { transform: translate(0, 0) rotate(-55deg); opacity: 0; }
      12% { opacity: 0.06; }
      85% { opacity: 0.06; }
      100% { transform: translate(-600px, -350px) rotate(-55deg); opacity: 0; }
    }
    @keyframes rocketTrail {
      0%, 100% { opacity: 0.03; height: 0; }
      30% { opacity: 0.08; height: 80px; }
      70% { opacity: 0.06; height: 120px; }
    }
  `;

  if (checkingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: loginBackground }}>
        <style>{animStyles}</style>
        <div className="text-center" style={{ animation: 'fadeInUp 0.5s ease-out' }}>
          <div className="relative mx-auto mb-4 h-16 w-16">
            <Shield className="h-16 w-16" style={{ color: secondaryColor }} />
            <div className="absolute inset-0 flex items-center justify-center">
              <Star className="h-6 w-6" style={{ color: secondaryColor, animation: 'starGlow 2s ease-in-out infinite' }} />
            </div>
          </div>
          <p className="text-sm" style={{ color: secondaryColor }}>
            {i18n.language === 'ar' ? 'جارٍ التحقق من الجلسة...' : 'Checking session...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden" dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>
      <style>{animStyles}</style>

      {/* ─── Animated Background Layers ─── */}
      {/* Base gradient */}
      <div
        className="absolute inset-0"
        style={{ background: loginBackground }}
      />

      {/* Diagonal lines pattern */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `repeating-linear-gradient(
            45deg,
            transparent,
            transparent 28px,
            rgba(243,20,21,0.05) 28px,
            rgba(243,20,21,0.05) 30px
          )`,
          animation: 'diagonalMove 4s linear infinite',
        }}
      />

      {/* Radar circles - center */}
      <div
        className="absolute rounded-full"
        style={{
          width: '600px',
          height: '600px',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          border: `1px solid ${secondarySoft}`,
          animation: 'radarPulse1 6s ease-in-out infinite',
        }}
      />
      <div
        className="absolute rounded-full"
        style={{
          width: '900px',
          height: '900px',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          border: '1px solid rgba(243,20,21,0.14)',
          animation: 'radarPulse2 8s ease-in-out infinite',
        }}
      />

      {/* Radar sweep line */}
      <div
        className="absolute"
        style={{
          width: '450px',
          height: '2px',
          top: '50%',
          left: '50%',
          transformOrigin: '0% 50%',
          background: 'linear-gradient(90deg, rgba(243,20,21,0.25) 0%, transparent 100%)',
          animation: 'radarSweep 12s linear infinite',
        }}
      />

      {/* Floating decorative shapes */}
      <div
        className="absolute"
        style={{
          width: '200px',
          height: '200px',
          top: '10%',
          right: '10%',
          border: '1px solid rgba(243,20,21,0.12)',
          transform: 'rotate(45deg)',
          animation: 'floatUp 8s ease-in-out infinite',
        }}
      />
      <div
        className="absolute"
        style={{
          width: '150px',
          height: '150px',
          bottom: '15%',
          left: '8%',
          border: '1px solid rgba(243,20,21,0.1)',
          transform: 'rotate(30deg)',
          animation: 'floatUp 10s ease-in-out infinite 2s',
        }}
      />
      <div
        className="absolute rounded-full"
        style={{
          width: '100px',
          height: '100px',
          top: '20%',
          left: '15%',
          border: '1px solid rgba(243,20,21,0.08)',
          animation: 'floatUp 7s ease-in-out infinite 1s',
        }}
      />

      {/* Animated rocket shapes */}
      <div
        className="absolute"
        style={{
          bottom: '15%',
          right: '20%',
          animation: 'rocketFly1 10s ease-in-out infinite',
        }}
      >
        <Rocket className="h-8 w-8" style={{ color: 'rgba(201,168,76,0.12)' }} />
      </div>
      <div
        className="absolute"
        style={{
          bottom: '25%',
          right: '35%',
          animation: 'rocketFly2 14s ease-in-out infinite 3s',
        }}
      >
        <Rocket className="h-6 w-6" style={{ color: 'rgba(201,168,76,0.08)' }} />
      </div>
      <div
        className="absolute"
        style={{
          bottom: '10%',
          right: '50%',
          animation: 'rocketFly3 12s ease-in-out infinite 6s',
        }}
      >
        <Rocket className="h-10 w-10" style={{ color: 'rgba(201,168,76,0.06)' }} />
      </div>

      {/* Rocket trail lines */}
      <div
        className="absolute"
        style={{
          bottom: '30%',
          right: '15%',
          width: '2px',
          background: 'linear-gradient(to top, transparent, rgba(201,168,76,0.1), transparent)',
          transform: 'rotate(-45deg)',
          animation: 'rocketTrail 6s ease-in-out infinite',
        }}
      />
      <div
        className="absolute"
        style={{
          bottom: '40%',
          right: '45%',
          width: '1.5px',
          background: 'linear-gradient(to top, transparent, rgba(201,168,76,0.07), transparent)',
          transform: 'rotate(-35deg)',
          animation: 'rocketTrail 8s ease-in-out infinite 2s',
        }}
      />

      {/* Corner accents */}
      <div className="absolute top-0 left-0 h-32 w-32" style={{ borderTop: '2px solid rgba(201,168,76,0.15)', borderLeft: '2px solid rgba(201,168,76,0.15)' }} />
      <div className="absolute top-0 right-0 h-32 w-32" style={{ borderTop: '2px solid rgba(201,168,76,0.15)', borderRight: '2px solid rgba(201,168,76,0.15)' }} />
      <div className="absolute bottom-0 left-0 h-32 w-32" style={{ borderBottom: '2px solid rgba(201,168,76,0.15)', borderLeft: '2px solid rgba(201,168,76,0.15)' }} />
      <div className="absolute bottom-0 right-0 h-32 w-32" style={{ borderBottom: '2px solid rgba(201,168,76,0.15)', borderRight: '2px solid rgba(201,168,76,0.15)' }} />

      {/* ─── Login Card ─── */}
      <div
        className="relative z-10 w-full max-w-md mx-4"
        style={{ animation: 'fadeInUp 0.7s ease-out' }}
      >
        <div
          className="overflow-hidden rounded-2xl border"
          style={{
            background: 'linear-gradient(170deg, rgba(26,46,26,0.85) 0%, rgba(15,30,15,0.95) 100%)',
            backdropFilter: 'blur(24px) saturate(1.5)',
            WebkitBackdropFilter: 'blur(24px) saturate(1.5)',
            borderColor: secondaryMid,
            boxShadow: '0 0 60px rgba(0,0,0,0.5), 0 0 120px rgba(243,20,21,0.12), inset 0 1px 0 rgba(243,20,21,0.15)',
            animation: 'borderGlow 4s ease-in-out infinite',
          }}
        >
          {/* Top gold accent line */}
          <div
            className="h-1"
            style={{
              background: `linear-gradient(90deg, transparent 0%, ${primaryColor} 20%, ${secondaryColor} 50%, ${primaryColor} 80%, transparent 100%)`,
              backgroundSize: '200% 100%',
              animation: 'shimmer 3s linear infinite',
            }}
          />

          {/* Card Content */}
          <div className="p-8 sm:p-10">
            {/* ─── Emblem ─── */}
            <div className="mb-6 text-center" style={{ animation: 'fadeInUp 0.7s ease-out 0.1s both' }}>
              <div className="relative mx-auto mb-4 inline-flex items-center justify-center">
                {/* Outer ring */}
                <div
                  className="absolute h-32 w-32 rounded-full"
                  style={{
                    border: '3px solid rgba(255,255,255,0.45)',
                    animation: 'radarPulse1 4s ease-in-out infinite',
                  }}
                />
                {/* Company logo */}
                <img
                  src={logoImage}
                  alt={i18n.language === 'ar' ? 'شعار الشركة' : 'Company logo'}
                  className="relative h-24 w-24 rounded-full object-cover"
                  style={{
                    border: '2px solid rgba(255,255,255,0.65)',
                    animation: 'logoFloat 3s ease-in-out infinite, logoStrokePulse 2.6s ease-in-out infinite',
                  }}
                />
              </div>

              {/* Company name */}
              <h2
                className="text-lg font-bold leading-relaxed sm:text-xl"
                style={{ color: '#ffffff', fontFamily: 'inherit' }}
              >
                الشركة القابضة للصناعات الغدائية
              </h2>
              {/* Gold underline */}
              <div
                className="mx-auto mt-2 h-px w-40"
                style={{
                  background: `linear-gradient(90deg, transparent, ${secondaryColor}, transparent)`,
                }}
              />
              {/* Rocket emblem below title */}
              <div className="mx-auto mt-3 flex items-center justify-center gap-2">
                <Rocket className="h-4 w-4" style={{ color: primaryColor, transform: 'rotate(-45deg)', animation: 'starGlow 3s ease-in-out infinite 0.5s' }} />
                <span className="text-xs font-medium" style={{ color: 'rgb(255 255 255 / 85%)' }}>
                  {t('auth.login')}
                </span>
                <Rocket className="h-4 w-4" style={{ color: primaryColor, transform: 'rotate(-135deg)', animation: 'starGlow 3s ease-in-out infinite 1s' }} />
              </div>
            </div>

            {/* ─── Form ─── */}
            <form onSubmit={handleSubmit} className="space-y-5" style={{ animation: 'fadeInUp 0.7s ease-out 0.2s both' }}>
              {/* Username field */}
              <div className="space-y-2">
                <label
                  htmlFor="username"
                  className="flex items-center gap-2 text-sm font-medium"
                  style={{ color: 'rgb(255 255 255 / 85%)' }}
                >
                  <User className="h-3.5 w-3.5" />
                  {t('auth.username')}
                </label>
                <div className="relative">
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    autoComplete="username"
                    className="h-12 w-full rounded-xl px-4 text-sm outline-none transition-all duration-300 placeholder:text-white/20"
                    style={{
                      background: 'rgba(255,255,255,0.06)',
                      border: '1.5px solid rgba(243,20,21,0.25)',
                      color: '#ffffff',
                      caretColor: secondaryColor,
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = 'rgba(243,20,21,0.75)';
                      e.target.style.boxShadow = '0 0 0 3px rgba(243,20,21,0.18), 0 0 20px rgba(243,20,21,0.12)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = 'rgba(243,20,21,0.25)';
                      e.target.style.boxShadow = 'none';
                    }}
                    placeholder={t('auth.username')}
                  />
                </div>
              </div>

              {/* Password field with eye toggle */}
              <div className="space-y-2">
                <label
                  htmlFor="password"
                  className="flex items-center gap-2 text-sm font-medium"
                  style={{ color: 'rgb(255 255 255 / 85%)' }}
                >
                  <Lock className="h-3.5 w-3.5" />
                  {t('auth.password')}
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    className="h-12 w-full rounded-xl px-4 text-sm outline-none transition-all duration-300 placeholder:text-white/20"
                    style={{
                      background: 'rgba(255,255,255,0.06)',
                      border: '1.5px solid rgba(243,20,21,0.25)',
                      color: '#ffffff',
                      caretColor: secondaryColor,
                      paddingInlineEnd: '48px',
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = 'rgba(243,20,21,0.75)';
                      e.target.style.boxShadow = '0 0 0 3px rgba(243,20,21,0.18), 0 0 20px rgba(243,20,21,0.12)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = 'rgba(243,20,21,0.25)';
                      e.target.style.boxShadow = 'none';
                    }}
                    placeholder={t('auth.password')}
                  />
                  {/* Eye toggle button */}
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute top-1/2 -translate-y-1/2 flex items-center justify-center rounded-lg p-2 transition-all duration-200 hover:scale-110"
                    style={{
                      insetInlineEnd: '8px',
                      color: showPassword ? secondaryColor : 'rgba(243,20,21,0.45)',
                    }}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Login button */}
              <button
                type="submit"
                disabled={loading}
                className="relative mt-2 flex h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-xl text-sm font-bold uppercase tracking-wider transition-all duration-300"
                style={{
                  background: loading
                    ? 'rgba(243,20,21,0.35)'
                    : 'linear-gradient(135deg, #20647f 0%, #14b1f3 60%, #5aaeff 100%)',
                  color: '#ffffff',
                  letterSpacing: '0.1em',
                  boxShadow: loading ? 'none' : '0 4px 20px rgba(243,20,21,0.35), inset 0 1px 0 rgba(255,255,255,0.2)',
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    (e.target as HTMLElement).style.boxShadow = '0 6px 30px rgba(243,20,21,0.5), inset 0 1px 0 rgba(255,255,255,0.3)';
                    (e.target as HTMLElement).style.transform = 'translateY(-1px)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loading) {
                    (e.target as HTMLElement).style.boxShadow = '0 4px 20px rgba(243,20,21,0.35), inset 0 1px 0 rgba(255,255,255,0.2)';
                    (e.target as HTMLElement).style.transform = 'translateY(0)';
                  }
                }}
              >
                {loading ? (
                  <div className="flex items-center gap-3">
                    <div
                      className="h-5 w-5 rounded-full border-2 border-t-transparent"
                      style={{
                        borderColor: '#1a2e1a',
                        borderTopColor: 'transparent',
                        animation: 'radarSweep 0.8s linear infinite',
                      }}
                    />
                    <span style={{ color: '#ffffff' }}>
                      {i18n.language === 'ar' ? 'جارٍ الدخول...' : 'Signing in...'}
                    </span>
                  </div>
                ) : (
                  <>
                    <LogIn className="h-5 w-5" />
                    {t('auth.loginButton')}
                  </>
                )}
              </button>
            </form>

            {/* ─── Bottom decorative line ─── */}
            <div className="mt-8 flex items-center gap-3" style={{ animation: 'fadeInUp 0.7s ease-out 0.3s both' }}>
              <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(243,20,21,0.35))' }} />
              <Shield className="h-3.5 w-3.5" style={{ color: 'rgba(243,20,21,0.45)' }} />
              <div className="flex-1 h-px" style={{ background: 'linear-gradient(270deg, transparent, rgba(243,20,21,0.35))' }} />
            </div>

            <p className="mt-3 text-center text-[11px]" style={{ color: 'rgb(255 255 255 / 85%)', animation: 'fadeInUp 0.7s ease-out 0.35s both' }}>
              {i18n.language === 'ar' ? 'نظام مؤمَّن — الدخول للمخولين فقط' : 'Secured System — Authorized Personnel Only'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
