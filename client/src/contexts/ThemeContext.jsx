import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    // Initialize theme from local storage or default to 'system'
    const [theme, setTheme] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('tip_ai_theme') || 'system';
        }
        return 'system';
    });

    useEffect(() => {
        const root = window.document.documentElement;

        const syncTheme = () => {
            const isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            const effectiveIsDark = theme === 'dark' || (theme === 'system' && isSystemDark);

            root.classList.toggle('dark', effectiveIsDark);
            root.classList.toggle('light', !effectiveIsDark);
        };

        syncTheme();
        localStorage.setItem('tip_ai_theme', theme);

        // Listener for system changes if mode is 'system'
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = () => {
            if (theme === 'system') syncTheme();
        };

        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, [theme]);

    return (
        <ThemeContext.Provider value={{ theme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
