import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/authStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { toast } from 'react-toastify';
import { Globe, Moon, Sun, Bell, User, Save } from 'lucide-react';

export default function Settings() {
  const { t, i18n } = useTranslation();
  const { user } = useAuthStore();
  const [language, setLanguage] = useState(i18n.language || 'ar');
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(() => {
    const saved = localStorage.getItem('theme');
    return (saved as 'light' | 'dark' | 'system') || 'system';
  });
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    correspondence: true,
    review: true,
  });

  useEffect(() => {
    // Apply theme
    const root = document.documentElement;
    if (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  const handleLanguageChange = (newLang: string) => {
    setLanguage(newLang);
    i18n.changeLanguage(newLang);
    localStorage.setItem('i18nextLng', newLang);
    document.documentElement.lang = newLang;
    document.documentElement.dir = newLang === 'ar' ? 'rtl' : 'ltr';
    toast.success(i18n.language === 'ar' ? 'تم تغيير اللغة بنجاح' : 'Language changed successfully');
  };

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    toast.success(i18n.language === 'ar' ? 'تم تغيير المظهر بنجاح' : 'Theme changed successfully');
  };

  const handleSaveSettings = () => {
    localStorage.setItem('notifications', JSON.stringify(notifications));
    toast.success(i18n.language === 'ar' ? 'تم حفظ الإعدادات بنجاح' : 'Settings saved successfully');
  };

  useEffect(() => {
    const savedNotifications = localStorage.getItem('notifications');
    if (savedNotifications) {
      try {
        setNotifications(JSON.parse(savedNotifications));
      } catch (e) {
        // Ignore parse errors
      }
    }
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t('nav.settings')}</h1>
        <p className="text-muted-foreground mt-2">
          {i18n.language === 'ar' ? 'إدارة إعدادات حسابك وتفضيلات النظام' : 'Manage your account settings and system preferences'}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* User Profile */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5" />
              <CardTitle>{t('settings.profile', 'Profile Information')}</CardTitle>
            </div>
            <CardDescription>
              {i18n.language === 'ar' ? 'معلومات المستخدم الحالية' : 'Your current user information'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm text-muted-foreground">
                {i18n.language === 'ar' ? 'اسم المستخدم' : 'Username'}
              </Label>
              <p className="font-medium">{user?.username}</p>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">
                {i18n.language === 'ar' ? 'البريد الإلكتروني' : 'Email'}
              </Label>
              <p className="font-medium">{user?.email}</p>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">
                {i18n.language === 'ar' ? 'الاسم الكامل' : 'Full Name'}
              </Label>
              <p className="font-medium">
                {user?.full_name_ar}
              </p>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">
                {i18n.language === 'ar' ? 'الدور' : 'Role'}
              </Label>
              <p className="font-medium">{user?.role}</p>
            </div>
          </CardContent>
        </Card>

        {/* Language Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              <CardTitle>{t('settings.language', 'Language')}</CardTitle>
            </div>
            <CardDescription>
              {i18n.language === 'ar' ? 'اختر لغة الواجهة' : 'Choose your interface language'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>{i18n.language === 'ar' ? 'اللغة' : 'Language'}</Label>
                <select
                  value={language}
                  onChange={(e) => handleLanguageChange(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="ar">العربية</option>
                  <option value="en">English</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Theme Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              {theme === 'dark' ? (
                <Moon className="h-5 w-5" />
              ) : (
                <Sun className="h-5 w-5" />
              )}
              <CardTitle>{t('settings.theme', 'Theme')}</CardTitle>
            </div>
            <CardDescription>
              {i18n.language === 'ar' ? 'اختر مظهر الواجهة' : 'Choose your interface appearance'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>{i18n.language === 'ar' ? 'المظهر' : 'Appearance'}</Label>
                <div className="flex gap-2">
                  <Button
                    variant={theme === 'light' ? 'default' : 'outline'}
                    onClick={() => handleThemeChange('light')}
                    className="flex-1"
                  >
                    <Sun className="mr-2 h-4 w-4" />
                    {i18n.language === 'ar' ? 'فاتح' : 'Light'}
                  </Button>
                  <Button
                    variant={theme === 'dark' ? 'default' : 'outline'}
                    onClick={() => handleThemeChange('dark')}
                    className="flex-1"
                  >
                    <Moon className="mr-2 h-4 w-4" />
                    {i18n.language === 'ar' ? 'داكن' : 'Dark'}
                  </Button>
                  <Button
                    variant={theme === 'system' ? 'default' : 'outline'}
                    onClick={() => handleThemeChange('system')}
                    className="flex-1"
                  >
                    {i18n.language === 'ar' ? 'النظام' : 'System'}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              <CardTitle>{t('settings.notifications', 'Notifications')}</CardTitle>
            </div>
            <CardDescription>
              {i18n.language === 'ar' ? 'إدارة إعدادات الإشعارات' : 'Manage your notification preferences'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{i18n.language === 'ar' ? 'إشعارات البريد الإلكتروني' : 'Email Notifications'}</Label>
                <p className="text-sm text-muted-foreground">
                  {i18n.language === 'ar' ? 'تلقي إشعارات عبر البريد الإلكتروني' : 'Receive notifications via email'}
                </p>
              </div>
              <Switch
                checked={notifications.email}
                onCheckedChange={(checked) =>
                  setNotifications({ ...notifications, email: checked })
                }
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{i18n.language === 'ar' ? 'إشعارات المكاتبات' : 'Correspondence Notifications'}</Label>
                <p className="text-sm text-muted-foreground">
                  {i18n.language === 'ar' ? 'إشعارات عند إنشاء أو تحديث المكاتبات' : 'Notifications for correspondence updates'}
                </p>
              </div>
              <Switch
                checked={notifications.correspondence}
                onCheckedChange={(checked) =>
                  setNotifications({ ...notifications, correspondence: checked })
                }
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{i18n.language === 'ar' ? 'إشعارات المراجعة' : 'Review Notifications'}</Label>
                <p className="text-sm text-muted-foreground">
                  {i18n.language === 'ar' ? 'إشعارات عند طلب المراجعة' : 'Notifications for review requests'}
                </p>
              </div>
              <Switch
                checked={notifications.review}
                onCheckedChange={(checked) =>
                  setNotifications({ ...notifications, review: checked })
                }
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSaveSettings} size="lg">
          <Save className="mr-2 h-4 w-4" />
          {t('settings.save', 'Save Settings')}
        </Button>
      </div>
    </div>
  );
}
