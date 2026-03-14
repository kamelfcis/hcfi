import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';
import {
  FileText,
  Inbox,
  Send,
  Clock,
  Eye,
  Building2,
  Users,
  Calendar,
  TrendingUp,
  CheckCircle,
  FileCheck,
  MessageSquare,
  Archive,
  Activity,
  ArrowRight,
} from 'lucide-react';
import logoImage from '../../../logo.png';

interface DashboardStats {
  totalCorrespondences: number;
  incomingCount: number;
  outgoingCount: number;
  pendingReview: number;
  underReview: number;
  totalEntities: number;
  totalUsers: number;
  thisMonthCount: number;
  thisWeekCount: number;
  todayCount: number;
  completedCount: number;
  draftCount: number;
  repliedCount: number;
  statusBreakdown: Record<string, number>;
  completionRate: number;
}

export default function Dashboard() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/dashboard/stats');
        setStats(response.data);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  // Brand palette from logo
  const gold = 'var(--JKqx2, #1e293b)';
  const goldLight = '#f31415';
  const goldDim = 'rgba(243, 20, 21, 0.6)';
  const cardBg = 'rgba(201,168,76,0.04)';
  const cardBorder = 'rgba(201,168,76,0.12)';
  const cardHoverBg = 'rgba(201,168,76,0.08)';

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" style={{ background: 'rgba(201,168,76,0.1)' }} />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="rounded-xl p-6"
              style={{ background: cardBg, border: `1px solid ${cardBorder}` }}
            >
              <Skeleton className="h-4 w-24 mb-4" style={{ background: 'rgba(201,168,76,0.1)' }} />
              <Skeleton className="h-8 w-16" style={{ background: 'rgba(201,168,76,0.1)' }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-64 text-sm" style={{ color: goldDim }}>
        Failed to load dashboard
      </div>
    );
  }

  const completionRate = stats.totalCorrespondences > 0
    ? ((stats.completedCount / stats.totalCorrespondences) * 100).toFixed(1)
    : '0';

  const premiumCardThemes = [
    { bg: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)', border: '#93c5fd', iconBg: '#bfdbfe', iconColor: '#1d4ed8', titleColor: '#1e3a8a', valueColor: '#0f172a', metaColor: '#1e40af', metaSubColor: '#334155' },
    { bg: 'linear-gradient(135deg, #ecfeff 0%, #cffafe 100%)', border: '#67e8f9', iconBg: '#a5f3fc', iconColor: '#0e7490', titleColor: '#155e75', valueColor: '#0f172a', metaColor: '#0f766e', metaSubColor: '#334155' },
    { bg: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)', border: '#c4b5fd', iconBg: '#ddd6fe', iconColor: '#6d28d9', titleColor: '#5b21b6', valueColor: '#0f172a', metaColor: '#7c3aed', metaSubColor: '#334155' },
    { bg: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)', border: '#fdba74', iconBg: '#fed7aa', iconColor: '#c2410c', titleColor: '#9a3412', valueColor: '#0f172a', metaColor: '#c2410c', metaSubColor: '#334155' },
    { bg: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)', border: '#86efac', iconBg: '#bbf7d0', iconColor: '#15803d', titleColor: '#166534', valueColor: '#0f172a', metaColor: '#15803d', metaSubColor: '#334155' },
    { bg: 'linear-gradient(135deg, #fefce8 0%, #fef9c3 100%)', border: '#fde047', iconBg: '#fef08a', iconColor: '#a16207', titleColor: '#854d0e', valueColor: '#0f172a', metaColor: '#a16207', metaSubColor: '#334155' },
  ];

  const statCards = [
    {
      title: t('dashboard.totalCorrespondences'),
      value: stats.totalCorrespondences,
      icon: FileText,
      change: stats.thisMonthCount,
      changeLabel: t('dashboard.thisMonth'),
      link: '/incoming',
    },
    {
      title: t('dashboard.incoming'),
      value: stats.incomingCount,
      icon: Inbox,
      change: stats.incomingCount > 0 ? ((stats.incomingCount / stats.totalCorrespondences) * 100).toFixed(1) + '%' : '0%',
      changeLabel: i18n.language === 'ar' ? 'من الإجمالي' : 'of total',
      link: '/incoming',
    },
    {
      title: t('dashboard.outgoing'),
      value: stats.outgoingCount,
      icon: Send,
      change: stats.outgoingCount > 0 ? ((stats.outgoingCount / stats.totalCorrespondences) * 100).toFixed(1) + '%' : '0%',
      changeLabel: i18n.language === 'ar' ? 'من الإجمالي' : 'of total',
      link: '/outgoing',
    },
    {
      title: t('dashboard.pendingReview'),
      value: stats.pendingReview,
      icon: Clock,
      change: stats.pendingReview,
      changeLabel: i18n.language === 'ar' ? 'في الانتظار' : 'pending',
      link: '/reviews',
    },
    {
      title: t('dashboard.underReview'),
      value: stats.underReview,
      icon: Eye,
      change: stats.underReview,
      changeLabel: i18n.language === 'ar' ? 'قيد المراجعة' : 'in review',
      link: '/reviews',
    },
    {
      title: i18n.language === 'ar' ? 'مكتملة' : 'Completed',
      value: stats.completedCount,
      icon: CheckCircle,
      change: completionRate + '%',
      changeLabel: i18n.language === 'ar' ? 'معدل الإنجاز' : 'completion rate',
      link: '/incoming?status=closed',
    },
    {
      title: i18n.language === 'ar' ? 'مسودات' : 'Drafts',
      value: stats.draftCount,
      icon: FileCheck,
      change: stats.draftCount,
      changeLabel: i18n.language === 'ar' ? 'غير منشورة' : 'unpublished',
      link: '/incoming?status=draft',
    },
    {
      title: i18n.language === 'ar' ? 'تم الرد عليها' : 'Replied',
      value: stats.repliedCount,
      icon: MessageSquare,
      change: stats.repliedCount,
      changeLabel: i18n.language === 'ar' ? 'مع ردود' : 'with replies',
      link: '/incoming?status=replied',
    },
    {
      title: t('dashboard.totalEntities'),
      value: stats.totalEntities,
      icon: Building2,
      change: stats.totalEntities,
      changeLabel: i18n.language === 'ar' ? 'جهة نشطة' : 'active entities',
      link: '/entities',
    },
    {
      title: t('dashboard.totalUsers'),
      value: stats.totalUsers,
      icon: Users,
      change: stats.totalUsers,
      changeLabel: i18n.language === 'ar' ? 'مستخدم نشط' : 'active users',
      link: '/users',
    },
    {
      title: i18n.language === 'ar' ? 'هذا الأسبوع' : 'This Week',
      value: stats.thisWeekCount,
      icon: Calendar,
      change: stats.thisWeekCount,
      changeLabel: i18n.language === 'ar' ? 'مكاتبة جديدة' : 'new correspondences',
      link: '/incoming',
    },
    {
      title: i18n.language === 'ar' ? 'اليوم' : 'Today',
      value: stats.todayCount,
      icon: Activity,
      change: stats.todayCount,
      changeLabel: i18n.language === 'ar' ? 'مكاتبة جديدة' : 'new today',
      link: '/incoming',
    },
  ];

  const statusColors: Record<string, string> = {
    draft: '#6b7280',
    sent: 'var(--JKqx2, #1e293b)',
    received: '#4ade80',
    under_review: '#f59e0b',
    replied: '#f31415',
    closed: '#ef4444',
  };

  const activityCardThemes = [
    { bg: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)', border: '#93c5fd', iconBg: '#bfdbfe', iconColor: '#1d4ed8' },
    { bg: 'linear-gradient(135deg, #ecfeff 0%, #cffafe 100%)', border: '#67e8f9', iconBg: '#a5f3fc', iconColor: '#0e7490' },
    { bg: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)', border: '#fdba74', iconBg: '#fed7aa', iconColor: '#c2410c' },
  ];

  const quickActionThemes = [
    { bg: 'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)', border: '#a5b4fc', icon: '#4338ca', text: '#1f2937' },
    { bg: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)', border: '#c4b5fd', icon: '#6d28d9', text: '#1f2937' },
    { bg: 'linear-gradient(135deg, #ecfeff 0%, #cffafe 100%)', border: '#67e8f9', icon: '#0e7490', text: '#1f2937' },
    { bg: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)', border: '#86efac', icon: '#15803d', text: '#1f2937' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <img
            src={logoImage}
            alt={i18n.language === 'ar' ? 'شعار الشركة' : 'Company logo'}
            className="h-12 w-12 rounded-full object-cover"
            style={{ boxShadow: '0 0 0 2px rgba(15,23,42,0.12)' }}
          />
          <div>
            <h1 className="text-3xl font-bold text-black">
              {t('dashboard.title')}
            </h1>
            <p className="text-sm mt-0.5" style={{ color: goldDim }}>
              الشركة القابضة للصناعات الغدائية
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate('/reports')}
          className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200"
          style={{
            background: 'rgba(201,168,76,0.08)',
            border: '1px solid rgba(201,168,76,0.2)',
            color: gold,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(201,168,76,0.15)';
            e.currentTarget.style.borderColor = 'rgba(201,168,76,0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(201,168,76,0.08)';
            e.currentTarget.style.borderColor = 'rgba(201,168,76,0.2)';
          }}
        >
          {i18n.language === 'ar' ? 'عرض التقارير' : 'View Reports'}
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      {/* Stat Cards Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          const theme = premiumCardThemes[index % premiumCardThemes.length];
          return (
            <div
              key={index}
              className="group cursor-pointer rounded-2xl p-5 transition-all duration-300"
              style={{
                background: theme.bg,
                border: `1px solid ${theme.border}`,
              }}
              onClick={() => card.link && navigate(card.link)}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = theme.iconColor;
                e.currentTarget.style.boxShadow = `0 10px 24px color-mix(in srgb, ${theme.iconColor} 22%, transparent)`;
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = theme.border;
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold" style={{ color: theme.titleColor }}>
                  {card.title}
                </span>
                <div
                  className="flex items-center justify-center rounded-lg p-2 transition-transform duration-300 group-hover:scale-110"
                  style={{ background: theme.iconBg }}
                >
                  <Icon className="h-5 w-5" style={{ color: theme.iconColor }} />
                </div>
              </div>
              <div className="flex items-baseline justify-between">
                <div className="text-3xl font-bold" style={{ color: theme.valueColor }}>
                  {card.value}
                </div>
                {card.change !== undefined && (
                  <div className="text-right">
                    <div className="text-sm font-semibold" style={{ color: theme.metaColor }}>
                      {card.change}
                    </div>
                    <div className="text-[11px]" style={{ color: theme.metaSubColor }}>
                      {card.changeLabel}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Status Breakdown & Activity */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Status Distribution */}
        <div
          className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-6"
          style={{ boxShadow: '0 8px 24px rgba(15,23,42,0.04)' }}
        >
          <div className="flex items-center gap-2 mb-5">
            <div className="rounded-lg bg-blue-100 p-2">
              <TrendingUp className="h-5 w-5 text-blue-700" />
            </div>
            <h3 className="text-base font-bold text-black">
              {i18n.language === 'ar' ? 'توزيع الحالات' : 'Status Distribution'}
            </h3>
          </div>
          <div className="space-y-4">
            {Object.entries(stats.statusBreakdown || {}).map(([status, count]) => {
              const percentage = stats.totalCorrespondences > 0
                ? ((count / stats.totalCorrespondences) * 100).toFixed(1)
                : '0';
              const color = statusColors[status] || gold;
              return (
                <div key={status} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold capitalize text-black">
                      {status.replace('_', ' ')}
                    </span>
                    <span className="font-medium text-slate-700">
                      {count} ({percentage}%)
                    </span>
                  </div>
                  <div
                    className="w-full rounded-full h-2"
                    style={{ background: '#e2e8f0' }}
                  >
                    <div
                      className="h-2 rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%`, background: color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Activity */}
        <div
          className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-6"
          style={{ boxShadow: '0 8px 24px rgba(15,23,42,0.04)' }}
        >
          <div className="flex items-center gap-2 mb-5">
            <div className="rounded-lg bg-violet-100 p-2">
              <Activity className="h-5 w-5 text-violet-700" />
            </div>
            <h3 className="text-base font-bold text-black">
              {i18n.language === 'ar' ? 'النشاط الأخير' : 'Recent Activity'}
            </h3>
          </div>
          <div className="space-y-3">
            {[
              {
                icon: Calendar,
                label: i18n.language === 'ar' ? 'اليوم' : 'Today',
                sub: `${stats.todayCount} ${i18n.language === 'ar' ? 'مكاتبة جديدة' : 'new correspondences'}`,
                value: stats.todayCount,
              },
              {
                icon: TrendingUp,
                label: i18n.language === 'ar' ? 'هذا الأسبوع' : 'This Week',
                sub: `${stats.thisWeekCount} ${i18n.language === 'ar' ? 'مكاتبة جديدة' : 'new correspondences'}`,
                value: stats.thisWeekCount,
              },
              {
                icon: Archive,
                label: i18n.language === 'ar' ? 'هذا الشهر' : 'This Month',
                sub: `${stats.thisMonthCount} ${i18n.language === 'ar' ? 'مكاتبة جديدة' : 'new correspondences'}`,
                value: stats.thisMonthCount,
              },
            ].map((item, idx) => {
              const Icon = item.icon;
              const theme = activityCardThemes[idx % activityCardThemes.length];
              return (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-xl border p-3 transition-all duration-200 hover:-translate-y-0.5"
                  style={{
                    background: theme.bg,
                    borderColor: theme.border,
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="flex items-center justify-center rounded-lg p-2"
                      style={{ background: theme.iconBg }}
                    >
                      <Icon className="h-4 w-4" style={{ color: theme.iconColor }} />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-black">
                        {item.label}
                      </div>
                      <div className="text-xs text-slate-700">
                        {item.sub}
                      </div>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-black">
                    {item.value}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div
        className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-6"
        style={{ boxShadow: '0 8px 24px rgba(15,23,42,0.04)' }}
      >
        <div className="flex items-center gap-2 mb-5">
          <div className="rounded-lg bg-emerald-100 p-2">
            <Activity className="h-5 w-5 text-emerald-700" />
          </div>
          <h3 className="text-base font-bold text-black">
            {i18n.language === 'ar' ? 'إجراءات سريعة' : 'Quick Actions'}
          </h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: FileText, label: t('nav.create'), path: '/create' },
            { icon: Eye, label: t('nav.reviews'), path: '/reviews' },
            { icon: TrendingUp, label: t('nav.reports'), path: '/reports' },
            { icon: Building2, label: t('nav.entities'), path: '/entities' },
          ].map((action, idx) => {
            const Icon = action.icon;
            const theme = quickActionThemes[idx % quickActionThemes.length];
            return (
              <button
                key={idx}
                onClick={() => navigate(action.path)}
                className="flex h-20 flex-col items-center justify-center gap-2 rounded-xl border transition-all duration-200"
                style={{
                  background: theme.bg,
                  borderColor: theme.border,
                  color: theme.icon,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = theme.icon;
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = `0 8px 18px color-mix(in srgb, ${theme.icon} 20%, transparent)`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = theme.border;
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <Icon className="h-6 w-6" />
                <span className="text-sm font-semibold" style={{ color: theme.text }}>
                  {action.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
