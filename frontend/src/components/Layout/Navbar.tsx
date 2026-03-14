import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { LogOut, Globe } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import logoImage from '../../../../logo.png';

export default function Navbar() {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'ar' ? 'en' : 'ar';
    i18n.changeLanguage(newLang);
    document.documentElement.lang = newLang;
    document.documentElement.dir = newLang === 'ar' ? 'rtl' : 'ltr';
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="border-b border-slate-200 bg-white">
      <div className="flex h-16 items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <img
            src={logoImage}
            alt={i18n.language === 'ar' ? 'شعار الشركة' : 'Company logo'}
            className="h-10 w-10 rounded-full object-cover ring-2 ring-slate-200"
          />
          <div>
            <h1 className="text-lg font-bold leading-tight text-slate-800">
              {t('app.name')}
            </h1>
            <p className="text-[10px] font-medium leading-none text-slate-500">
              الشركة القابضة للصناعات الغدائية
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleLanguage}
            className="text-slate-600 hover:bg-slate-100 hover:text-slate-800"
          >
            <Globe className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5">
            <span className="text-sm font-medium text-slate-700">
              {user?.full_name_ar}
            </span>
            <span className="text-xs text-slate-500">
              ({user?.role})
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="text-slate-600 hover:bg-red-50 hover:text-red-600"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </nav>
  );
}
