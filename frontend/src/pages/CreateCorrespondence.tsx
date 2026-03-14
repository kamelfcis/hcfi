import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'react-toastify';
import { ArrowLeft, Upload, X } from 'lucide-react';

const correspondenceSchema = z.object({
  type: z.enum(['incoming', 'outgoing']),
  correspondence_number: z.string().optional(),
  correspondence_method: z.enum(['hand', 'computer']).optional(),
  subject: z.string().min(1, 'Subject is required'),
  description: z.string().min(1, 'Description is required'),
  specialized_branch: z.string().optional(),
  responsible_person: z.string().optional(),
  sender_entity_id: z.number().int().positive('Sender entity is required'),
  receiver_entity_id: z.number().int().positive('Receiver entity is required'),
  correspondence_date: z.string().min(1, 'Date is required'),
  current_status: z.enum(['draft', 'sent', 'received', 'under_review', 'replied', 'closed']).optional(),
  storage_location: z.string().optional(),
});

type CorrespondenceFormData = z.infer<typeof correspondenceSchema>;

interface Entity {
  id: number;
  name_ar: string;
}

export default function CreateCorrespondence() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [entities, setEntities] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(false);
  const [entitiesLoading, setEntitiesLoading] = useState(true);
  const [files, setFiles] = useState<File[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<CorrespondenceFormData>({
    resolver: zodResolver(correspondenceSchema),
    defaultValues: {
      type: 'incoming',
      correspondence_date: new Date().toISOString().split('T')[0],
      current_status: 'draft',
      correspondence_method: 'computer',
    },
  });
  const senderEntityId = watch('sender_entity_id');
  const receiverEntityId = watch('receiver_entity_id');
  const [senderSearch, setSenderSearch] = useState('');
  const [receiverSearch, setReceiverSearch] = useState('');

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
        toast.error('Failed to load entities');
      } finally {
        setEntitiesLoading(false);
      }
    };
    fetchEntities();
  }, []);

  useEffect(() => {
    const selectedSender = entities.find((entity) => entity.id === senderEntityId);
    setSenderSearch(selectedSender?.name_ar || '');
  }, [senderEntityId, entities]);

  useEffect(() => {
    const selectedReceiver = entities.find((entity) => entity.id === receiverEntityId);
    setReceiverSearch(selectedReceiver?.name_ar || '');
  }, [receiverEntityId, entities]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: CorrespondenceFormData) => {
    setLoading(true);
    try {
      const response = await api.post('/correspondences', {
        ...data,
        correspondence_date: new Date(data.correspondence_date).toISOString(),
      });
      
      // Upload files if any
      if (files.length > 0 && response.data.id) {
        for (const file of files) {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('type', data.type);
          try {
            await api.post(`/attachments/${response.data.id}`, formData, {
              headers: { 'Content-Type': 'multipart/form-data' },
            });
          } catch (error) {
            console.error('Failed to upload file:', error);
          }
        }
      }

      toast.success(i18n.language === 'ar' ? 'تم إنشاء المكاتبة بنجاح' : 'Correspondence created successfully');
      // Redirect based on type
      navigate(data.type === 'incoming' ? '/incoming' : '/outgoing');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to create correspondence');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-3xl font-bold">{t('correspondence.create')}</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('correspondence.create')}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium">{t('correspondence.type')}</label>
                <Select
                  {...register('type')}
                  onChange={(e) => setValue('type', e.target.value as 'incoming' | 'outgoing')}
                >
                  <option value="incoming">{t('correspondence.incoming')}</option>
                  <option value="outgoing">{t('correspondence.outgoing')}</option>
                </Select>
                {errors.type && <p className="mt-1 text-sm text-red-500">{errors.type.message}</p>}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">{t('correspondence.date')}</label>
                <Input type="date" {...register('correspondence_date')} />
                {errors.correspondence_date && (
                  <p className="mt-1 text-sm text-red-500">{errors.correspondence_date.message}</p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">{t('correspondence.sender')}</label>
                <input type="hidden" {...register('sender_entity_id', { valueAsNumber: true })} />
                <Input
                  list="sender-entities-list"
                  disabled={entitiesLoading}
                  value={senderSearch}
                  placeholder={t('correspondence.sender')}
                  onChange={(e) => {
                    const value = e.target.value;
                    setSenderSearch(value);
                    const selected = entities.find((entity) => entity.name_ar === value);
                    setValue('sender_entity_id', selected ? selected.id : (undefined as unknown as number), {
                      shouldDirty: true,
                      shouldValidate: true,
                    });
                  }}
                />
                <datalist id="sender-entities-list">
                  {entities.map((entity) => (
                    <option key={entity.id} value={entity.name_ar} />
                  ))}
                </datalist>
                {errors.sender_entity_id && (
                  <p className="mt-1 text-sm text-red-500">{errors.sender_entity_id.message}</p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">{t('correspondence.receiver')}</label>
                <input type="hidden" {...register('receiver_entity_id', { valueAsNumber: true })} />
                <Input
                  list="receiver-entities-list"
                  disabled={entitiesLoading}
                  value={receiverSearch}
                  placeholder={t('correspondence.receiver')}
                  onChange={(e) => {
                    const value = e.target.value;
                    setReceiverSearch(value);
                    const selected = entities.find((entity) => entity.name_ar === value);
                    setValue('receiver_entity_id', selected ? selected.id : (undefined as unknown as number), {
                      shouldDirty: true,
                      shouldValidate: true,
                    });
                  }}
                />
                <datalist id="receiver-entities-list">
                  {entities.map((entity) => (
                    <option key={entity.id} value={entity.name_ar} />
                  ))}
                </datalist>
                {errors.receiver_entity_id && (
                  <p className="mt-1 text-sm text-red-500">{errors.receiver_entity_id.message}</p>
                )}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">{t('correspondence.correspondenceNumber')}</label>
              <Input {...register('correspondence_number')} />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium">{t('correspondence.specializedBranch')}</label>
                <Input {...register('specialized_branch')} />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">{t('correspondence.responsiblePerson')}</label>
                <Input {...register('responsible_person')} />
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium">{t('correspondence.correspondenceMethod')}</label>
                <Select
                  {...register('correspondence_method')}
                  onChange={(e) => setValue('correspondence_method', e.target.value as 'hand' | 'computer')}
                >
                  <option value="hand">{t('correspondence.hand')}</option>
                  <option value="computer">{t('correspondence.computer')}</option>
                </Select>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">{t('correspondence.subject')}</label>
              <Input {...register('subject')} />
              {errors.subject && <p className="mt-1 text-sm text-red-500">{errors.subject.message}</p>}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">{t('correspondence.description')}</label>
              <Textarea {...register('description')} rows={6} />
              {errors.description && (
                <p className="mt-1 text-sm text-red-500">{errors.description.message}</p>
              )}
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium">{t('correspondence.status')}</label>
                <Select
                  {...register('current_status')}
                  onChange={(e) => setValue('current_status', e.target.value as any)}
                >
                  <option value="draft">{t('correspondence.draft')}</option>
                  <option value="sent">{t('correspondence.sent')}</option>
                  <option value="received">{t('correspondence.received')}</option>
                  <option value="under_review">{t('correspondence.underReview')}</option>
                </Select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">مكان الحفظ</label>
                <Input
                  list="storage-location-entities-list"
                  {...register('storage_location')}
                  placeholder="مكان الحفظ"
                  disabled={entitiesLoading}
                />
                <datalist id="storage-location-entities-list">
                  {entities.map((entity) => (
                    <option key={entity.id} value={entity.name_ar} />
                  ))}
                </datalist>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">{t('correspondence.attachments')}</label>
              <div className="space-y-2">
                <Input
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  className="cursor-pointer"
                />
                {files.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {files.map((file, index) => (
                      <div key={index} className="flex items-center justify-between rounded border p-2">
                        <span className="text-sm">{file.name}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={loading}>
                {loading ? '...' : t('correspondence.save')}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate(-1)}>
                {t('correspondence.cancel')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

