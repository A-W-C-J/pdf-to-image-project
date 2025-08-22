"use client"

import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { translations, type Language, type TranslationKey } from "@/lib/i18n"

interface ThemeSwitcherProps {
  currentTheme: "light" | "dark"
  onThemeChange: (theme: "light" | "dark") => void
  language: Language
}

export function ThemeSwitcher({ currentTheme, onThemeChange, language }: ThemeSwitcherProps) {
  const t = (key: TranslationKey): string => translations[language][key]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          {currentTheme === "light" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          <span className="sr-only">{t("toggleTheme")}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onThemeChange("light")}>
          <Sun className="mr-2 h-4 w-4" />
          {t("lightTheme")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onThemeChange("dark")}>
          <Moon className="mr-2 h-4 w-4" />
          {t("darkTheme")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
