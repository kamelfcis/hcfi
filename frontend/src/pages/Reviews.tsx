import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { Eye, CheckCircle, Search, Filter, Clock, FileText, AlertCircle } from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';

interface Correspondence {
  id: number;
  reference_number: string;
  subject: string;
  type: 'incoming' | 'outgoing';
  correspondence_date: string;
  current_status: string;
  review_status: string;
  senderEntity: { name_ar: string };
  receiverEntity: { name_ar: string };
  creator: { full_name_ar: string };
}

type ReviewTab = 'pending' | 'reviewed' | 'all';

export default function Reviews() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const [correspondences, setCorrespondences] = useState<Correspondence[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ReviewTab>('pending');
  const [filters, setFilters] = useState({
    search: '',
    type: '',
    status: '',
  });
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  useEffect(() => {
    fetchReviews();
  }, [activeTab, filters, pagination.page]);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeTab === 'pending') {
        params.append('review_status', 'not_reviewed');
      } else if (activeTab === 'reviewed') {
        params.append('review_status', 'reviewed');
      }
      if (filters.type) params.append('type', filters.type);
      if (filters.status) params.append('status', filters.status);
      if (filters.search) params.append('search', filters.search);
      params.append('page', pagination.page.toString());
      params.append('limit', '10');

      const response = await api.get(`/correspondences?${params}`);
      setCorrespondences(response.data.data || response.data);
      if (response.data.pagination) {
        setPagination(response.data.pagination);
      }
    } catch (error) {
      toast.error(i18n.language === 'ar' ? 'فشل تحميل المراجعات' : 'Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (id: number) => {
    try {
      await api.post(`/correspondences/${id}/review`);
      toast.success(i18n.language === 'ar' ? 'تمت المراجعة بنجاح' : 'Reviewed successfully');
      fetchReviews();
      setSelectedIds([]);
    } catch (error: any) {
      toast.error(error.response?.data?.error || (i18n.language === 'ar' ? 'فشل المراجعة' : 'Failed to review'));
    }
  };

  const handleBulkReview = async () => {
    if (selectedIds.length === 0) {
      toast.warning(i18n.language === 'ar' ? 'يرجى اختيار مكاتبات للمراجعة' : 'Please select correspondences to review');
      return;
    }

    try {
      await Promise.all(selectedIds.map(id => api.post(`/correspondences/${id}/review`)));
      toast.success(i18n.language === 'ar' ? `تمت مراجعة ${selectedIds.length} مكاتبة بنجاح` : `Successfully reviewed ${selectedIds.length} correspondences`);
      fetchReviews();
      setSelectedIds([]);
    } catch (error: any) {
      toast.error(error.response?.data?.error || (i18n.language === 'ar' ? 'فشل المراجعة' : 'Failed to review'));
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => 
      prev.includes(id) 
        ? prev.filter(selectedId => selectedId !== id)
        : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === correspondences.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(correspondences.map(c => c.id));
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-800 border-gray-300',
      sent: 'bg-blue-100 text-blue-800 border-blue-300',
      received: 'bg-green-100 text-green-800 border-green-300',
      under_review: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      replied: 'bg-cyan-100 text-cyan-800 border-cyan-300',
      closed: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  if (loading && correspondences.length === 0) {
    return (
      <div>
        <h1 className="mb-6 text-3xl font-bold">{t('nav.reviews')}</h1>
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
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
          {t('nav.reviews')}
        </h1>
        {selectedIds.length > 0 && hasPermission('correspondence:review') && (
          <Button onClick={handleBulkReview} className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600">
            <CheckCircle className="mr-2 h-4 w-4" />
            {i18n.language === 'ar' ? `مراجعة ${selectedIds.length} محدد` : `Review ${selectedIds.length} Selected`}
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => {
            setActiveTab('pending');
            setPagination({ ...pagination, page: 1 });
            setSelectedIds([]);
          }}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'pending'
              ? 'border-orange-500 text-orange-600 dark:text-orange-400'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            {i18n.language === 'ar' ? 'في الانتظار' : 'Pending'} ({pagination.total})
          </div>
        </button>
        <button
          onClick={() => {
            setActiveTab('reviewed');
            setPagination({ ...pagination, page: 1 });
            setSelectedIds([]);
          }}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'reviewed'
              ? 'border-green-500 text-green-600 dark:text-green-400'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            {i18n.language === 'ar' ? 'تمت المراجعة' : 'Reviewed'}
          </div>
        </button>
        <button
          onClick={() => {
            setActiveTab('all');
            setPagination({ ...pagination, page: 1 });
            setSelectedIds([]);
          }}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'all'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            {i18n.language === 'ar' ? 'الكل' : 'All'}
          </div>
        </button>
      </div>

      {/* Filters */}
      <Card className="border-2 border-orange-200 dark:border-orange-800 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950 dark:to-red-950">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            {i18n.language === 'ar' ? 'التصفية والبحث' : 'Filters & Search'}
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
              value={filters.type}
              onChange={(e) => {
                setFilters({ ...filters, type: e.target.value });
                setPagination({ ...pagination, page: 1 });
              }}
            >
              <option value="">{i18n.language === 'ar' ? 'جميع الأنواع' : 'All Types'}</option>
              <option value="incoming">{i18n.language === 'ar' ? 'وارد' : 'Incoming'}</option>
              <option value="outgoing">{i18n.language === 'ar' ? 'صادر' : 'Outgoing'}</option>
            </Select>
            <Select
              value={filters.status}
              onChange={(e) => {
                setFilters({ ...filters, status: e.target.value });
                setPagination({ ...pagination, page: 1 });
              }}
            >
              <option value="">{i18n.language === 'ar' ? 'جميع الحالات' : 'All Statuses'}</option>
              <option value="draft">{i18n.language === 'ar' ? 'مسودة' : 'Draft'}</option>
              <option value="sent">{i18n.language === 'ar' ? 'تم الإرسال' : 'Sent'}</option>
              <option value="received">{i18n.language === 'ar' ? 'تم الاستلام' : 'Received'}</option>
              <option value="under_review">{i18n.language === 'ar' ? 'قيد المراجعة' : 'Under Review'}</option>
              <option value="replied">{i18n.language === 'ar' ? 'تم الرد' : 'Replied'}</option>
              <option value="closed">{i18n.language === 'ar' ? 'مغلقة' : 'Closed'}</option>
            </Select>
            <Button
              variant="outline"
              onClick={() => {
                setFilters({ search: '', type: '', status: '' });
                setPagination({ ...pagination, page: 1 });
              }}
            >
              {i18n.language === 'ar' ? 'مسح' : 'Clear'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {correspondences.length === 0 ? (
        <Card className="border-2 border-dashed">
          <CardContent className="p-12 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-muted-foreground">{t('correspondence.noResults')}</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-4">
            {correspondences.map((corr) => (
              <Card
                key={corr.id}
                className={`border-2 transition-all hover:shadow-lg ${
                  activeTab === 'pending'
                    ? 'border-orange-200 dark:border-orange-800 bg-gradient-to-r from-orange-50 to-orange-100/50 dark:from-orange-950 dark:to-orange-900/50'
                    : activeTab === 'reviewed'
                    ? 'border-green-200 dark:border-green-800 bg-gradient-to-r from-green-50 to-green-100/50 dark:from-green-950 dark:to-green-900/50'
                    : 'border-blue-200 dark:border-blue-800'
                } ${selectedIds.includes(corr.id) ? 'ring-2 ring-primary' : ''}`}
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    {hasPermission('correspondence:review') && activeTab === 'pending' && (
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(corr.id)}
                        onChange={() => toggleSelect(corr.id)}
                        className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                    )}
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-lg font-semibold">{corr.subject}</h3>
                            <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                              corr.type === 'incoming'
                                ? 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900 dark:text-green-200'
                                : 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900 dark:text-purple-200'
                            }`}>
                              {corr.reference_number}
                            </span>
                            <span className={`rounded-full border px-2 py-1 text-xs ${getStatusColor(corr.current_status)}`}>
                              {i18n.language === 'ar' 
                                ? (corr.current_status === 'draft' ? 'مسودة' :
                                   corr.current_status === 'sent' ? 'تم الإرسال' :
                                   corr.current_status === 'received' ? 'تم الاستلام' :
                                   corr.current_status === 'under_review' ? 'قيد المراجعة' :
                                   corr.current_status === 'replied' ? 'تم الرد' :
                                   corr.current_status === 'closed' ? 'مغلقة' : corr.current_status)
                                : corr.current_status.replace('_', ' ')}
                            </span>
                          </div>
                          <div className="mt-3 space-y-1">
                            <p className="text-sm text-muted-foreground">
                              <span className="font-medium">{i18n.language === 'ar' ? 'من:' : 'From:'}</span>{' '}
                              {corr.senderEntity.name_ar}
                              {' → '}
                              <span className="font-medium">{i18n.language === 'ar' ? 'إلى:' : 'To:'}</span>{' '}
                              {corr.receiverEntity.name_ar}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {i18n.language === 'ar' ? 'تاريخ:' : 'Date:'} {format(new Date(corr.correspondence_date), 'yyyy-MM-dd')}
                              {' • '}
                              المنشئ: {corr.creator.full_name_ar}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/correspondences/${corr.id}`)}
                            className="border-blue-300 text-blue-700 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-400"
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            {t('correspondence.view', 'View')}
                          </Button>
                          {activeTab === 'pending' && hasPermission('correspondence:review') && (
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleReview(corr.id)}
                              className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                            >
                              <CheckCircle className="mr-2 h-4 w-4" />
                              {t('correspondence.review')}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
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

          {/* Select All */}
          {hasPermission('correspondence:review') && activeTab === 'pending' && correspondences.length > 0 && (
            <div className="flex items-center gap-2 p-4 bg-muted rounded-lg">
              <input
                type="checkbox"
                checked={selectedIds.length === correspondences.length && correspondences.length > 0}
                onChange={toggleSelectAll}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <label className="text-sm font-medium cursor-pointer">
                {i18n.language === 'ar' ? 'تحديد الكل' : 'Select All'} ({selectedIds.length}/{correspondences.length})
              </label>
            </div>
          )}
        </>
      )}
    </div>
  );
}
