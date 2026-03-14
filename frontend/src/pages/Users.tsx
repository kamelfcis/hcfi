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
import UserModal from '@/components/UserModal';

interface User {
  id: number;
  username: string;
  email: string;
  full_name_ar: string;
  role: { id: number; name: string; name_ar: string };
  is_active: boolean;
}

interface Role {
  id: number;
  name: string;
  name_ar: string;
}

export default function Users() {
  const { t, i18n } = useTranslation();
  const { hasPermission, isAdmin } = usePermissions();
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [rolesLoading, setRolesLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1, limit: 10 });
  const [filters, setFilters] = useState({
    search: '',
    role_id: '',
    is_active: '',
    page: 1,
  });

  useEffect(() => {
    fetchRoles();
    fetchUsers();
  }, [filters]);

  const fetchRoles = async () => {
    try {
      const response = await api.get('/roles');
      setRoles(response.data);
    } catch (error) {
      console.error('Failed to fetch roles:', error);
    } finally {
      setRolesLoading(false);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.role_id) params.append('role_id', filters.role_id);
      if (filters.is_active) params.append('is_active', filters.is_active);
      params.append('page', filters.page.toString());
      params.append('limit', pagination.limit.toString());

      const response = await api.get(`/users?${params}`);
      setUsers(response.data.data || response.data);
      if (response.data.pagination) {
        setPagination(response.data.pagination);
      }
    } catch (error) {
      toast.error(i18n.language === 'ar' ? 'فشل تحميل المستخدمين' : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm(i18n.language === 'ar' ? 'هل أنت متأكد من الحذف؟' : 'Are you sure you want to delete?')) {
      return;
    }
    try {
      await api.delete(`/users/${id}`);
      toast.success(i18n.language === 'ar' ? 'تم الحذف بنجاح' : 'Deleted successfully');
      fetchUsers();
    } catch (error) {
      toast.error(i18n.language === 'ar' ? 'فشل الحذف' : 'Failed to delete user');
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const clearFilters = () => {
    setFilters({ search: '', role_id: '', is_active: '', page: 1 });
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
          {t('nav.users')}
        </h1>
        {isAdmin() && hasPermission('user:create') && (
          <Button onClick={() => {
            setSelectedUser(null);
            setModalOpen(true);
          }} className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600">
            <Plus className="mr-2 h-4 w-4" />
            {i18n.language === 'ar' ? 'إنشاء مستخدم' : 'Create User'}
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card className="mb-6 border-2 border-pink-200 dark:border-pink-800 bg-gradient-to-r from-pink-50 to-rose-50 dark:from-pink-950 dark:to-rose-950">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-pink-600 dark:text-pink-400" />
              {i18n.language === 'ar' ? 'التصفية والبحث' : 'Filters & Search'}
            </CardTitle>
            {(filters.search || filters.role_id || filters.is_active) && (
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
              value={filters.role_id}
              onChange={(e) => handleFilterChange('role_id', e.target.value)}
              disabled={rolesLoading}
            >
              <option value="">{i18n.language === 'ar' ? 'جميع الأدوار' : 'All Roles'}</option>
              {roles.map((role) => (
                <option key={role.id} value={role.id.toString()}>
                  {i18n.language === 'ar' ? role.name_ar : role.name}
                </option>
              ))}
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
      ) : users.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">{t('correspondence.noResults')}</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-4">
            {users.map((user) => (
              <Card key={user.id} className="border-2 hover:shadow-lg transition-all">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold">
                        {user.full_name_ar}
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground">{user.username} - {user.email}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {user.role.name_ar}
                      </p>
                      <span
                        className={`mt-2 inline-block rounded-full px-2 py-1 text-xs ${
                          user.is_active
                            ? 'bg-green-100 text-green-800 border border-green-300'
                            : 'bg-red-100 text-red-800 border border-red-300'
                        }`}
                      >
                        {user.is_active ? (i18n.language === 'ar' ? 'نشط' : 'Active') : (i18n.language === 'ar' ? 'غير نشط' : 'Inactive')}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      {isAdmin() && hasPermission('user:update') && (
                        <Button variant="outline" size="sm" onClick={() => {
                          setSelectedUser(user);
                          setModalOpen(true);
                        }}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                      {isAdmin() && hasPermission('user:delete') && (
                        <Button variant="destructive" size="sm" onClick={() => handleDelete(user.id)}>
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

      <UserModal
        user={selectedUser}
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedUser(null);
        }}
        onSuccess={fetchUsers}
      />
    </div>
  );
}
