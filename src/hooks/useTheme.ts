import { useEffect, useState } from 'react';

type Theme = 'dark' | 'light' | 'auto';
type AccentColor = 'cyan' | 'green' | 'purple' | 'orange';

interface DisplaySettings {
  theme: Theme;
  accentColor: AccentColor;
  compactMode: boolean;
  showAnimations: boolean;
}

const ACCENT_COLORS: Record<AccentColor, { primary: string; accent: string; ring: string }> = {
  cyan: {
    primary: '190 100% 50%',
    accent: '190 100% 45%',
    ring: '190 100% 50%',
  },
  green: {
    primary: '160 84% 45%',
    accent: '160 84% 40%',
    ring: '160 84% 45%',
  },
  purple: {
    primary: '270 70% 60%',
    accent: '270 70% 55%',
    ring: '270 70% 60%',
  },
  orange: {
    primary: '25 95% 53%',
    accent: '25 95% 48%',
    ring: '25 95% 53%',
  },
};

export const useTheme = () => {
  const [settings, setSettings] = useState<DisplaySettings>(() => {
    const stored = localStorage.getItem('display_settings');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        // fallback
      }
    }
    return {
      theme: 'dark',
      accentColor: 'purple',
      compactMode: false,
      showAnimations: true,
    };
  });

  // Apply theme
  useEffect(() => {
    const root = document.documentElement;
    
    // Handle theme
    if (settings.theme === 'auto') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.toggle('dark', prefersDark);
      root.classList.toggle('light', !prefersDark);
    } else {
      root.classList.toggle('dark', settings.theme === 'dark');
      root.classList.toggle('light', settings.theme === 'light');
    }

    // Apply accent color
    const accent = ACCENT_COLORS[settings.accentColor] || ACCENT_COLORS.cyan;
    root.style.setProperty('--primary', accent.primary);
    root.style.setProperty('--accent', accent.accent);
    root.style.setProperty('--ring', accent.ring);
    root.style.setProperty('--sidebar-primary', accent.primary);
    root.style.setProperty('--sidebar-ring', accent.ring);

    // Apply compact mode
    if (settings.compactMode) {
      root.style.setProperty('--compact-spacing', '0.5');
      root.classList.add('compact-mode');
    } else {
      root.style.setProperty('--compact-spacing', '1');
      root.classList.remove('compact-mode');
    }

    // Apply animations toggle
    if (!settings.showAnimations) {
      root.classList.add('no-animations');
    } else {
      root.classList.remove('no-animations');
    }

    // Listen for auto theme changes
    if (settings.theme === 'auto') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = (e: MediaQueryListEvent) => {
        root.classList.toggle('dark', e.matches);
        root.classList.toggle('light', !e.matches);
      };
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    }
  }, [settings]);

  const updateSettings = (newSettings: Partial<DisplaySettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      localStorage.setItem('display_settings', JSON.stringify(updated));
      return updated;
    });
  };

  return { settings, updateSettings };
};

export default useTheme;
