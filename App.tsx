
import React, { useState, useMemo } from 'react';
import ChatBot from './components/ChatBot';
import TextProcessor from './components/TextProcessor';
import { Icon } from './components/common/Icon';
import { useTranslation } from './contexts/LanguageContext';

type View = 'chat' | 'processor';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<View>('chat');
  const { t, language, setLanguage } = useTranslation();

  const NavButton = useMemo(() => {
    return <T,>({ view, label, icon }: { view: View, label: string, icon: 'chat' | 'sparkles' }) => (
      <button
        onClick={() => setActiveView(view)}
        className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${
          activeView === view
            ? 'bg-gray-700 text-white'
            : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
        }`}
      >
        <Icon name={icon} className="w-5 h-5" />
        {label}
      </button>
    );
  }, [activeView]);

  return (
    <div className="flex flex-col h-screen antialiased bg-gray-900 text-gray-100">
      <header className="flex items-center justify-between bg-gray-800 border-b border-gray-700 p-4">
        <div className="w-1/4"></div> {/* Spacer */}
        <h1 className="w-1/2 text-xl text-center font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
          {t('app.title')}
        </h1>
        <div className="w-1/4 flex justify-end">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as 'en' | 'vi')}
            className="bg-gray-700 border border-gray-600 rounded-md px-2 py-1 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Select language"
          >
            <option value="en">English</option>
            <option value="vi">Tiếng Việt</option>
          </select>
        </div>
      </header>
      
      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="flex border-b border-gray-700">
          <NavButton view="chat" label={t('app.navChat')} icon="chat" />
          <NavButton view="processor" label={t('app.navProcessor')} icon="sparkles" />
        </div>

        <div className="flex-1 overflow-y-auto">
          {activeView === 'chat' && <ChatBot />}
          {activeView === 'processor' && <TextProcessor />}
        </div>
      </main>
      
      <footer className="bg-gray-800 border-t border-gray-700 text-center p-2 text-xs text-gray-500">
        {t('app.footer')}
      </footer>
    </div>
  );
};

export default App;