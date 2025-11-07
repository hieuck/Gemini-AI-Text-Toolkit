import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
// Fix: Import SpeechRecognition type to resolve TypeScript error.
import { SpeechRecognition } from '../types';
import { getPredefinedPrompts } from '../constants';
import { processText } from '../services/geminiService';
import { Icon } from './common/Icon';
import { Spinner } from './common/Spinner';
import { useTranslation } from '../contexts/LanguageContext';

const TextProcessor: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [output, setOutput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [translationSearch, setTranslationSearch] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isRecognitionReady, setIsRecognitionReady] = useState(false);
  const [isPasteReady, setIsPasteReady] = useState(false);
  const { t, language } = useTranslation();

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const hasContent = useMemo(() => !!inputText || !!output, [inputText, output]);

  useEffect(() => {
    // Check for clipboard API support
    if (navigator.clipboard?.readText) {
        setIsPasteReady(true);
    } else {
        console.warn("Clipboard read API not supported in this browser.");
        setIsPasteReady(false);
    }

    // Fix: Remove `(window as any)` as types are now declared globally.
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn("Speech recognition not supported in this browser.");
      setIsRecognitionReady(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = language === 'vi' ? 'vi-VN' : 'en-US';

    recognition.onstart = () => {
      setIsRecording(true);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      setIsRecording(false);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      // Fix: Use requestAnimationFrame to ensure the state update is handled in the next paint cycle,
      // which can resolve rendering issues with some browser APIs.
      requestAnimationFrame(() => {
        setInputText(prev => prev ? `${prev} ${transcript}`.trim() : transcript);
      });
    };
    
    recognitionRef.current = recognition;
    setIsRecognitionReady(true);

    return () => {
        if (recognition) {
            recognition.stop();
        }
    }
  }, [language]);


  const handleToggleRecording = () => {
    const recognition = recognitionRef.current;
    if (!recognition) return;

    if (isRecording) {
      recognition.stop();
    } else {
      recognition.start();
    }
  };

  const handlePasteFromClipboard = useCallback(async () => {
    if (!isPasteReady || isLoading) return;
    try {
        const text = await navigator.clipboard.readText();
        if (text) {
            setInputText(text);
        }
    } catch (err) {
        console.error('Failed to paste from clipboard:', err);
        setOutput(t('processor.pasteError'));
    }
  }, [isPasteReady, isLoading, t]);

  const PROMPTS = useMemo(() => getPredefinedPrompts(t), [t]);
  
  const handleAction = useCallback(async (prompt: string, text: string) => {
    if (!text.trim() || isLoading) {
      return;
    }
    
    setIsLoading(true);
    setOutput('');

    try {
      const result = await processText(prompt, text);
      setOutput(result);
    } catch (error) {
      setOutput(t('processor.errorMessage'));
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, t]);
  
  const handleActionClick = (promptToUse: string) => {
    handleAction(promptToUse, inputText);
  }

  const handleCopyToClipboard = useCallback(() => {
    if (!output || isCopied) return;

    navigator.clipboard.writeText(output).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }).catch(err => {
      console.error('Failed to copy text: ', err);
    });
  }, [output, isCopied]);

  const handleClearAll = useCallback(() => {
    setInputText('');
    setOutput('');
  }, []);

  const toggleMenu = (id: string) => {
    setOpenMenu(openMenu === id ? null : id);
    if (openMenu !== id) {
        setTranslationSearch('');
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto flex flex-col gap-6">
      {/* Input and Output Section */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Input Column */}
        <div className="flex flex-col gap-2">
            <label htmlFor="inputText" className="font-semibold text-gray-700 dark:text-gray-300">
                {t('processor.inputTextLabel')}
            </label>
            <div className="relative flex-1 flex">
                <div className="absolute top-2 right-2 flex items-center gap-2 z-10">
                    {hasContent && (
                        <button
                            onClick={handleClearAll}
                            className="p-2 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-gray-800 focus-visible:ring-blue-400 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-red-200 dark:hover:bg-red-800/50 hover:text-red-600 dark:hover:text-red-400 disabled:opacity-50"
                            aria-label={t('processor.prompts.clearAll')}
                            title={t('processor.prompts.clearAll')}
                            disabled={isLoading}
                        >
                            <Icon name="trash" className="w-5 h-5" />
                        </button>
                    )}
                    {isPasteReady && (
                        <button
                            onClick={handlePasteFromClipboard}
                            className="p-2 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-gray-800 focus-visible:ring-blue-400 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50"
                            aria-label={t('processor.pasteFromClipboard')}
                            title={t('processor.pasteFromClipboard')}
                            disabled={isLoading}
                        >
                            <Icon name="paste" className="w-5 h-5" />
                        </button>
                    )}
                    {isRecognitionReady && (
                        <button
                            onClick={handleToggleRecording}
                            className={`p-2 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-gray-800 focus-visible:ring-blue-400 ${
                                isRecording 
                                ? 'bg-red-600 text-white animate-pulse' 
                                : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                            }`}
                            aria-label={t(isRecording ? 'processor.stopRecording' : 'processor.startRecording')}
                            title={t(isRecording ? 'processor.stopRecording' : 'processor.startRecording')}
                            disabled={isLoading}
                        >
                            <Icon name="microphone" className="w-5 h-5" />
                        </button>
                    )}
                </div>
                <textarea
                    id="inputText"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder={t('processor.inputPlaceholder')}
                    className="w-full min-h-[20rem] p-4 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-800 dark:text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow shadow-sm"
                    disabled={isLoading}
                />
            </div>
        </div>
        {/* Output Column */}
        <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
                <label className="font-semibold text-gray-700 dark:text-gray-300">
                    {t('processor.outputTextLabel')}
                </label>
                <button
                    onClick={handleCopyToClipboard}
                    disabled={!output || isLoading || isCopied}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-gray-800 focus-visible:ring-blue-400 ${
                    isCopied
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                    aria-label={isCopied ? t('processor.copied') : t('processor.copyToClipboard')}
                    >
                    <Icon name={isCopied ? 'check' : 'copy'} className="w-4 h-4" />
                    {isCopied ? t('processor.copied') : t('processor.copy')}
                </button>
            </div>
            <div
                id="outputText"
                className="w-full flex-1 p-4 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl overflow-y-auto shadow-sm"
            >
                {isLoading ? (
                <div className="flex items-center justify-center h-full min-h-[20rem]">
                    <Spinner />
                </div>
                ) : (
                <pre className="whitespace-pre-wrap text-sm text-gray-800 dark:text-gray-200">{output || <span className="text-gray-400 dark:text-gray-500">{t('processor.outputPlaceholder')}</span>}</pre>
                )}
            </div>
        </div>
      </div>
      
      {/* Controls Section */}
      <div className="space-y-4">
        <h3 className="font-semibold text-center text-gray-700 dark:text-gray-300 mb-3">{t('processor.actionLabel')}</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-8 gap-3">
          {PROMPTS.map((prompt) =>
            prompt.isMenu ? (
              <div key={prompt.id} className="relative">
                <button
                  onClick={() => toggleMenu(prompt.id)}
                  disabled={isLoading || !inputText.trim()}
                  className="w-full flex flex-col items-center justify-center text-center gap-2 p-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Icon name={prompt.icon} className="w-6 h-6 text-blue-500" />
                  <span className="text-sm font-medium">{prompt.label}</span>
                </button>
                {openMenu === prompt.id && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 w-64 mb-2 z-20">
                    <div className="flex flex-col p-2 bg-white dark:bg-gray-700 rounded-lg shadow-xl border border-gray-200 dark:border-gray-600">
                      {prompt.id === 'translate' && (
                        <div className="relative p-1">
                          <span className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                              <Icon name="search" className="w-4 h-4 text-gray-500" />
                          </span>
                          <input
                              type="text"
                              placeholder={t('processor.searchLanguagePlaceholder')}
                              value={translationSearch}
                              onChange={(e) => setTranslationSearch(e.target.value)}
                              className="w-full pl-9 pr-3 py-1.5 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md text-gray-800 dark:text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                              autoFocus
                          />
                        </div>
                      )}
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
                            className="w-full text-left p-2 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
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
                className="flex flex-col items-center justify-center text-center gap-2 p-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Icon name={prompt.icon} className="w-6 h-6 text-blue-500" />
                <span className="text-sm font-medium">{prompt.label}</span>
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default TextProcessor;
