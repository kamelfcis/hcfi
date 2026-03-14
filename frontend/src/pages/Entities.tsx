import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '@/lib/api';
import { usePermissions } from '@/hooks/usePermissions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'react-toastify';
import { Plus, Edit, Trash2, Search, Filter, X } from 'lucide-react';
import EntityModal from '@/components/EntityModal';

interface Entity {
  id: number;
  name_ar: string;
  type: string;
  contact_person?: string;
  contact_email?: string;
  contact_phone?: string;
  is_active: boolean;
}

export default function Entities() {
  const { t, i18n } = useTranslation();
  const { hasPermission } = usePermissions();
  const [entities, setEntities] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1, limit: 10 });
  const [filters, setFilters] = useState({
    search: '',
    type: '',
    is_active: '',
    page: 1,
  });

  useEffect(() => {
    fetchEntities();
  }, [filters]);

  const fetchEntities = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.type) params.append('type', filters.type);
      if (filters.is_active) params.append('is_active', filters.is_active);
      params.append('page', filters.page.toString());
      params.append('limit', pagination.limit.toString());

      const response = await api.get(`/entities?${params}`);
      setEntities(response.data.data || response.data);
      if (response.data.pagination) {
        setPagination(response.data.pagination);
      }
    } catch (error) {
      toast.error(i18n.language === 'ar' ? 'فشل تحميل الجهات' : 'Failed to load entities');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm(i18n.language === 'ar' ? 'هل أنت متأكد من الحذف؟' : 'Are you sure you want to delete?')) {
      return;
    }
    try {
      await api.delete(`/entities/${id}`);
      toast.success(i18n.language === 'ar' ? 'تم الحذف بنجاح' : 'Deleted successfully');
      fetchEntities();
    } catch (error) {
      toast.error(i18n.language === 'ar' ? 'فشل الحذف' : 'Failed to delete entity');
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const clearFilters = () => {
    setFilters({ search: '', type: '', is_active: '', page: 1 });
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          {t('nav.entities')}
        </h1>
        {hasPermission('entity:create') && (
          <Button onClick={() => {
            setSelectedEntity(null);
            setModalOpen(true);
          }} className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600">
            <Plus className="mr-2 h-4 w-4" />
            {i18n.language === 'ar' ? 'إنشاء جهة' : 'Create Entity'}
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card className="mb-6 border-2 border-indigo-200 dark:border-indigo-800 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950 dark:to-purple-950">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              {i18n.language === 'ar' ? 'التصفية والبحث' : 'Filters & Search'}
            </CardTitle>
            {(filters.search || filters.type || filters.is_active) && (
              <Button variant="outline" size="sm" onClick={clearFilters}>
                <X className="mr-2 h-4 w-4" />
                {i18n.language === 'ar' ? 'مسح' : 'Clear'}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('correspondence.search')}
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="pl-9"
              />
            </div>
            <Select
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
            >
              <option value="">جميع الأنواع</option>
              <option value="قيادة_عامة">قيادة عامة</option>
              <option value="فرع_رئيسي">فرع رئيسي</option>
              <option value="قيادة_استراتيجية">قيادة استراتيجية</option>
              <option value="هيئة_رئيسية">هيئة رئيسية</option>
              <option value="إدارة_رئيسية">إدارة رئيسية</option>
              <option value="جهة_تابعة">جهة تابعة</option>
            </Select>
            <Select
              value={filters.is_active}
              onChange={(e) => handleFilterChange('is_active', e.target.value)}
            >
              <option value="">{i18n.language === 'ar' ? 'جميع الحالات' : 'All Statuses'}</option>
              <option value="true">{i18n.language === 'ar' ? 'نشط' : 'Active'}</option>
              <option value="false">{i18n.language === 'ar' ? 'غير نشط' : 'Inactive'}</option>
            </Select>
          </div>
        </CardContent>
      </Card>

      {loading ? (
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
      ) : entities.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">{t('correspondence.noResults')}</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-4">
            {entities.map((entity) => (
              <Card key={entity.id} className="border-2 hover:shadow-lg transition-all">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold">
                        {entity.name_ar}
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        النوع: {entity.type?.replace('_', ' ')}
                      </p>
                      {entity.contact_email && (
                        <p className="mt-1 text-sm text-muted-foreground">{entity.contact_email}</p>
                      )}
                      <span
                        className={`mt-2 inline-block rounded-full px-2 py-1 text-xs ${
                          entity.is_active
                            ? 'bg-green-100 text-green-800 border border-green-300'
                            : 'bg-red-100 text-red-800 border border-red-300'
                        }`}
                      >
                        {entity.is_active ? (i18n.language === 'ar' ? 'نشط' : 'Active') : (i18n.language === 'ar' ? 'غير نشط' : 'Inactive')}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      {hasPermission('entity:update') && (
                        <Button variant="outline" size="sm" onClick={() => {
                          setSelectedEntity(entity);
                          setModalOpen(true);
                        }}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                      {hasPermission('entity:delete') && (
                        <Button variant="destructive" size="sm" onClick={() => handleDelete(entity.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {i18n.language === 'ar' 
                  ? `صفحة ${pagination.page} من ${pagination.pages} (${pagination.total} إجمالي)`
                  : `Page ${pagination.page} of ${pagination.pages} (${pagination.total} total)`}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  disabled={filters.page === 1}
                  onClick={() => setFilters((prev) => ({ ...prev, page: prev.page - 1 }))}
                >
                  {i18n.language === 'ar' ? 'السابق' : 'Previous'}
                </Button>
                <span className="flex items-center px-4 text-sm">
                  {filters.page} / {pagination.pages}
                </span>
                <Button
                  variant="outline"
                  disabled={filters.page >= pagination.pages}
                  onClick={() => setFilters((prev) => ({ ...prev, page: prev.page + 1 }))}
                >
                  {i18n.language === 'ar' ? 'التالي' : 'Next'}
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      <EntityModal
        entity={selectedEntity}
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedEntity(null);
        }}
        onSuccess={fetchEntities}
      />
    </div>
  );
}
