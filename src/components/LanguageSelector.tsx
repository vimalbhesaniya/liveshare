import { useTranslation } from "react-i18next";
import { Globe } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { languages } from "@/i18n";

export function LanguageSelector() {
  const { i18n } = useTranslation();

  const handleLanguageChange = (value: string) => {
    i18n.changeLanguage(value);
  };

  const currentLang = languages.find((l) => l.code === i18n.language) || languages[0];

  return (
    <Select value={i18n.language} onValueChange={handleLanguageChange}>
      <SelectTrigger
        className="w-auto gap-1.5 px-2 sm:px-3 h-9 border-border/60 bg-background/50 hover:bg-accent/50 transition-colors"
        aria-label="Select language"
      >
        <Globe className="h-4 w-4 text-muted-foreground" />
        <SelectValue>
          <span className="hidden sm:inline text-sm">{currentLang.flag} {currentLang.nativeName}</span>
          <span className="sm:hidden text-sm">{currentLang.flag}</span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="max-h-[400px] min-w-[200px]">
        {languages.map((lang) => (
          <SelectItem
            key={lang.code}
            value={lang.code}
            className="cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <span className="text-base">{lang.flag}</span>
              <span className="font-medium">{lang.nativeName}</span>
              {lang.nativeName !== lang.name && (
                <span className="text-muted-foreground text-xs">({lang.name})</span>
              )}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
