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

  const NavButton = useCallback(({ view, label, icon }: { view: View, label: string, icon: 'chat' | 'sparkles' }) => (
    <button
      onClick={() => setActiveView(view)}
      className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-md ${
        activeView === view
          ? 'bg-white dark:bg-gray-700/50 text-gray-900 dark:text-white shadow-sm'
          : 'text-gray-500 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-gray-700/30'
      }`}
      aria-current={activeView === view}
    >
      <Icon name={icon} className="w-5 h-5" />
      {label}
    </button>
  ), [activeView]);


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

  const handleLanguageChange = useCallback(() => {
    setLanguage(language === 'en' ? 'vi' : 'en');
  }, [language, setLanguage]);


  return (
    <div className="flex flex-col h-screen antialiased bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans">
      <header className="flex items-center justify-between bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700/50 p-3 sticky top-0 z-20">
        <div className="w-1/4"></div> {/* Spacer */}
        <h1 className="w-1/2 text-lg text-center font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-600 dark:from-blue-400 dark:to-purple-500">
          {t('app.title')}
        </h1>
        <div className="w-1/4 flex justify-end items-center gap-2">
          <button
            onClick={handleThemeChange}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-800 focus:ring-blue-500"
            aria-label={`${t('app.themeToggle')}: ${themeLabel}`}
            title={`${t('app.themeToggle')}: ${themeLabel}`}
          >
            <Icon name={themeIcon} className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          <button
            onClick={handleLanguageChange}
            className="p-2 w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-800 focus:ring-blue-500"
            aria-label="Change language"
            title="Change language"
          >
            <span className="text-xs font-bold text-gray-600 dark:text-gray-400">{language.toUpperCase()}</span>
          </button>
        </div>
      </header>
      
      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="p-2">
            <div className="flex items-center bg-gray-200 dark:bg-gray-800 rounded-lg p-1 gap-1 max-w-sm mx-auto">
                <NavButton view="chat" label={t('app.navChat')} icon="chat" />
                <NavButton view="processor" label={t('app.navProcessor')} icon="sparkles" />
            </div>
        </div>


        <div className="flex-1 overflow-y-auto">
          {activeView === 'chat' && <ChatBot />}
          {activeView === 'processor' && <TextProcessor />}
        </div>
      </main>
    </div>
  );
};

export default App;
