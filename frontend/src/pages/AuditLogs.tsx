import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { Search, Filter, FileText, User, Calendar, Activity, AlertCircle } from 'lucide-react';

interface AuditLog {
  id: number;
  action: string;
  resource: string;
  resource_id?: number;
  details?: string;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
  user: {
    id: number;
    username: string;
    full_name_ar: string;
    email: string;
  };
}

export default function AuditLogs() {
  const { t, i18n } = useTranslation();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    action: '',
    resource: '',
  });
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });

  useEffect(() => {
    fetchLogs();
  }, [filters, pagination.page]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.action) params.append('action', filters.action);
      if (filters.resource) params.append('resource', filters.resource);
      params.append('page', pagination.page.toString());
      params.append('limit', '20');

      const response = await api.get(`/audit-logs?${params}`);
      setLogs(response.data.data || []);
      if (response.data.pagination) {
        setPagination(response.data.pagination);
      }
    } catch (error: any) {
      if (error.response?.status === 403) {
        toast.error(i18n.language === 'ar' ? 'ليس لديك صلاحية لعرض سجلات التدقيق' : 'You do not have permission to view audit logs');
      } else {
        toast.error(i18n.language === 'ar' ? 'فشل تحميل سجلات التدقيق' : 'Failed to load audit logs');
      }
    } finally {
      setLoading(false);
    }
  };

  const getActionColor = (action: string) => {
    const colors: Record<string, string> = {
      create: 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900 dark:text-green-200',
      update: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900 dark:text-blue-200',
      delete: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900 dark:text-red-200',
      review: 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900 dark:text-orange-200',
      upload: 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900 dark:text-purple-200',
      login: 'bg-cyan-100 text-cyan-800 border-cyan-300 dark:bg-cyan-900 dark:text-cyan-200',
    };
    return colors[action] || 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-900 dark:text-gray-200';
  };

  const getResourceIcon = (resource: string) => {
    switch (resource) {
      case 'correspondence':
        return FileText;
      case 'user':
        return User;
      case 'entity':
        return Activity;
      default:
        return FileText;
    }
  };

  if (loading && logs.length === 0) {
    return (
      <div>
        <h1 className="mb-6 text-3xl font-bold">{i18n.language === 'ar' ? 'سجلات التدقيق' : 'Audit Logs'}</h1>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="mt-2 h-4 w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          {i18n.language === 'ar' ? 'سجلات التدقيق' : 'Audit Logs'}
        </h1>
        <p className="text-muted-foreground mt-2">
          {i18n.language === 'ar' 
            ? 'سجل كامل لجميع الأنشطة والعمليات في النظام' 
            : 'Complete log of all activities and operations in the system'}
        </p>
      </div>

      {/* Filters */}
      <Card className="border-2 border-indigo-200 dark:border-indigo-800 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950 dark:to-purple-950">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            {i18n.language === 'ar' ? 'التصفية' : 'Filters'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={i18n.language === 'ar' ? 'بحث...' : 'Search...'}
                value={filters.search}
                onChange={(e) => {
                  setFilters({ ...filters, search: e.target.value });
                  setPagination({ ...pagination, page: 1 });
                }}
                className="pl-10"
              />
            </div>
            <Select
              value={filters.action}
              onChange={(e) => {
                setFilters({ ...filters, action: e.target.value });
                setPagination({ ...pagination, page: 1 });
              }}
            >
              <option value="">{i18n.language === 'ar' ? 'جميع الإجراءات' : 'All Actions'}</option>
              <option value="create">{i18n.language === 'ar' ? 'إنشاء' : 'Create'}</option>
              <option value="update">{i18n.language === 'ar' ? 'تحديث' : 'Update'}</option>
              <option value="delete">{i18n.language === 'ar' ? 'حذف' : 'Delete'}</option>
              <option value="review">{i18n.language === 'ar' ? 'مراجعة' : 'Review'}</option>
              <option value="upload">{i18n.language === 'ar' ? 'رفع' : 'Upload'}</option>
              <option value="login">{i18n.language === 'ar' ? 'تسجيل دخول' : 'Login'}</option>
            </Select>
            <Select
              value={filters.resource}
              onChange={(e) => {
                setFilters({ ...filters, resource: e.target.value });
                setPagination({ ...pagination, page: 1 });
              }}
            >
              <option value="">{i18n.language === 'ar' ? 'جميع الموارد' : 'All Resources'}</option>
              <option value="correspondence">{i18n.language === 'ar' ? 'مكاتبة' : 'Correspondence'}</option>
              <option value="user">{i18n.language === 'ar' ? 'مستخدم' : 'User'}</option>
              <option value="entity">{i18n.language === 'ar' ? 'جهة' : 'Entity'}</option>
              <option value="attachment">{i18n.language === 'ar' ? 'مرفق' : 'Attachment'}</option>
            </Select>
            <Button
              variant="outline"
              onClick={() => {
                setFilters({ search: '', action: '', resource: '' });
                setPagination({ ...pagination, page: 1 });
              }}
            >
              {i18n.language === 'ar' ? 'مسح' : 'Clear'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Logs List */}
      {logs.length === 0 ? (
        <Card className="border-2 border-dashed">
          <CardContent className="p-12 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-muted-foreground">
              {i18n.language === 'ar' ? 'لا توجد سجلات' : 'No logs found'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-4">
            {logs.map((log) => {
              const ResourceIcon = getResourceIcon(log.resource);
              return (
                <Card
                  key={log.id}
                  className="border-2 border-indigo-200 dark:border-indigo-800 hover:shadow-lg transition-all bg-gradient-to-r from-indigo-50/50 to-purple-50/50 dark:from-indigo-950/50 dark:to-purple-950/50"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 shadow-md`}>
                        <ResourceIcon className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-4 flex-wrap">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap mb-2">
                              <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${getActionColor(log.action)}`}>
                                {log.action.toUpperCase()}
                              </span>
                              <span className="rounded-full bg-indigo-100 text-indigo-800 border border-indigo-300 dark:bg-indigo-900 dark:text-indigo-200 px-2 py-1 text-xs font-medium">
                                {log.resource}
                              </span>
                              {log.resource_id && (
                                <span className="text-xs text-muted-foreground">
                                  ID: {log.resource_id}
                                </span>
                              )}
                            </div>
                            <div className="space-y-1">
                              <p className="text-sm">
                                <span className="font-medium">{i18n.language === 'ar' ? 'المستخدم:' : 'User:'}</span>{' '}
                                {log.user.full_name_ar} ({log.user.username})
                              </p>
                              {log.details && (
                                <p className="text-sm text-muted-foreground">
                                  <span className="font-medium">{i18n.language === 'ar' ? 'التفاصيل:' : 'Details:'}</span> {log.details}
                                </p>
                              )}
                              <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {format(new Date(log.created_at), 'yyyy-MM-dd HH:mm:ss')}
                                </div>
                                {log.ip_address && (
                                  <div>
                                    {i18n.language === 'ar' ? 'IP:' : 'IP:'} {log.ip_address}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {i18n.language === 'ar' 
                  ? `صفحة ${pagination.page} من ${pagination.pages} (${pagination.total} إجمالي)`
                  : `Page ${pagination.page} of ${pagination.pages} (${pagination.total} total)`}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                  disabled={pagination.page === 1}
                >
                  {i18n.language === 'ar' ? 'السابق' : 'Previous'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                  disabled={pagination.page >= pagination.pages}
                >
                  {i18n.language === 'ar' ? 'التالي' : 'Next'}
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

