import { useTranslation } from "react-i18next";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Globe } from "lucide-react";

const languages = [
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "es", name: "Español", flag: "🇪🇸" },
  { code: "fr", name: "Français", flag: "🇫🇷" },
  { code: "de", name: "Deutsch", flag: "🇩🇪" },
  { code: "pt", name: "Português", flag: "🇵🇹" },
  { code: "da", name: "Dansk", flag: "🇩🇰" },
];

export function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const handleLanguageChange = (langCode: string) => {
    i18n.changeLanguage(langCode);
    // Language preference will be synced with database via user settings
    // Zero autocomplete cache will reload for new language
  };

  const currentLanguage = languages.find((lang) => lang.code === i18n.language);

  return (
    <Select value={i18n.language} onValueChange={handleLanguageChange}>
      <SelectTrigger className="w-[140px] border-2 border-foreground font-black uppercase text-xs">
        <Globe className="w-4 h-4 mr-2" />
        <SelectValue>
          {currentLanguage?.flag} {currentLanguage?.name}
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="border-4 border-foreground shadow-[4px_4px_0px_0px_rgba(31,41,55,1)]">
        {languages.map((lang) => (
          <SelectItem
            key={lang.code}
            value={lang.code}
            className="font-bold uppercase text-xs"
          >
            {lang.flag} {lang.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
