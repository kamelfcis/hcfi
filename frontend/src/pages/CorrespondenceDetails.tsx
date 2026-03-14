import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { usePermissions } from '@/hooks/usePermissions';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'react-toastify';
import {
  ArrowLeft,
  Trash2,
  MessageSquare,
  Upload,
  Edit,
  CheckCircle,
  Printer,
  Clock,
  Building2,
  CalendarDays,
  FileText,
  Hash,
  User,
  MapPin,
  Send,
  ArrowDownLeft,
  ArrowUpRight,
  Paperclip,
  Plus,
  X,
  ChevronRight,
  History,
  Shield,
} from 'lucide-react';
import { format } from 'date-fns';
import AttachmentThumbnail from '@/components/AttachmentThumbnail';
import AttachmentViewer from '@/components/AttachmentViewer';

const replySchema = z.object({
  subject: z.string().min(1, 'الموضوع مطلوب'),
  body: z.string().min(1, 'نص الرد مطلوب'),
});

const statusUpdateSchema = z.object({
  status: z.enum(['draft', 'sent', 'received', 'under_review', 'replied', 'closed']),
  notes: z.string().optional(),
});

interface Correspondence {
  id: number;
  reference_number: string;
  correspondence_number?: string;
  type: 'incoming' | 'outgoing';
  correspondence_method?: 'hand' | 'computer';
  subject: string;
  description: string;
  specialized_branch?: string;
  responsible_person?: string;
  correspondence_date: string;
  current_status: string;
  review_status: string;
  storage_location?: string;
  senderEntity: { name_ar: string };
  receiverEntity: { name_ar: string };
  creator: { full_name_ar: string };
  attachments: Array<{
    id: number;
    original_name: string;
    file_size: number;
    mime_type: string;
    file_path: string;
  }>;
  replies: Array<{
    id: number;
    subject: string;
    body: string;
    created_at: string;
    creator: { full_name_ar: string };
  }>;
  statusHistory: Array<{
    id: number;
    old_status: string;
    new_status: string;
    notes?: string;
    created_at: string;
    changedBy: { full_name_ar: string };
  }>;
}

const statusConfig: Record<string, { color: string; bg: string; border: string; icon: string }> = {
  draft: { color: 'text-slate-700 dark:text-slate-300', bg: 'bg-slate-100 dark:bg-slate-800', border: 'border-slate-200 dark:border-slate-700', icon: '📝' },
  sent: { color: 'text-blue-700 dark:text-blue-300', bg: 'bg-blue-50 dark:bg-blue-950', border: 'border-blue-200 dark:border-blue-800', icon: '📤' },
  received: { color: 'text-indigo-700 dark:text-indigo-300', bg: 'bg-indigo-50 dark:bg-indigo-950', border: 'border-indigo-200 dark:border-indigo-800', icon: '📥' },
  under_review: { color: 'text-amber-700 dark:text-amber-300', bg: 'bg-amber-50 dark:bg-amber-950', border: 'border-amber-200 dark:border-amber-800', icon: '🔍' },
  replied: { color: 'text-emerald-700 dark:text-emerald-300', bg: 'bg-emerald-50 dark:bg-emerald-950', border: 'border-emerald-200 dark:border-emerald-800', icon: '✅' },
  closed: { color: 'text-rose-700 dark:text-rose-300', bg: 'bg-rose-50 dark:bg-rose-950', border: 'border-rose-200 dark:border-rose-800', icon: '🔒' },
};

export default function CorrespondenceDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { hasPermission } = usePermissions();
  const [correspondence, setCorrespondence] = useState<Correspondence | null>(null);
  const [loading, setLoading] = useState(true);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [showStatusForm, setShowStatusForm] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewingAttachment, setViewingAttachment] = useState<{
    id: number;
    original_name: string;
    file_size: number;
    mime_type: string;
    file_path: string;
  } | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'attachments' | 'replies' | 'history'>('details');

  const replyForm = useForm<z.infer<typeof replySchema>>({
    resolver: zodResolver(replySchema),
  });

  const statusForm = useForm<z.infer<typeof statusUpdateSchema>>({
    resolver: zodResolver(statusUpdateSchema),
    defaultValues: {
      status: correspondence?.current_status as any,
    },
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.get(`/correspondences/${id}`);
        setCorrespondence(response.data);
      } catch {
        toast.error(t('correspondence.noResults'));
        navigate('/incoming');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchData();
  }, [id, navigate]);

  useEffect(() => {
    if (correspondence) {
      statusForm.setValue('status', correspondence.current_status as any);
    }
  }, [correspondence]);

  const fetchCorrespondence = async () => {
    if (!id) return;
    try {
      const response = await api.get(`/correspondences/${id}`);
      setCorrespondence(response.data);
    } catch {
      toast.error(t('correspondence.noResults'));
    }
  };

  const handleDownload = async (attachmentId: number, filename: string) => {
    try {
      const response = await api.get(`/attachments/${attachmentId}/download`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error('Failed to download');
    }
  };

  const handleViewAttachment = (attachment: { id: number; original_name: string; file_size: number; mime_type: string; file_path: string }) => {
    setViewingAttachment(attachment);
    setViewerOpen(true);
  };

  const handleDeleteAttachment = async (attachmentId: number) => {
    if (!confirm(t('correspondence.confirmDelete'))) return;
    try {
      await api.delete(`/attachments/${attachmentId}`);
      toast.success(t('correspondence.deleted'));
      fetchCorrespondence();
    } catch {
      toast.error('Failed to delete attachment');
    }
  };

  const handleDeleteReply = async (replyId: number) => {
    if (!confirm(t('correspondence.confirmDeleteReply'))) return;
    try {
      await api.delete(`/correspondences/${id}/reply/${replyId}`);
      toast.success(t('correspondence.replyDeleted'));
      fetchCorrespondence();
    } catch {
      toast.error('Failed to delete reply');
    }
  };

  const handleDeleteCorrespondence = async () => {
    if (!id) return;
    if (!confirm(t('correspondence.confirmDelete'))) return;

    try {
      await api.delete(`/correspondences/${id}`);
      toast.success(t('correspondence.deleted'));
      navigate('/correspondences');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to delete correspondence');
    }
  };

  const onReplySubmit = async (data: z.infer<typeof replySchema>) => {
    if (!id) return;
    try {
      await api.post(`/correspondences/${id}/reply`, data);
      toast.success(t('correspondence.replyAdded'));
      replyForm.reset();
      setShowReplyForm(false);
      fetchCorrespondence();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to add reply');
    }
  };

  const onStatusSubmit = async (data: z.infer<typeof statusUpdateSchema>) => {
    if (!id) return;
    try {
      await api.patch(`/correspondences/${id}/status`, data);
      toast.success(t('correspondence.statusUpdated'));
      setShowStatusForm(false);
      fetchCorrespondence();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update status');
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile || !id) return;
    setUploadingFile(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('type', correspondence?.type || 'incoming');
      await api.post(`/attachments/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success(t('correspondence.fileUploaded'));
      setSelectedFile(null);
      fetchCorrespondence();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to upload');
    } finally {
      setUploadingFile(false);
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow || !correspondence) return;
    const dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
    const htmlContent = `<!DOCTYPE html><html dir="${dir}" lang="${i18n.language}"><head><meta charset="UTF-8"><title>${correspondence.reference_number}</title><style>
      *{margin:0;padding:0;box-sizing:border-box}body{font-family:'Segoe UI',Tahoma,Arial,sans-serif;padding:40px;direction:${dir};color:#1a1a1a;line-height:1.6}
      .header{text-align:center;border-bottom:3px double #333;padding-bottom:20px;margin-bottom:30px}
      .header h1{font-size:22px;margin-bottom:8px}.header .ref{color:#666;font-size:14px}
      .grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin:25px 0}
      .field{padding:12px 0;border-bottom:1px solid #eee}.field .label{font-size:12px;color:#888;text-transform:uppercase;margin-bottom:4px}.field .value{font-size:15px;font-weight:500}
      .description{margin:25px 0;padding:20px;background:#f8f9fa;border-radius:8px;border-right:4px solid #4f46e5}
      .section-title{font-size:16px;font-weight:600;margin:30px 0 15px;padding-bottom:8px;border-bottom:2px solid #e5e7eb}
      .attachment{padding:8px 0;font-size:14px}.reply{margin:15px 0;padding:18px;border:1px solid #e5e7eb;border-radius:8px}
      .reply .reply-header{font-weight:600;margin-bottom:6px}.reply .reply-meta{font-size:12px;color:#888;margin-top:8px}
      @media print{@page{margin:1.5cm}}
    </style></head><body>
      <div class="header"><h1>${correspondence.subject}</h1><div class="ref">${correspondence.reference_number}</div></div>
      <div class="grid">
        <div class="field"><div class="label">${t('correspondence.type')}</div><div class="value">${t(`correspondence.${correspondence.type}`)}</div></div>
        <div class="field"><div class="label">${t('correspondence.status')}</div><div class="value">${t(`correspondence.${correspondence.current_status}`)}</div></div>
        <div class="field"><div class="label">${t('correspondence.sender')}</div><div class="value">${correspondence.senderEntity.name_ar}</div></div>
        <div class="field"><div class="label">${t('correspondence.receiver')}</div><div class="value">${correspondence.receiverEntity.name_ar}</div></div>
        <div class="field"><div class="label">${t('correspondence.date')}</div><div class="value">${format(new Date(correspondence.correspondence_date), 'yyyy-MM-dd')}</div></div>
        <div class="field"><div class="label">${t('correspondence.createdBy')}</div><div class="value">${correspondence.creator.full_name_ar}</div></div>
        ${correspondence.storage_location ? `<div class="field"><div class="label">${t('correspondence.storageLocation')}</div><div class="value">${correspondence.storage_location}</div></div>` : ''}
      </div>
      <div class="description"><div class="label" style="margin-bottom:8px">${t('correspondence.description')}</div><div>${correspondence.description || '-'}</div></div>
      ${correspondence.attachments?.length ? `<div class="section-title">${t('correspondence.attachments')}</div>${correspondence.attachments.map(a => `<div class="attachment">📎 ${a.original_name} (${(a.file_size/1024).toFixed(1)} KB)</div>`).join('')}` : ''}
      ${correspondence.replies?.length ? `<div class="section-title">${t('correspondence.replies')}</div>${correspondence.replies.map(r => `<div class="reply"><div class="reply-header">${r.subject}</div><div>${r.body}</div><div class="reply-meta">${r.creator.full_name_ar} — ${format(new Date(r.created_at), 'yyyy-MM-dd HH:mm')}</div></div>`).join('')}` : ''}
    </body></html>`;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 250);
  };

  const getStatusStyle = (status: string) => statusConfig[status] || statusConfig.draft;

  // Loading skeleton
  if (loading) {
    return (
      <div className="mx-auto max-w-6xl space-y-6 p-4">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-8 w-80" />
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-48 rounded-xl" />
            <Skeleton className="h-64 rounded-xl" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-40 rounded-xl" />
            <Skeleton className="h-40 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!correspondence) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <FileText className="mx-auto h-16 w-16 text-muted-foreground/30" />
          <p className="mt-4 text-lg text-muted-foreground">{t('correspondence.noResults')}</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" /> {t('correspondence.cancel')}
          </Button>
        </div>
      </div>
    );
  }

  const statusStyle = getStatusStyle(correspondence.current_status);
  const isIncoming = correspondence.type === 'incoming';

  const tabs = [
    { key: 'details' as const, label: t('correspondence.details'), icon: FileText },
    { key: 'attachments' as const, label: `${t('correspondence.attachments')} (${correspondence.attachments?.length || 0})`, icon: Paperclip },
    { key: 'replies' as const, label: `${t('correspondence.replies')} (${correspondence.replies?.length || 0})`, icon: MessageSquare },
    { key: 'history' as const, label: t('correspondence.statusHistory'), icon: History },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* ─── Top Header Bar ─── */}
      <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-card via-card to-muted/30 p-6 shadow-sm">
        {/* Decorative accent */}
        <div className={`absolute top-0 ${i18n.language === 'ar' ? 'right-0' : 'left-0'} h-full w-1.5 ${isIncoming ? 'bg-gradient-to-b from-blue-500 to-indigo-600' : 'bg-gradient-to-b from-emerald-500 to-teal-600'}`} />

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="mt-0.5 shrink-0 rounded-full hover:bg-muted"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>

            <div className="min-w-0 flex-1">
              {/* Type badge + reference */}
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${isIncoming ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'}`}>
                  {isIncoming ? <ArrowDownLeft className="h-3.5 w-3.5" /> : <ArrowUpRight className="h-3.5 w-3.5" />}
                  {t(`correspondence.${correspondence.type}`)}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs font-mono text-muted-foreground">
                  <Hash className="h-3 w-3" />
                  {correspondence.reference_number}
                </span>
              </div>

              {/* Subject */}
              <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
                {correspondence.subject}
              </h1>

              {/* Quick meta */}
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Building2 className="h-3.5 w-3.5" />
                  {correspondence.senderEntity.name_ar}
                </span>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />
                <span className="inline-flex items-center gap-1">
                  <Building2 className="h-3.5 w-3.5" />
                  {correspondence.receiverEntity.name_ar}
                </span>
                {correspondence.correspondence_number && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs">
                    {correspondence.correspondence_number}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Actions + Status */}
          <div className="flex flex-col items-end gap-3">
            {/* Status badge */}
            <div className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold ${statusStyle.bg} ${statusStyle.color} ${statusStyle.border}`}>
              <span>{statusStyle.icon}</span>
              {t(`correspondence.${correspondence.current_status}`)}
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handlePrint} className="rounded-lg">
                <Printer className="h-4 w-4" />
              </Button>
              {hasPermission('correspondence:update') && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowStatusForm(!showStatusForm)}
                    className="rounded-lg"
                  >
                    <Shield className="mr-1.5 h-4 w-4" />
                    {t('correspondence.updateStatus')}
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => navigate(`/correspondences/${id}/edit`)}
                    className={`rounded-lg ${isIncoming ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700' : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700'}`}
                  >
                    <Edit className="mr-1.5 h-4 w-4" />
                    {t('correspondence.edit')}
                  </Button>
                </>
              )}
              {hasPermission('correspondence:delete') && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDeleteCorrespondence}
                  className="rounded-lg border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
                >
                  <Trash2 className="mr-1.5 h-4 w-4" />
                  {t('correspondence.delete')}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Inline Status Update Form */}
        {showStatusForm && (
          <div className="mt-4 border-t pt-4">
            <form onSubmit={statusForm.handleSubmit(onStatusSubmit)} className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex-1">
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">{t('correspondence.status')}</label>
                <Select
                  {...statusForm.register('status')}
                  onChange={(e) => statusForm.setValue('status', e.target.value as any)}
                  className="rounded-lg"
                >
                  <option value="draft">{t('correspondence.draft')}</option>
                  <option value="sent">{t('correspondence.sent')}</option>
                  <option value="received">{t('correspondence.received')}</option>
                  <option value="under_review">{t('correspondence.underReview')}</option>
                  <option value="replied">{t('correspondence.replied')}</option>
                  <option value="closed">{t('correspondence.closed')}</option>
                </Select>
              </div>
              <div className="flex-1">
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">{t('correspondence.notes')}</label>
                <Input {...statusForm.register('notes')} placeholder={t('correspondence.notes')} className="rounded-lg" />
              </div>
              <div className="flex gap-2">
                <Button type="submit" size="sm" className="rounded-lg">
                  <CheckCircle className="mr-1.5 h-4 w-4" />
                  {t('correspondence.save')}
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => setShowStatusForm(false)} className="rounded-lg">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* ─── Tab Navigation ─── */}
      <div className="flex gap-1 overflow-x-auto rounded-xl border bg-muted/50 p-1">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
                isActive
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-background/50 hover:text-foreground'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ─── Tab Content ─── */}

      {/* Details Tab */}
      {activeTab === 'details' && (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main info */}
          <Card className="lg:col-span-2 overflow-hidden rounded-xl border-0 shadow-sm">
            <CardContent className="p-0">
              {/* Description */}
              <div className="border-b p-6">
                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  {t('correspondence.description')}
                </h3>
                <p className="whitespace-pre-wrap leading-relaxed text-foreground/90">
                  {correspondence.description || '—'}
                </p>
              </div>

              {/* Info Grid */}
              <div className="grid divide-x divide-y sm:grid-cols-2 rtl:divide-x-reverse">
                <InfoCell icon={<CalendarDays className="h-4 w-4" />} label={t('correspondence.date')} value={format(new Date(correspondence.correspondence_date), 'yyyy-MM-dd')} />
                <InfoCell icon={<User className="h-4 w-4" />} label={t('correspondence.createdBy')} value={correspondence.creator.full_name_ar} />
                <InfoCell icon={<Send className="h-4 w-4" />} label={t('correspondence.sender')} value={correspondence.senderEntity.name_ar} />
                <InfoCell icon={<Building2 className="h-4 w-4" />} label={t('correspondence.receiver')} value={correspondence.receiverEntity.name_ar} />
                {correspondence.specialized_branch && (
                  <InfoCell icon={<Building2 className="h-4 w-4" />} label={t('correspondence.specializedBranch')} value={correspondence.specialized_branch} />
                )}
                {correspondence.responsible_person && (
                  <InfoCell icon={<User className="h-4 w-4" />} label={t('correspondence.responsiblePerson')} value={correspondence.responsible_person} />
                )}
                {correspondence.correspondence_method && (
                  <InfoCell icon={<FileText className="h-4 w-4" />} label={t('correspondence.correspondenceMethod')} value={t(`correspondence.${correspondence.correspondence_method}`)} />
                )}
                {correspondence.storage_location && (
                  <InfoCell icon={<MapPin className="h-4 w-4" />} label={t('correspondence.storageLocation')} value={correspondence.storage_location} />
                )}
                <InfoCell
                  icon={<Shield className="h-4 w-4" />}
                  label={t('correspondence.reviewStatus')}
                  value={
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      correspondence.review_status === 'reviewed'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                    }`}>
                      {t(`correspondence.${correspondence.review_status}`)}
                    </span>
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Side panel - Quick Stats */}
          <div className="space-y-4">
            {/* Stats cards */}
            <Card className="overflow-hidden rounded-xl border-0 shadow-sm">
              <CardContent className="p-0">
                <div className="divide-y">
                  <QuickStat icon={<Paperclip className="h-5 w-5" />} label={t('correspondence.attachments')} value={correspondence.attachments?.length || 0} color="text-blue-600 dark:text-blue-400" onClick={() => setActiveTab('attachments')} />
                  <QuickStat icon={<MessageSquare className="h-5 w-5" />} label={t('correspondence.replies')} value={correspondence.replies?.length || 0} color="text-emerald-600 dark:text-emerald-400" onClick={() => setActiveTab('replies')} />
                  <QuickStat icon={<History className="h-5 w-5" />} label={t('correspondence.statusHistory')} value={correspondence.statusHistory?.length || 0} color="text-amber-600 dark:text-amber-400" onClick={() => setActiveTab('history')} />
                </div>
              </CardContent>
            </Card>

            {/* Recent activity */}
            {correspondence.statusHistory && correspondence.statusHistory.length > 0 && (
              <Card className="overflow-hidden rounded-xl border-0 shadow-sm">
                <CardContent className="p-4">
                  <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {t('correspondence.statusHistory')}
                  </h3>
                  <div className="space-y-3">
                    {correspondence.statusHistory.slice(0, 3).map((h) => (
                      <div key={h.id} className="flex items-start gap-2.5">
                        <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary/60" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium">
                            {t(`correspondence.${h.old_status}`)} → {t(`correspondence.${h.new_status}`)}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            {h.changedBy.full_name_ar} · {format(new Date(h.created_at), 'MM/dd HH:mm')}
                          </p>
                        </div>
                      </div>
                    ))}
                    {correspondence.statusHistory.length > 3 && (
                      <button onClick={() => setActiveTab('history')} className="w-full text-center text-xs font-medium text-primary hover:underline">
                        +{correspondence.statusHistory.length - 3} {t('correspondence.view')}
                      </button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Attachments Tab */}
      {activeTab === 'attachments' && (
        <Card className="overflow-hidden rounded-xl border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-lg font-semibold">
                <Paperclip className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                {t('correspondence.attachments')}
                {correspondence.attachments?.length > 0 && (
                  <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                    {correspondence.attachments.length}
                  </span>
                )}
              </h3>
              {hasPermission('correspondence:update') && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById('file-upload')?.click()}
                  className="rounded-lg"
                >
                  <Plus className="mr-1.5 h-4 w-4" />
                  {t('correspondence.upload')}
                </Button>
              )}
            </div>

            <input
              id="file-upload"
              type="file"
              className="hidden"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
            />

            {selectedFile && (
              <div className="mb-5 flex items-center justify-between rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 p-4">
                <div className="flex items-center gap-3">
                  <Upload className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium">{selectedFile.name}</span>
                  <span className="text-xs text-muted-foreground">({(selectedFile.size / 1024).toFixed(1)} KB)</span>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleFileUpload} disabled={uploadingFile} className="rounded-lg">
                    {uploadingFile ? (
                      <span className="flex items-center gap-2"><span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> ...</span>
                    ) : (
                      <><Upload className="mr-1.5 h-4 w-4" /> {t('correspondence.upload')}</>
                    )}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedFile(null)} className="rounded-lg">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {correspondence.attachments && correspondence.attachments.length > 0 ? (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {correspondence.attachments.map((attachment) => (
                  <AttachmentThumbnail
                    key={attachment.id}
                    attachment={attachment}
                    onDownload={handleDownload}
                    onDelete={hasPermission('correspondence:delete') ? handleDeleteAttachment : undefined}
                    onView={handleViewAttachment}
                    showActions={true}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed py-16 text-center">
                <Paperclip className="mb-3 h-12 w-12 text-muted-foreground/20" />
                <p className="text-sm font-medium text-muted-foreground">{t('correspondence.noAttachments')}</p>
                {hasPermission('correspondence:update') && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4 rounded-lg"
                    onClick={() => document.getElementById('file-upload')?.click()}
                  >
                    <Upload className="mr-1.5 h-4 w-4" />
                    {t('correspondence.upload')}
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Replies Tab */}
      {activeTab === 'replies' && (
        <Card className="overflow-hidden rounded-xl border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-lg font-semibold">
                <MessageSquare className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                {t('correspondence.replies')}
                {correspondence.replies?.length > 0 && (
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                    {correspondence.replies.length}
                  </span>
                )}
              </h3>
              {hasPermission('correspondence:update') && (
                <Button
                  size="sm"
                  onClick={() => setShowReplyForm(!showReplyForm)}
                  className="rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                >
                  <Plus className="mr-1.5 h-4 w-4" />
                  {t('correspondence.addReply')}
                </Button>
              )}
            </div>

            {/* Reply Form */}
            {showReplyForm && (
              <form onSubmit={replyForm.handleSubmit(onReplySubmit)} className="mb-6 overflow-hidden rounded-xl border bg-muted/30">
                <div className="border-b bg-muted/50 px-5 py-3">
                  <h4 className="text-sm font-semibold">{t('correspondence.addReply')}</h4>
                </div>
                <div className="space-y-4 p-5">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">{t('correspondence.subject')}</label>
                    <Input
                      {...replyForm.register('subject')}
                      placeholder={t('correspondence.replySubjectPlaceholder')}
                      className="rounded-lg"
                    />
                    {replyForm.formState.errors.subject && (
                      <p className="mt-1 text-xs text-red-500">{replyForm.formState.errors.subject.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">{t('correspondence.replyBody')}</label>
                    <Textarea
                      {...replyForm.register('body')}
                      rows={4}
                      placeholder={t('correspondence.writeReply')}
                      className="rounded-lg"
                    />
                    {replyForm.formState.errors.body && (
                      <p className="mt-1 text-xs text-red-500">{replyForm.formState.errors.body.message}</p>
                    )}
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => { setShowReplyForm(false); replyForm.reset(); }}
                      className="rounded-lg"
                    >
                      {t('correspondence.cancel')}
                    </Button>
                    <Button type="submit" size="sm" className="rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600">
                      <Send className="mr-1.5 h-4 w-4" />
                      {t('correspondence.save')}
                    </Button>
                  </div>
                </div>
              </form>
            )}

            {/* Reply List */}
            {correspondence.replies && correspondence.replies.length > 0 ? (
              <div className="space-y-3">
                {correspondence.replies.map((reply, idx) => (
                  <div
                    key={reply.id}
                    className="group relative overflow-hidden rounded-xl border bg-card transition-all hover:shadow-md"
                  >
                    {/* Reply accent line */}
                    <div className={`absolute top-0 ${i18n.language === 'ar' ? 'right-0' : 'left-0'} h-full w-1 bg-gradient-to-b from-emerald-400 to-teal-500 opacity-0 transition-opacity group-hover:opacity-100`} />

                    <div className="p-5">
                      <div className="mb-2 flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          {/* Avatar circle */}
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-sm font-bold text-white">
                            {idx + 1}
                          </div>
                          <div>
                            <p className="font-semibold leading-tight">{reply.subject}</p>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {reply.creator.full_name_ar} · {format(new Date(reply.created_at), 'yyyy-MM-dd HH:mm')}
                            </p>
                          </div>
                        </div>
                        {hasPermission('correspondence:update') && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 shrink-0 rounded-lg text-muted-foreground opacity-0 transition-all hover:bg-red-50 hover:text-red-600 group-hover:opacity-100 dark:hover:bg-red-950"
                            onClick={() => handleDeleteReply(reply.id)}
                            title={t('correspondence.deleteReply')}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      <div className={`${i18n.language === 'ar' ? 'mr-12' : 'ml-12'}`}>
                        <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/85">{reply.body}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed py-16 text-center">
                <MessageSquare className="mb-3 h-12 w-12 text-muted-foreground/20" />
                <p className="text-sm font-medium text-muted-foreground">{t('correspondence.noReplies')}</p>
                {hasPermission('correspondence:update') && (
                  <Button
                    size="sm"
                    className="mt-4 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600"
                    onClick={() => setShowReplyForm(true)}
                  >
                    <Plus className="mr-1.5 h-4 w-4" />
                    {t('correspondence.addReply')}
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Status History Tab */}
      {activeTab === 'history' && (
        <Card className="overflow-hidden rounded-xl border-0 shadow-sm">
          <CardContent className="p-6">
            <h3 className="mb-6 flex items-center gap-2 text-lg font-semibold">
              <History className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              {t('correspondence.statusHistory')}
            </h3>

            {correspondence.statusHistory && correspondence.statusHistory.length > 0 ? (
              <div className="relative">
                {/* Timeline line */}
                <div className={`absolute top-0 bottom-0 ${i18n.language === 'ar' ? 'right-[19px]' : 'left-[19px]'} w-0.5 bg-gradient-to-b from-primary/40 via-primary/20 to-transparent`} />

                <div className="space-y-6">
                  {correspondence.statusHistory.map((history, idx) => {
                    const fromStyle = getStatusStyle(history.old_status);
                    const toStyle = getStatusStyle(history.new_status);
                    return (
                      <div key={history.id} className="relative flex gap-4">
                        {/* Timeline dot */}
                        <div className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 ${idx === 0 ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground/20 bg-background text-muted-foreground'}`}>
                          <Clock className="h-4 w-4" />
                        </div>

                        {/* Content */}
                        <div className={`flex-1 rounded-xl border p-4 transition-all ${idx === 0 ? 'bg-primary/5 border-primary/20' : 'bg-card hover:shadow-sm'}`}>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${fromStyle.bg} ${fromStyle.color}`}>
                              {fromStyle.icon} {t(`correspondence.${history.old_status}`)}
                            </span>
                            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />
                            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${toStyle.bg} ${toStyle.color}`}>
                              {toStyle.icon} {t(`correspondence.${history.new_status}`)}
                            </span>
                          </div>
                          {history.notes && (
                            <p className="mt-2 text-sm text-muted-foreground">{history.notes}</p>
                          )}
                          <p className="mt-2 text-xs text-muted-foreground">
                            <span className="font-medium">{history.changedBy.full_name_ar}</span>
                            {' · '}
                            {format(new Date(history.created_at), 'yyyy-MM-dd HH:mm')}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed py-16 text-center">
                <History className="mb-3 h-12 w-12 text-muted-foreground/20" />
                <p className="text-sm font-medium text-muted-foreground">لا يوجد سجل حالات</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Attachment Viewer Modal */}
      <AttachmentViewer
        attachment={viewingAttachment}
        attachments={correspondence.attachments || []}
        isOpen={viewerOpen}
        onClose={() => { setViewerOpen(false); setViewingAttachment(null); }}
        onDownload={handleDownload}
      />
    </div>
  );
}

/* ─── Helper Sub-Components ─── */

function InfoCell({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 p-5">
      <div className="mt-0.5 text-muted-foreground/60">{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
        <div className="mt-1 text-sm font-semibold">{value}</div>
      </div>
    </div>
  );
}

function QuickStat({ icon, label, value, color, onClick }: { icon: React.ReactNode; label: string; value: number; color: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex w-full items-center gap-4 p-4 text-start transition-colors hover:bg-muted/50">
      <div className={`${color}`}>{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
      <span className="text-2xl font-bold tabular-nums">{value}</span>
    </button>
  );
}
