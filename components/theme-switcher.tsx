"use client"

import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface ThemeSwitcherProps {
  currentTheme: "light" | "dark"
  onThemeChange: (theme: "light" | "dark") => void
}

export function ThemeSwitcher({ currentTheme, onThemeChange }: ThemeSwitcherProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          {currentTheme === "light" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          <span className="sr-only">切换主题</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onThemeChange("light")}>
          <Sun className="mr-2 h-4 w-4" />
          浅色主题
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onThemeChange("dark")}>
          <Moon className="mr-2 h-4 w-4" />
          深色主题
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
