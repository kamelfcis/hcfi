import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { toast } from 'react-toastify';
import { X } from 'lucide-react';

const entitySchema = z.object({
  name_ar: z.string().min(1, 'اسم الجهة مطلوب'),
  type: z.enum(['قيادة_عامة', 'فرع_رئيسي', 'قيادة_استراتيجية', 'هيئة_رئيسية', 'إدارة_رئيسية', 'جهة_تابعة']),
  contact_person: z.string().optional(),
  contact_email: z.string().email().optional().or(z.literal('')),
  contact_phone: z.string().optional(),
  address: z.string().optional(),
  is_active: z.boolean().optional(),
});

interface EntityModalProps {
  entity?: {
    id: number;
    name_ar: string;
    type: string;
    contact_person?: string;
    contact_email?: string;
    contact_phone?: string;
    address?: string;
    is_active: boolean;
  } | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EntityModal({ entity, isOpen, onClose, onSuccess }: EntityModalProps) {
  const { t, i18n } = useTranslation();
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<z.infer<typeof entitySchema>>({
    resolver: zodResolver(entitySchema),
    defaultValues: {
      is_active: true,
    },
  });

  useEffect(() => {
    if (entity) {
      reset({
        name_ar: entity.name_ar,
        type: entity.type as any,
        contact_person: entity.contact_person || '',
        contact_email: entity.contact_email || '',
        contact_phone: entity.contact_phone || '',
        address: entity.address || '',
        is_active: entity.is_active,
      });
    } else {
      reset({
        name_ar: '',
        type: 'قيادة_عامة',
        contact_person: '',
        contact_email: '',
        contact_phone: '',
        address: '',
        is_active: true,
      });
    }
  }, [entity, reset]);

  if (!isOpen) return null;

  const onSubmit = async (data: z.infer<typeof entitySchema>) => {
    try {
      const payload = {
        ...data,
        contact_email: data.contact_email?.trim() ? data.contact_email.trim() : undefined,
      };

      if (entity) {
        await api.put(`/entities/${entity.id}`, payload);
        toast.success('تم التحديث بنجاح');
      } else {
        await api.post('/entities', payload);
        toast.success('تم الإنشاء بنجاح');
      }
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'فشل في حفظ الجهة');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative w-full max-w-2xl rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold">
            {entity ? t('correspondence.edit', 'Edit') : t('correspondence.create', 'Create')} {t('nav.entities')}
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium">اسم الجهة</label>
            <Input {...register('name_ar')} />
            {errors.name_ar && <p className="mt-1 text-sm text-red-500">{errors.name_ar.message}</p>}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">النوع</label>
            <Select {...register('type')} onChange={(e) => setValue('type', e.target.value as any)}>
              <option value="قيادة_عامة">قيادة عامة</option>
              <option value="فرع_رئيسي">فرع رئيسي</option>
              <option value="قيادة_استراتيجية">قيادة استراتيجية</option>
              <option value="هيئة_رئيسية">هيئة رئيسية</option>
              <option value="إدارة_رئيسية">إدارة رئيسية</option>
              <option value="جهة_تابعة">جهة تابعة</option>
            </Select>
            {errors.type && <p className="mt-1 text-sm text-red-500">{errors.type.message}</p>}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium">المسؤول</label>
              <Input {...register('contact_person')} />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">البريد الإلكتروني</label>
              <Input type="email" {...register('contact_email')} />
              {errors.contact_email && <p className="mt-1 text-sm text-red-500">{errors.contact_email.message}</p>}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium">رقم الهاتف</label>
              <Input {...register('contact_phone')} />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">الحالة</label>
              <Select
                {...register('is_active')}
                onChange={(e) => setValue('is_active', e.target.value === 'true')}
              >
                <option value="true">نشط</option>
                <option value="false">غير نشط</option>
              </Select>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">العنوان</label>
            <Textarea {...register('address')} rows={3} />
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

