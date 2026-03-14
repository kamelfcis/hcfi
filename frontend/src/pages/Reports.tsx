import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { toast } from 'react-toastify';
import { BarChart3, FileText, TrendingUp, Clock, CheckCircle, FileSpreadsheet } from 'lucide-react';

interface Stats {
  totalCorrespondences: number;
  incomingCount: number;
  outgoingCount: number;
  pendingReview: number;
  underReview: number;
  totalEntities: number;
  totalUsers: number;
  thisMonthCount: number;
}

export default function Reports() {
  const { t, i18n } = useTranslation();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/dashboard/stats');
        setStats(response.data);
      } catch (error) {
        toast.error('Failed to load reports');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div>
        <h1 className="mb-6 text-3xl font-bold">{t('nav.reports')}</h1>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => (
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

  if (!stats) {
    return (
      <div>
        <h1 className="mb-6 text-3xl font-bold">{t('nav.reports')}</h1>
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">No data available</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const completionRate = stats.totalCorrespondences > 0
    ? ((stats.totalCorrespondences - stats.pendingReview - stats.underReview) / stats.totalCorrespondences * 100).toFixed(1)
    : '0';

  const exportToPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const htmlContent = `
      <!DOCTYPE html>
      <html dir="${i18n.language === 'ar' ? 'rtl' : 'ltr'}">
        <head>
          <meta charset="UTF-8">
          <title>${i18n.language === 'ar' ? 'تقرير المكاتبات' : 'Correspondence Report'}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; direction: ${i18n.language === 'ar' ? 'rtl' : 'ltr'}; }
            h1 { text-align: center; margin-bottom: 30px; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #ddd; padding: 12px; text-align: ${i18n.language === 'ar' ? 'right' : 'left'}; }
            th { background-color: #f2f2f2; font-weight: bold; }
            .stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin: 20px 0; }
            .stat-card { border: 1px solid #ddd; padding: 15px; border-radius: 5px; }
            .stat-value { font-size: 24px; font-weight: bold; }
            @media print { @page { margin: 1cm; } }
          </style>
        </head>
        <body>
          <h1>${i18n.language === 'ar' ? 'تقرير المكاتبات والخطابات الرسمية' : 'Correspondence Management System Report'}</h1>
          <p><strong>${i18n.language === 'ar' ? 'تاريخ التقرير' : 'Report Date'}:</strong> ${new Date().toLocaleDateString(i18n.language === 'ar' ? 'ar-EG' : 'en-US')}</p>
          
          <div class="stats-grid">
            <div class="stat-card">
              <strong>${t('dashboard.totalCorrespondences')}:</strong>
              <div class="stat-value">${stats.totalCorrespondences}</div>
            </div>
            <div class="stat-card">
              <strong>${t('dashboard.incoming')}:</strong>
              <div class="stat-value">${stats.incomingCount}</div>
            </div>
            <div class="stat-card">
              <strong>${t('dashboard.outgoing')}:</strong>
              <div class="stat-value">${stats.outgoingCount}</div>
            </div>
            <div class="stat-card">
              <strong>${t('dashboard.pendingReview')}:</strong>
              <div class="stat-value">${stats.pendingReview}</div>
            </div>
            <div class="stat-card">
              <strong>${t('dashboard.underReview')}:</strong>
              <div class="stat-value">${stats.underReview}</div>
            </div>
            <div class="stat-card">
              <strong>${i18n.language === 'ar' ? 'معدل الإنجاز' : 'Completion Rate'}:</strong>
              <div class="stat-value">${completionRate}%</div>
            </div>
            <div class="stat-card">
              <strong>${t('dashboard.totalEntities')}:</strong>
              <div class="stat-value">${stats.totalEntities}</div>
            </div>
            <div class="stat-card">
              <strong>${t('dashboard.totalUsers')}:</strong>
              <div class="stat-value">${stats.totalUsers}</div>
            </div>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  const exportToExcel = () => {
    const csvContent = [
      [i18n.language === 'ar' ? 'المقياس' : 'Metric', i18n.language === 'ar' ? 'القيمة' : 'Value'],
      [t('dashboard.totalCorrespondences'), stats.totalCorrespondences],
      [t('dashboard.incoming'), stats.incomingCount],
      [t('dashboard.outgoing'), stats.outgoingCount],
      [t('dashboard.pendingReview'), stats.pendingReview],
      [t('dashboard.underReview'), stats.underReview],
      [i18n.language === 'ar' ? 'معدل الإنجاز' : 'Completion Rate', `${completionRate}%`],
      [t('dashboard.totalEntities'), stats.totalEntities],
      [t('dashboard.totalUsers'), stats.totalUsers],
      [t('dashboard.thisMonth'), stats.thisMonthCount],
    ]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `correspondence-report-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(i18n.language === 'ar' ? 'تم تصدير التقرير بنجاح' : 'Report exported successfully');
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">{t('nav.reports')}</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportToPDF}>
            <FileText className="mr-2 h-4 w-4" />
            {i18n.language === 'ar' ? 'تصدير PDF' : 'Export PDF'}
          </Button>
          <Button variant="outline" onClick={exportToExcel}>
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            {i18n.language === 'ar' ? 'تصدير Excel' : 'Export Excel'}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.totalCorrespondences')}</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCorrespondences}</div>
            <p className="text-xs text-muted-foreground">
              {stats.thisMonthCount} {t('dashboard.thisMonth')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.incoming')}</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.incomingCount}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalCorrespondences > 0
                ? ((stats.incomingCount / stats.totalCorrespondences) * 100).toFixed(1)
                : 0}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.outgoing')}</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.outgoingCount}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalCorrespondences > 0
                ? ((stats.outgoingCount / stats.totalCorrespondences) * 100).toFixed(1)
                : 0}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.pendingReview')}</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingReview}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalCorrespondences > 0
                ? ((stats.pendingReview / stats.totalCorrespondences) * 100).toFixed(1)
                : 0}% pending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.underReview')}</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.underReview}</div>
            <p className="text-xs text-muted-foreground">Currently reviewing</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completionRate}%</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalCorrespondences - stats.pendingReview - stats.underReview} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.totalEntities')}</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEntities}</div>
            <p className="text-xs text-muted-foreground">Active entities</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.totalUsers')}</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">Active users</p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Total Correspondences:</span>
              <span className="font-semibold">{stats.totalCorrespondences}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Incoming:</span>
              <span className="font-semibold">{stats.incomingCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Outgoing:</span>
              <span className="font-semibold">{stats.outgoingCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">This Month:</span>
              <span className="font-semibold">{stats.thisMonthCount}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm text-muted-foreground">Completed:</span>
              </div>
              <span className="font-semibold">
                {stats.totalCorrespondences - stats.pendingReview - stats.underReview}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-yellow-500" />
                <span className="text-sm text-muted-foreground">Pending Review:</span>
              </div>
              <span className="font-semibold">{stats.pendingReview}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-500" />
                <span className="text-sm text-muted-foreground">Under Review:</span>
              </div>
              <span className="font-semibold">{stats.underReview}</span>
            </div>
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Completion Rate:</span>
                <span className="text-lg font-bold">{completionRate}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
