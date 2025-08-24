"use client"

import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Globe, ChevronDown } from "lucide-react"
import type { Language } from "@/lib/i18n"
import styles from "./language-switcher.module.styl"

interface LanguageSwitcherProps {
  currentLanguage: Language
  onLanguageChange: (language: Language) => void
}

export function LanguageSwitcher({ currentLanguage, onLanguageChange }: LanguageSwitcherProps) {
  const languageLabels = {
    zh: "中文",
    en: "English",
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className={styles.triggerButton}>
          <Globe className={styles.icon} />
          {languageLabels[currentLanguage]}
          <ChevronDown className={styles.icon} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => onLanguageChange("zh")}
          className={`${styles.menuItem} ${currentLanguage === "zh" ? styles.active : styles.inactive}`}
        >
          中文
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => onLanguageChange("en")}
          className={`${styles.menuItem} ${currentLanguage === "en" ? styles.active : styles.inactive}`}
        >
          English
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
