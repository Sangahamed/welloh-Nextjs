"use client";

import { useLocale } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Globe } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function LanguageSwitcher() {
  const { locale, setLocale } = useLocale();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10">
          <Globe className="w-4 h-4 mr-2" />
          {locale.toUpperCase()}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="bg-black/80 border-cyan-500/20">
        <DropdownMenuItem
          onClick={() => setLocale('en')}
          className={`text-cyan-200 hover:bg-cyan-500/10 ${locale === 'en' ? 'bg-cyan-500/20' : ''}`}
        >
          🇺🇸 English
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setLocale('fr')}
          className={`text-cyan-200 hover:bg-cyan-500/10 ${locale === 'fr' ? 'bg-cyan-500/20' : ''}`}
        >
          🇫🇷 Français
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}