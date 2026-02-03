export type ThemeMode = 'light' | 'dark' | 'ambient' | 'midnight' | 'graphite' | 'aurora' | 'focus' | 'high-contrast';
export interface ThemeContextType {
    theme: ThemeMode;
    setTheme: (theme: ThemeMode) => void;
    toggleTheme: () => void;
}
