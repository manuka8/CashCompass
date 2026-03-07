import React, { createContext, useState, useEffect } from 'react';

export const ThemeContext = createContext();

export const THEMES = {
    light: {
        mode: 'light',
        primary: '#2ECC71',
        secondary: '#27AE60',
        background: '#F5F7FA',
        card: '#FFFFFF',
        text: '#2C3E50',
        subtext: '#64748B',
        border: '#E2E8F0',
        shadow: '#000000',
        logo: require('../../assets/logo_light.png'),
    },
    dark: {
        mode: 'dark',
        primary: '#2ECC71',
        secondary: '#27AE60',
        background: '#121212',
        card: '#1E1E1E',
        text: '#FFFFFF',
        subtext: '#94A3B8',
        border: '#2D2D2D',
        shadow: '#000000',
        logo: require('../../assets/logo_dark.png'),
    },
};

export const ThemeProvider = ({ children }) => {
    const [currentTheme, setCurrentTheme] = useState(THEMES.light);

    const toggleTheme = () => {
        setCurrentTheme((prevTheme) =>
            prevTheme.mode === 'light' ? THEMES.dark : THEMES.light
        );
    };

    return (
        <ThemeContext.Provider value={{ theme: currentTheme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};
