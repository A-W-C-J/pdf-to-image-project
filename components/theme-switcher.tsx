"use client"

import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface ThemeSwitcherProps {
  currentTheme: "light" | "dark"
  onThemeChange: (theme: "light" | "dark") => void
  language?: "zh" | "en"
}

export function ThemeSwitcher({ currentTheme, onThemeChange, language = "zh" }: ThemeSwitcherProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 bg-transparent">
          {currentTheme === "light" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          {language === "zh" ? "主题" : "Theme"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onThemeChange("light")}>
          <Sun className="mr-2 h-4 w-4" />
          {language === "zh" ? "浅色主题" : "Light"}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onThemeChange("dark")}>
          <Moon className="mr-2 h-4 w-4" />
          {language === "zh" ? "深色主题" : "Dark"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
