'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { ThemeMode, ThemeContextType } from '@/lib/theme';
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);
export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setThemeState] = useState<ThemeMode>('dark');
    useEffect(() => {
        const savedTheme = localStorage.getItem('aletheon-theme') as ThemeMode;
        let initialTheme: ThemeMode = 'dark';
        if (savedTheme && ['light', 'dark', 'ambient'].includes(savedTheme)) {
            initialTheme = savedTheme;
        } else if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: light)').matches) {
            initialTheme = 'light';
        }
        if (initialTheme !== 'dark') setThemeState(initialTheme);
    }, []);
    const setTheme = (newTheme: ThemeMode) => {
        setThemeState(newTheme);
        localStorage.setItem('aletheon-theme', newTheme);
    };
    const toggleTheme = () => {
        const modes: ThemeMode[] = ['light', 'dark', 'ambient'];
        const currentIndex = modes.indexOf(theme);
        const nextIndex = (currentIndex + 1) % modes.length;
        setTheme(modes[nextIndex]);
    };
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        document.body.className = `theme-${theme}`;
    }, [theme]);
    return (
        <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}
export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) throw new Error('useTheme must be used within a ThemeProvider');
    return context;
}
