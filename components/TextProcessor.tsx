import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { getPredefinedPrompts } from '../constants';
import { processText } from '../services/geminiService';
import { Icon } from './common/Icon';
import { Spinner } from './common/Spinner';
import { useTranslation } from '../contexts/LanguageContext';

// Fix: Add types for the Web Speech API to resolve TypeScript errors.
interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}
interface SpeechRecognitionResult {
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}
interface SpeechRecognitionResultList {
  [index: number]: SpeechRecognitionResult;
  length: number;
}
interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
}
interface SpeechRecognitionErrorEvent {
  error: string;
}
interface SpeechRecognition {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: () => void;
  onend: () => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onresult: (event: SpeechRecognitionEvent) => void;
  start: () => void;
  stop: () => void;
}
declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

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
        recognition.stop();
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
    <div className="p-4 md:p-6 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 items-start gap-4">
        {/* Input Section */}
        <div className="w-full flex flex-col gap-4">
          <div className="flex items-center justify-between min-h-9">
            <label htmlFor="inputText" className="font-semibold text-gray-700 dark:text-gray-300">
              {t('processor.inputTextLabel')}
            </label>
            <div className="flex items-center gap-2">
              {isPasteReady && (
                <button
                  onClick={handlePasteFromClipboard}
                  className="p-2 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-100 dark:focus-visible:ring-offset-gray-900 focus-visible:ring-blue-400 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50"
                  aria-label={t('processor.pasteFromClipboard')}
                  disabled={isLoading}
                >
                  <Icon name="paste" className="w-5 h-5" />
                </button>
              )}
              {isRecognitionReady && (
                <button
                  onClick={handleToggleRecording}
                  className={`p-2 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-100 dark:focus-visible:ring-offset-gray-900 focus-visible:ring-blue-400 ${
                      isRecording 
                      ? 'bg-red-600 text-white animate-pulse' 
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                  }`}
                  aria-label={t(isRecording ? 'processor.stopRecording' : 'processor.startRecording')}
                  disabled={isLoading}
                >
                  <Icon name="microphone" className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
          <textarea
            id="inputText"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={t('processor.inputPlaceholder')}
            className="w-full h-48 md:h-64 p-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-800 dark:text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
            disabled={isLoading}
          />
        </div>

        {/* Output Section */}
        <div className="w-full flex flex-col gap-4">
          <div className="flex items-center justify-between min-h-9">
            <label htmlFor="outputText" className="font-semibold text-gray-700 dark:text-gray-300">
              {t('processor.outputTextLabel')}
            </label>
            <button
              onClick={handleCopyToClipboard}
              disabled={!output || isLoading || isCopied}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-100 dark:focus-visible:ring-offset-gray-900 focus-visible:ring-blue-400 ${
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
            className="w-full h-48 md:h-64 p-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-800 dark:text-gray-200 overflow-y-auto"
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

       {/* Clear All Button */}
       <div className="flex justify-center py-2">
           <button
            onClick={handleClearAll}
            disabled={isLoading || !hasContent}
            className="group p-3 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-colors hover:border-red-500/60 dark:hover:border-red-700/60 hover:bg-red-100/50 dark:hover:bg-red-900/50"
            aria-label={t('processor.prompts.clearAll')}
          >
            <Icon 
              name="trash" 
              className={`w-5 h-5 transition-colors ${hasContent ? 'text-red-500 group-hover:text-red-600 dark:group-hover:text-white' : 'text-gray-400 dark:text-gray-500'}`} 
            />
          </button>
      </div>

      {/* Controls Section */}
      <div className="space-y-2 pt-4">
        <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-3">{t('processor.actionLabel')}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
          {PROMPTS.map((prompt) =>
            prompt.isMenu ? (
              <div key={prompt.id} className="relative sm:col-span-1 md:col-span-1">
                <button
                  onClick={() => toggleMenu(prompt.id)}
                  disabled={isLoading || !inputText.trim()}
                  className="w-full flex items-center justify-between p-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Icon name={prompt.icon} className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                    <span className="font-medium">{prompt.label}</span>
                  </div>
                  <Icon name="chevron-down" className={`w-5 h-5 transition-transform ${openMenu === prompt.id ? 'rotate-180' : ''}`} />
                </button>
                {openMenu === prompt.id && (
                  <div className="absolute bottom-full left-0 w-full mb-2 z-10">
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
                className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Icon name={prompt.icon} className="w-5 h-5 text-gray-500 dark:text-gray-400" />
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