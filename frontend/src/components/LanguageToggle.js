import React from 'react';
import { Globe } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

const LanguageToggle = () => {
  const { language, changeLanguage } = useLanguage();

  const handleLanguageChange = async (newLang) => {
    try {
      await changeLanguage(newLang);
      toast.success(
        newLang === 'ro' ? 'Limba schimbată în Română' : 'Language changed to English'
      );
    } catch (error) {
      toast.error('Error changing language');
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-white hover:bg-cyan-500/20 border border-white/10"
        >
          <Globe className="w-4 h-4 mr-2" />
          {language === 'ro' ? 'RO' : 'EN'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700">
        <DropdownMenuItem
          onClick={() => handleLanguageChange('ro')}
          className={`cursor-pointer ${
            language === 'ro' ? 'bg-cyan-500/20 text-cyan-400' : 'text-white'
          } hover:bg-cyan-500/10`}
        >
          🇷🇴 Română
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleLanguageChange('en')}
          className={`cursor-pointer ${
            language === 'en' ? 'bg-cyan-500/20 text-cyan-400' : 'text-white'
          } hover:bg-cyan-500/10`}
        >
          🇬🇧 English
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageToggle;

