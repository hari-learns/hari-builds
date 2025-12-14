"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

type Theme = 'minimal' | 'tech';

interface ThemeContextType {
    theme: Theme;
    toggleTheme: () => void;
    isTech: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
    const [theme, setTheme] = useState<Theme>('minimal');

    // Load saved theme from local storage on mount
    useEffect(() => {
        const savedTheme = localStorage.getItem('portfolio-theme') as Theme;
        if (savedTheme) {
            setTheme(savedTheme);
        }
    }, []);

    // Update body class when theme changes
    useEffect(() => {
        document.body.classList.remove('tech-mode', 'minimal-mode');
        document.body.classList.add(`${theme}-mode`);
        localStorage.setItem('portfolio-theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        if (theme === 'minimal') {
            setTheme('tech');
        } else {
            setTheme('minimal');
        }
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme, isTech: theme === 'tech' }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
