import React, { useState, useCallback, useMemo } from 'react';
import { getPredefinedPrompts } from '../constants';
import { processText } from '../services/geminiService';
import { Icon } from './common/Icon';
import { Spinner } from './common/Spinner';
import { useTranslation } from '../contexts/LanguageContext';

// Fix: Removed apiKey prop as it is now handled by the geminiService.
const TextProcessor: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [output, setOutput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [translationSearch, setTranslationSearch] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const { t } = useTranslation();

  const PROMPTS = useMemo(() => getPredefinedPrompts(t), [t]);

  const handleActionClick = useCallback(async (promptToUse: string) => {
    if (!inputText.trim() || isLoading) {
      return;
    }
    
    setIsLoading(true);
    setOutput('');
    setIsCopied(false);

    try {
      // Fix: Call processText without apiKey.
      const result = await processText(promptToUse, inputText);
      setOutput(result);
    } catch (error) {
      setOutput(t('processor.errorMessage'));
    } finally {
      setIsLoading(false);
    }
  }, [inputText, isLoading, t]);

  const handleCopy = () => {
    if (output) {
      navigator.clipboard.writeText(output);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const toggleMenu = (id: string) => {
    setOpenMenu(openMenu === id ? null : id);
    if (openMenu !== id) {
        setTranslationSearch('');
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Input Section */}
        <div className="flex flex-col gap-4">
          <label htmlFor="inputText" className="font-semibold text-gray-300">
            {t('processor.inputTextLabel')}
          </label>
          <textarea
            id="inputText"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={t('processor.inputPlaceholder')}
            className="w-full h-48 md:h-64 p-3 bg-gray-800 border border-gray-600 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
            disabled={isLoading}
          />
        </div>

        {/* Output Section */}
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <label htmlFor="outputText" className="font-semibold text-gray-300">
              {t('processor.outputTextLabel')}
            </label>
            {output && !isLoading && (
              <button 
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded-md transition-colors"
                >
                <Icon name={isCopied ? 'check' : 'copy'} className="w-3.5 h-3.5" />
                {isCopied ? t('processor.copied') : t('processor.copy')}
              </button>
            )}
          </div>
          <div
            id="outputText"
            className="relative w-full h-48 md:h-64 p-3 bg-gray-800 border border-gray-600 rounded-lg text-gray-200 overflow-y-auto"
          >
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <Spinner />
              </div>
            ) : (
              <pre className="whitespace-pre-wrap text-sm">{output}</pre>
            )}
          </div>
        </div>
      </div>

      {/* Controls Section */}
      <div className="space-y-2">
        <h3 className="font-semibold text-gray-300 mb-3">{t('processor.actionLabel')}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
          {PROMPTS.map((prompt) =>
            prompt.isMenu ? (
              <div key={prompt.id} className="relative sm:col-span-1 md:col-span-1">
                <button
                  onClick={() => toggleMenu(prompt.id)}
                  disabled={isLoading}
                  className="w-full flex items-center justify-between p-3 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Icon name={prompt.icon} className="w-5 h-5 text-gray-400" />
                    <span className="font-medium">{prompt.label}</span>
                  </div>
                  <Icon name="chevron-down" className={`w-5 h-5 transition-transform ${openMenu === prompt.id ? 'rotate-180' : ''}`} />
                </button>
                {openMenu === prompt.id && (
                   <div className="absolute bottom-full left-0 w-full mb-2 z-10">
                    <div className="flex flex-col p-2 bg-gray-700 rounded-lg shadow-xl">
                      <div className="relative p-1">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                            <Icon name="search" className="w-4 h-4 text-gray-500" />
                        </span>
                        <input
                            type="text"
                            placeholder={t('processor.searchLanguagePlaceholder')}
                            value={translationSearch}
                            onChange={(e) => setTranslationSearch(e.target.value)}
                            className="w-full pl-9 pr-3 py-1.5 bg-gray-800 border border-gray-600 rounded-md text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                            autoFocus
                        />
                      </div>
                      <div className="max-h-48 overflow-y-auto space-y-1 mt-1">
                        {prompt.subActions
                          ?.filter(subAction => subAction.label.toLowerCase().includes(translationSearch.toLowerCase()))
                          .map((subAction) => (
                          <button
                            key={subAction.id}
                            onClick={() => {
                              handleActionClick(subAction.prompt);
                              setOpenMenu(null);
                            }}
                            disabled={isLoading || !inputText.trim()}
                            className="w-full text-left p-2 rounded-md text-gray-300 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {subAction.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                key={prompt.id}
                onClick={() => handleActionClick(prompt.prompt || '')}
                disabled={isLoading || !inputText.trim()}
                className="flex items-center gap-3 p-3 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Icon name={prompt.icon} className="w-5 h-5 text-gray-400" />
                <span className="font-medium">{prompt.label}</span>
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default TextProcessor;