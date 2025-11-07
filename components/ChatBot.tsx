import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChatMessage } from '../types';
import { getChatResponse, resetChat } from '../services/geminiService';
import { Icon } from './common/Icon';
import { Spinner } from './common/Spinner';
import { useTranslation } from '../contexts/LanguageContext';

// Add types for the Web Speech API
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

const ChatBot: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedMessageIndex, setCopiedMessageIndex] = useState<number | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isRecognitionReady, setIsRecognitionReady] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const { t, language } = useTranslation();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = useCallback(async (messageToSend: string) => {
    if (messageToSend.trim() === '' || isLoading) return;

    const userMessage: ChatMessage = { role: 'user', content: messageToSend };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await getChatResponse(messageToSend);
      const modelMessage: ChatMessage = { role: 'model', content: response };
      setMessages(prev => [...prev, modelMessage]);
    } catch (error) {
      const errorMessage: ChatMessage = { role: 'model', content: t('chat.errorMessage') };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, t]);

  const handleRegenerate = useCallback(async () => {
    if (isLoading) return;
    
    const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');
    if (!lastUserMessage) return;

    setMessages(prev => {
        const lastMessage = prev[prev.length - 1];
        if (lastMessage?.role === 'model') {
            return prev.slice(0, -1);
        }
        return prev;
    });

    setTimeout(() => handleSend(lastUserMessage.content), 0);
  }, [messages, isLoading, handleSend]);

  const handleClearChat = useCallback(() => {
    if(window.confirm(t('chat.clearChatConfirm'))) {
        setMessages([]);
        resetChat();
    }
  }, [t]);

  const handleCopy = useCallback((text: string, index: number) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedMessageIndex(index);
      setTimeout(() => setCopiedMessageIndex(null), 2000);
    });
  }, []);

  // Effect for auto-resizing textarea
  useEffect(() => {
    if (inputRef.current) {
        const textarea = inputRef.current;
        textarea.style.height = 'auto'; // Reset height
        
        const scrollHeight = textarea.scrollHeight;
        const maxHeight = 160; // Corresponds to max-h-40
        
        textarea.style.height = `${scrollHeight}px`; // Set height to content height
        
        if (scrollHeight > maxHeight) {
            textarea.style.height = `${maxHeight}px`;
            textarea.style.overflowY = 'auto';
        } else {
            textarea.style.overflowY = 'hidden';
        }
    }
  }, [input]);
  
  // Effect for initializing Speech Recognition
  useEffect(() => {
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

    recognition.onstart = () => setIsRecording(true);
    recognition.onend = () => setIsRecording(false);
    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      setIsRecording(false);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      requestAnimationFrame(() => {
        setInput(prev => prev ? `${prev} ${transcript}`.trim() : transcript);
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


  const WelcomeScreen: React.FC = () => {
    const [randomPrompts, setRandomPrompts] = useState<string[]>([]);

    useEffect(() => {
        // The t function is typed to return string, but we know it can return an array for this key.
        const allPrompts = t('chat.welcome.prompts') as unknown as string[];
        
        // Shuffle the array and pick the first 3 prompts
        const shuffled = [...allPrompts].sort(() => 0.5 - Math.random());
        setRandomPrompts(shuffled.slice(0, 3));
    }, [t]); // Re-run when language changes

    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-4">
        <div className="w-16 h-16 mb-4 rounded-full bg-gradient-to-br from-purple-600 to-blue-500 flex items-center justify-center">
          <Icon name="sparkles" className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-2">{t('chat.welcome.title')}</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-8">Start a conversation or try one of these prompts.</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-2xl">
          {randomPrompts.map(prompt => (
              <button key={prompt} onClick={() => setInput(prompt)} className="p-3 bg-gray-200/50 dark:bg-gray-800/50 rounded-lg text-sm text-left hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors h-full">
                  {prompt}
              </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
        {messages.length > 0 && (
             <div className="p-2 border-b border-gray-200 dark:border-gray-700/50 flex justify-end">
                <button 
                    onClick={handleClearChat} 
                    className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-md text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                    <Icon name="trash" className="w-4 h-4" />
                    {t('chat.clearChat')}
                </button>
             </div>
        )}
      <div className="flex-1 p-4 md:p-6 space-y-6 overflow-y-auto">
        {messages.length === 0 ? <WelcomeScreen /> : messages.map((msg, index) => (
          <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
            {msg.role === 'model' && (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-blue-500 flex items-center justify-center flex-shrink-0">
                <Icon name="sparkles" className="w-5 h-5 text-white" />
              </div>
            )}
            <div className={`group relative max-w-xs md:max-w-md lg:max-w-2xl px-4 py-3 rounded-2xl shadow-sm ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white rounded-br-none'
                  : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-bl-none'
              }`}
            >
              <div className="prose prose-sm dark:prose-invert prose-p:my-0 whitespace-pre-wrap">{msg.content}</div>
              {msg.role === 'model' && !isLoading && (
                  <div className="absolute -bottom-5 right-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                     <button onClick={() => handleCopy(msg.content, index)} className="p-1.5 rounded-full bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-500" title={t('chat.copy')}>
                         <Icon name={copiedMessageIndex === index ? 'check' : 'copy'} className="w-3 h-3" />
                     </button>
                     {index === messages.length - 1 && (
                         <button onClick={handleRegenerate} className="p-1.5 rounded-full bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-500" title={t('chat.regenerate')}>
                             <Icon name="refresh" className="w-3 h-3" />
                         </button>
                     )}
                  </div>
              )}
            </div>
             {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center flex-shrink-0">
                <Icon name="user" className="w-5 h-5 text-gray-800 dark:text-gray-200" />
              </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-blue-500 flex items-center justify-center flex-shrink-0">
              <Icon name="sparkles" className="w-5 h-5 text-white" />
            </div>
            <div className="max-w-xs md:max-w-md px-4 py-3 rounded-2xl bg-white dark:bg-gray-700 shadow-sm">
              <Spinner />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-t border-gray-200 dark:border-gray-700/50">
        <div className="relative flex items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend(input);
                }
            }}
            placeholder={t('chat.placeholder')}
            className="flex-1 px-4 py-3 pr-24 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-2xl text-gray-800 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none min-h-[4.5rem] max-h-40"
            disabled={isLoading}
          />
          <div className="absolute bottom-2 right-2 flex items-center gap-1">
            {isRecognitionReady && (
                <button
                    onClick={handleToggleRecording}
                    className={`flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        isRecording 
                        ? 'bg-red-600 text-white animate-pulse' 
                        : 'bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-500'
                    }`}
                    aria-label={t(isRecording ? 'processor.stopRecording' : 'processor.startRecording')}
                    title={t(isRecording ? 'processor.stopRecording' : 'processor.startRecording')}
                    disabled={isLoading}
                >
                    <Icon name="microphone" className="w-5 h-5" />
                </button>
            )}
            <button
                onClick={() => handleSend(input)}
                disabled={isLoading || input.trim() === ''}
                className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Send message"
            >
                <Icon name="send" className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatBot;