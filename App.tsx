import React, { useState, useMemo, useCallback } from 'react';
import ChatBot from './components/ChatBot';
import TextProcessor from './components/TextProcessor';
import { Icon } from './components/common/Icon';
import { useTranslation } from './contexts/LanguageContext';
import { useTheme } from './contexts/ThemeContext';

type View = 'chat' | 'processor';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<View>('chat');
  const { t, language, setLanguage } = useTranslation();
  const { themeSetting, setThemeSetting } = useTheme();

  const NavButton = useMemo(() => {
    return <T,>({ view, label, icon }: { view: View, label: string, icon: 'chat' | 'sparkles' }) => (
      <button
        onClick={() => setActiveView(view)}
        className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${
          activeView === view
            ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white'
            : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
        }`}
      >
        <Icon name={icon} className="w-5 h-5" />
        {label}
      </button>
    );
  }, [activeView]);

  const handleThemeChange = useCallback(() => {
    const sequence: ('auto' | 'light' | 'dark')[] = ['auto', 'light', 'dark'];
    const currentIndex = sequence.indexOf(themeSetting);
    const nextIndex = (currentIndex + 1) % sequence.length;
    setThemeSetting(sequence[nextIndex]);
  }, [themeSetting, setThemeSetting]);

  const themeIcon = useMemo(() => {
    if (themeSetting === 'auto') return 'desktop';
    if (themeSetting === 'light') return 'sun';
    return 'moon';
  }, [themeSetting]);
  
  const themeLabel = useMemo(() => {
     if (themeSetting === 'auto') return t('app.themeAuto');
     if (themeSetting === 'light') return t('app.themeLight');
     return t('app.themeDark');
  }, [themeSetting, t]);

  return (
    <div className="flex flex-col h-screen antialiased bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <header className="flex items-center justify-between bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="w-1/4"></div> {/* Spacer */}
        <h1 className="w-1/2 text-xl text-center font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-600 dark:from-blue-400 dark:to-purple-500">
          {t('app.title')}
        </h1>
        <div className="w-1/4 flex justify-end items-center gap-4">
          <button
            onClick={handleThemeChange}
            className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-800 focus:ring-blue-500"
            aria-label={`${t('app.themeToggle')}: ${themeLabel}`}
          >
            <Icon name={themeIcon} className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as 'en' | 'vi')}
            className="bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1 text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Select language"
          >
            <option value="en">English</option>
            <option value="vi">Tiếng Việt</option>
          </select>
        </div>
      </header>
      
      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <NavButton view="chat" label={t('app.navChat')} icon="chat" />
          <NavButton view="processor" label={t('app.navProcessor')} icon="sparkles" />
        </div>

        <div className="flex-1 overflow-y-auto">
          {activeView === 'chat' && <ChatBot />}
          {activeView === 'processor' && <TextProcessor />}
        </div>
      </main>
      
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 text-center p-2 text-xs text-gray-500">
        {t('app.footer')}
      </footer>
    </div>
  );
};

export default App;