import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { toast } from 'react-toastify';
import { X } from 'lucide-react';

const userSchema = z.object({
  username: z.string().min(1, 'اسم المستخدم مطلوب'),
  email: z.string().email('بريد إلكتروني غير صالح'),
  password: z.string().optional(),
  full_name_ar: z.string().min(1, 'الاسم مطلوب'),
  role_id: z.number().int().positive('الدور مطلوب'),
  is_active: z.boolean().optional(),
});

interface UserModalProps {
  user?: {
    id: number;
    username: string;
    email: string;
    full_name_ar: string;
    role_id: number;
    is_active: boolean;
  } | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface Role {
  id: number;
  name: string;
  name_ar: string;
}

export default function UserModal({ user, isOpen, onClose, onSuccess }: UserModalProps) {
  const { t, i18n } = useTranslation();
  const [roles, setRoles] = useState<Role[]>([]);
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<z.infer<typeof userSchema>>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      is_active: true,
    },
  });

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        // Assuming we have a roles endpoint or we can get it from seeders
        // For now, using hardcoded roles
        setRoles([
          { id: 1, name: 'admin', name_ar: 'مدير' },
          { id: 2, name: 'reviewer', name_ar: 'مراجع' },
          { id: 3, name: 'employee', name_ar: 'موظف' },
          { id: 4, name: 'viewer', name_ar: 'مشاهد' },
        ]);
      } catch (error) {
        console.error('Failed to load roles');
      }
    };
    fetchRoles();
  }, []);

  useEffect(() => {
    if (user) {
      reset({
        username: user.username,
        email: user.email,
        password: '',
        full_name_ar: user.full_name_ar,
        role_id: user.role_id,
        is_active: user.is_active,
      });
    } else {
      reset({
        username: '',
        email: '',
        password: '',
        full_name_ar: '',
        role_id: 3, // Default to employee
        is_active: true,
      });
    }
  }, [user, reset]);

  if (!isOpen) return null;

  const onSubmit = async (data: z.infer<typeof userSchema>) => {
    try {
      const payload: any = { ...data };
      if (!payload.password || payload.password === '') {
        delete payload.password;
      }
      if (user) {
        await api.put(`/users/${user.id}`, payload);
        toast.success('تم التحديث بنجاح');
      } else {
        if (!payload.password) {
          toast.error('كلمة المرور مطلوبة للمستخدمين الجدد');
          return;
        }
        await api.post('/users', payload);
        toast.success('تم الإنشاء بنجاح');
      }
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'فشل في حفظ المستخدم');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative w-full max-w-2xl rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold">
            {user ? t('correspondence.edit', 'Edit') : t('correspondence.create', 'Create')} {t('nav.users')}
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium">اسم المستخدم</label>
              <Input {...register('username')} />
              {errors.username && <p className="mt-1 text-sm text-red-500">{errors.username.message}</p>}
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">البريد الإلكتروني</label>
              <Input type="email" {...register('email')} />
              {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">كلمة المرور {user && '(اتركه فارغاً للإبقاء على الحالي)'}</label>
            <Input type="password" {...register('password')} />
            {errors.password && <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">الاسم الكامل</label>
            <Input {...register('full_name_ar')} />
            {errors.full_name_ar && <p className="mt-1 text-sm text-red-500">{errors.full_name_ar.message}</p>}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium">الدور</label>
              <Select
                {...register('role_id', { valueAsNumber: true })}
                onChange={(e) => setValue('role_id', parseInt(e.target.value))}
              >
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name_ar}
                  </option>
                ))}
              </Select>
              {errors.role_id && <p className="mt-1 text-sm text-red-500">{errors.role_id.message}</p>}
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">الحالة</label>
              <Select
                {...register('is_active', { valueAsBoolean: true })}
                onChange={(e) => setValue('is_active', e.target.value === 'true')}
              >
                <option value="true">نشط</option>
                <option value="false">غير نشط</option>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              {t('correspondence.cancel')}
            </Button>
            <Button type="submit">{t('correspondence.save')}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

