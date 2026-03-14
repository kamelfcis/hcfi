import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import api from '@/lib/api';
import { usePermissions } from '@/hooks/usePermissions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Search, Filter, X, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'react-toastify';

interface Correspondence {
  id: number;
  reference_number: string;
  correspondence_number?: string;
  type: 'incoming' | 'outgoing';
  correspondence_method?: 'hand' | 'computer';
  subject: string;
  specialized_branch?: string;
  responsible_person?: string;
  correspondence_date: string;
  current_status: string;
  review_status: string;
  storage_location?: string;
  senderEntity: { id: number; name_ar: string };
  receiverEntity: { id: number; name_ar: string };
}

interface Entity {
  id: number;
  name_ar: string;
}

interface CorrespondenceListProps {
  defaultType?: 'incoming' | 'outgoing';
}

export default function CorrespondenceList({ defaultType }: CorrespondenceListProps) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { hasPermission } = usePermissions();
  
  // Determine type from route if not provided
  const routeType = location.pathname === '/incoming' ? 'incoming' : location.pathname === '/outgoing' ? 'outgoing' : defaultType || '';
  
  const [correspondences, setCorrespondences] = useState<Correspondence[]>([]);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(true);
  const [entitiesLoading, setEntitiesLoading] = useState(true);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1, limit: 10 });
  const [filters, setFilters] = useState({
    type: routeType || searchParams.get('type') || '',
    status: searchParams.get('status') || '',
    review_status: searchParams.get('review_status') || '',
    search: searchParams.get('search') || '',
    sender_entity_id: searchParams.get('sender_entity_id') || '',
    receiver_entity_id: searchParams.get('receiver_entity_id') || '',
    start_date: searchParams.get('start_date') || '',
    end_date: searchParams.get('end_date') || '',
    page: parseInt(searchParams.get('page') || '1'),
  });

  // Fetch entities for filters
  useEffect(() => {
    const fetchEntities = async () => {
      try {
        const response = await api.get('/entities?limit=1000'); // Get all entities for dropdown
        // Handle both old format (array) and new format (object with data property)
        const entitiesData = Array.isArray(response.data) 
          ? response.data 
          : (response.data.data || []);
        setEntities(entitiesData);
      } catch (error) {
        console.error('Failed to fetch entities:', error);
      } finally {
        setEntitiesLoading(false);
      }
    };
    fetchEntities();
  }, []);

  // Update filters when route changes
  useEffect(() => {
    const newRouteType = location.pathname === '/incoming' ? 'incoming' : location.pathname === '/outgoing' ? 'outgoing' : defaultType || '';
    if (newRouteType && filters.type !== newRouteType) {
      setFilters((prev) => ({ ...prev, type: newRouteType, page: 1 }));
    }
  }, [location.pathname, defaultType]);

  useEffect(() => {
    fetchCorrespondences();
  }, [filters]);

  const fetchCorrespondences = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.type) params.append('type', filters.type);
      if (filters.status) params.append('status', filters.status);
      if (filters.review_status) params.append('review_status', filters.review_status);
      if (filters.search) params.append('search', filters.search);
      if (filters.sender_entity_id) params.append('sender_entity_id', filters.sender_entity_id);
      if (filters.receiver_entity_id) params.append('receiver_entity_id', filters.receiver_entity_id);
      if (filters.start_date) params.append('start_date', filters.start_date);
      if (filters.end_date) params.append('end_date', filters.end_date);
      params.append('page', filters.page.toString());
      params.append('limit', pagination.limit.toString());

      const response = await api.get(`/correspondences?${params}`);
      setCorrespondences(response.data.data);
      setPagination(response.data.pagination);
      
      // Update URL params
      const newParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value && key !== 'page') newParams.set(key, value.toString());
      });
      if (filters.page > 1) newParams.set('page', filters.page.toString());
      setSearchParams(newParams);
    } catch (error) {
      console.error('Failed to fetch correspondences:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const clearFilters = () => {
    const clearedFilters = {
      type: routeType || '',
      status: '',
      review_status: '',
      search: '',
      sender_entity_id: '',
      receiver_entity_id: '',
      start_date: '',
      end_date: '',
      page: 1,
    };
    setFilters(clearedFilters);
    setSearchParams(new URLSearchParams());
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-800',
      sent: 'bg-blue-100 text-blue-800',
      received: 'bg-green-100 text-green-800',
      under_review: 'bg-yellow-100 text-yellow-800',
      replied: 'bg-cyan-100 text-cyan-800',
      closed: 'bg-emerald-100 text-emerald-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const handleDeleteCorrespondence = async (correspondenceId: number) => {
    if (!confirm(t('correspondence.confirmDelete'))) return;

    try {
      await api.delete(`/correspondences/${correspondenceId}`);
      toast.success(t('correspondence.deleted'));
      setCorrespondences((prev) => prev.filter((c) => c.id !== correspondenceId));
      setPagination((prev) => ({ ...prev, total: Math.max(0, prev.total - 1) }));
      fetchCorrespondences();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to delete correspondence');
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          {t('correspondence.title')}
        </h1>
        {hasPermission('correspondence:create') && (
          <Button onClick={() => navigate('/create')} className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600">
            <Plus className="mr-2 h-4 w-4" />
            {t('correspondence.create')}
          </Button>
        )}
      </div>

      {/* Advanced Filters Card */}
      <Card className="mb-6 border-2 border-blue-200 dark:border-blue-800 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              {i18n.language === 'ar' ? 'التصفية والبحث' : 'Filters & Search'}
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              >
                {showAdvancedFilters ? (
                  <>
                    <ChevronUp className="mr-2 h-4 w-4" />
                    {i18n.language === 'ar' ? 'إخفاء' : 'Hide'}
                  </>
                ) : (
                  <>
                    <ChevronDown className="mr-2 h-4 w-4" />
                    {i18n.language === 'ar' ? 'عرض متقدم' : 'Advanced'}
                  </>
                )}
              </Button>
              {(filters.search || filters.status || filters.review_status || filters.sender_entity_id || filters.receiver_entity_id || filters.start_date || filters.end_date) && (
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  <X className="mr-2 h-4 w-4" />
                  {i18n.language === 'ar' ? 'مسح' : 'Clear'}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Basic Filters */}
          <div className="grid gap-4 md:grid-cols-4 mb-4">
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
              <option value="">{i18n.language === 'ar' ? 'جميع الأنواع' : 'All Types'}</option>
              <option value="incoming">{t('correspondence.incoming')}</option>
              <option value="outgoing">{t('correspondence.outgoing')}</option>
            </Select>
            <Select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <option value="">{i18n.language === 'ar' ? 'جميع الحالات' : 'All Statuses'}</option>
              <option value="draft">{t('correspondence.draft')}</option>
              <option value="sent">{t('correspondence.sent')}</option>
              <option value="received">{t('correspondence.received')}</option>
              <option value="under_review">{t('correspondence.underReview')}</option>
              <option value="replied">{t('correspondence.replied')}</option>
              <option value="closed">{t('correspondence.closed')}</option>
            </Select>
            <Select
              value={filters.review_status}
              onChange={(e) => handleFilterChange('review_status', e.target.value)}
            >
              <option value="">{i18n.language === 'ar' ? 'حالة المراجعة' : 'Review Status'}</option>
              <option value="reviewed">{t('correspondence.reviewed')}</option>
              <option value="not_reviewed">{t('correspondence.notReviewed')}</option>
            </Select>
          </div>

          {/* Advanced Filters */}
          {showAdvancedFilters && (
            <div className="grid gap-4 md:grid-cols-4 pt-4 border-t">
              <Select
                value={filters.sender_entity_id}
                onChange={(e) => handleFilterChange('sender_entity_id', e.target.value)}
                disabled={entitiesLoading}
              >
                <option value="">{i18n.language === 'ar' ? 'الجهة المرسلة' : 'Sender Entity'}</option>
                {entities.map((entity) => (
                  <option key={entity.id} value={entity.id.toString()}>
                    {entity.name_ar}
                  </option>
                ))}
              </Select>
              <Select
                value={filters.receiver_entity_id}
                onChange={(e) => handleFilterChange('receiver_entity_id', e.target.value)}
                disabled={entitiesLoading}
              >
                <option value="">{i18n.language === 'ar' ? 'الجهة المستقبلة' : 'Receiver Entity'}</option>
                {entities.map((entity) => (
                  <option key={entity.id} value={entity.id.toString()}>
                    {entity.name_ar}
                  </option>
                ))}
              </Select>
              <Input
                type="date"
                value={filters.start_date}
                onChange={(e) => handleFilterChange('start_date', e.target.value)}
                placeholder={i18n.language === 'ar' ? 'من تاريخ' : 'From Date'}
              />
              <Input
                type="date"
                value={filters.end_date}
                onChange={(e) => handleFilterChange('end_date', e.target.value)}
                placeholder={i18n.language === 'ar' ? 'إلى تاريخ' : 'To Date'}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results */}
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
      ) : correspondences.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">{t('correspondence.noResults')}</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-4">
            {correspondences.map((corr) => (
              <Card
                key={corr.id}
                className="cursor-pointer hover:shadow-lg transition-all border-2 hover:border-blue-300 dark:hover:border-blue-700"
                onClick={() => navigate(`/correspondences/${corr.id}`)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <h3 className="text-lg font-semibold">{corr.subject}</h3>
                        <span className="rounded-full bg-gradient-to-r from-blue-500 to-purple-500 px-3 py-1 text-xs font-semibold text-white">
                          {corr.reference_number}
                        </span>
                        {corr.correspondence_number && (
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                            {corr.correspondence_number}
                          </span>
                        )}
                        <span className={`rounded-full border px-2 py-1 text-xs ${getStatusColor(corr.current_status)}`}>
                          {t(`correspondence.${corr.current_status}`)}
                        </span>
                        {corr.review_status === 'not_reviewed' && (
                          <span className="rounded-full bg-orange-100 text-orange-800 border border-orange-300 px-2 py-1 text-xs">
                            {t('correspondence.notReviewed')}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {`${corr.senderEntity.name_ar} → ${corr.receiverEntity.name_ar}`}
                      </p>
                      <div className="flex gap-4 text-xs text-muted-foreground">
                        <span>{format(new Date(corr.correspondence_date), 'yyyy-MM-dd')}</span>
                        <span>{t(`correspondence.${corr.type}`)}</span>
                        {corr.correspondence_method && (
                          <span>{t(`correspondence.${corr.correspondence_method}`)}</span>
                        )}
                        {corr.specialized_branch && (
                          <span>{corr.specialized_branch}</span>
                        )}
                        {corr.responsible_person && (
                          <span>{corr.responsible_person}</span>
                        )}
                        {corr.storage_location && (
                          <span>مكان الحفظ: {corr.storage_location}</span>
                        )}
                      </div>
                    </div>
                    {hasPermission('correspondence:delete') && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-muted-foreground hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCorrespondence(corr.id);
                        }}
                        title={t('correspondence.delete')}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
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
    </div>
  );
}
