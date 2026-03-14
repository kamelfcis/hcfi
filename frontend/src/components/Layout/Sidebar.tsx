import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { usePermissions } from '@/hooks/usePermissions';
import {
  LayoutDashboard,
  Files,
  Inbox,
  Send,
  FilePlus,
  CheckSquare,
  Building2,
  Users,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  FileSearch,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const menuItems = [
  { path: '/', icon: LayoutDashboard, label: 'nav.dashboard', permission: null },
  { path: '/correspondences', icon: Files, label: 'nav.allCorrespondences', permission: 'correspondence:read' },
  { path: '/incoming', icon: Inbox, label: 'nav.incoming', permission: 'correspondence:read' },
  { path: '/outgoing', icon: Send, label: 'nav.outgoing', permission: 'correspondence:read' },
  { path: '/create', icon: FilePlus, label: 'nav.create', permission: 'correspondence:create' },
  { path: '/reviews', icon: CheckSquare, label: 'nav.reviews', permission: 'correspondence:review' },
  { path: '/entities', icon: Building2, label: 'nav.entities', permission: 'entity:read' },
  { path: '/users', icon: Users, label: 'nav.users', permission: 'user:read' },
  { path: '/reports', icon: BarChart3, label: 'nav.reports', permission: 'report:read' },
  { path: '/audit-logs', icon: FileSearch, label: 'nav.auditLogs', permission: 'audit:read' },
  { path: '/settings', icon: Settings, label: 'nav.settings', permission: null },
];

export default function Sidebar() {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const { user } = useAuthStore();
  const { hasPermission } = usePermissions();
  const [collapsed, setCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebarCollapsed');
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', JSON.stringify(collapsed));
  }, [collapsed]);

  const filteredItems = menuItems.filter((item) => hasPermission(item.permission));

  const ChevronIcon = i18n.language === 'ar' ? ChevronRight : ChevronLeft;
  const ChevronIconCollapsed = i18n.language === 'ar' ? ChevronLeft : ChevronRight;

  return (
    <aside
      className={cn(
        'border-r border-slate-200 bg-white transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="flex h-14 items-center justify-between border-b border-slate-200 px-3">
          {!collapsed && (
            <span className="truncate text-sm font-semibold text-slate-600">
              {t('app.name')}
            </span>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex items-center justify-center rounded-md p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
            style={{ marginInlineStart: collapsed ? 'auto' : undefined, marginInlineEnd: collapsed ? 'auto' : undefined }}
          >
            {collapsed ? (
              <ChevronIconCollapsed className="h-4 w-4" />
            ) : (
              <ChevronIcon className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-2">
          {filteredItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path}>
                <div
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                    collapsed && 'justify-center px-2'
                  )}
                  style={
                    isActive
                      ? {
                          background: '#f1f5f9',
                          color: '#0f172a',
                          borderInlineStart: '3px solid #64748b',
                        }
                      : {
                          color: '#475569',
                        }
                  }
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = '#f8fafc';
                      e.currentTarget.style.color = '#1e293b';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = '#475569';
                    }
                  }}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  {!collapsed && <span className="truncate">{t(item.label)}</span>}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Bottom decorative line */}
        <div className="p-3">
          <div className="h-px bg-slate-200" />
        </div>
      </div>
    </aside>
  );
}
