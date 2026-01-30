export type ThemeMode = 'light' | 'dark' | 'ambient';
export interface ThemeContextType {
    theme: ThemeMode;
    setTheme: (theme: ThemeMode) => void;
    toggleTheme: () => void;
}
