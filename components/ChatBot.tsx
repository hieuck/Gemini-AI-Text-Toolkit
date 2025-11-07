import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChatMessage } from '../types';
import { getChatResponse, resetChat } from '../services/geminiService';
import { Icon } from './common/Icon';
import { Spinner } from './common/Spinner';
import { useTranslation } from '../contexts/LanguageContext';

const ChatBot: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedMessageIndex, setCopiedMessageIndex] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();
  const inputRef = useRef<HTMLTextAreaElement>(null);

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
    
    // Find the last user message
    const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');
    if (!lastUserMessage) return;

    // Remove the last model response if it exists
    setMessages(prev => {
        const lastMessage = prev[prev.length - 1];
        if (lastMessage?.role === 'model') {
            return prev.slice(0, -1);
        }
        return prev;
    });

    // Resend the last user message
    // Use a timeout to ensure state update has rendered before sending
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

  useEffect(() => {
    if (inputRef.current) {
        inputRef.current.style.height = 'auto';
        const scrollHeight = inputRef.current.scrollHeight;
        inputRef.current.style.height = `${scrollHeight}px`;
    }
  }, [input]);

  const WelcomeScreen: React.FC = () => (
    <div className="flex flex-col items-center justify-center h-full text-center p-4">
      <div className="w-16 h-16 mb-4 rounded-full bg-gradient-to-br from-purple-600 to-blue-500 flex items-center justify-center">
        <Icon name="sparkles" className="w-8 h-8 text-white" />
      </div>
      <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-2">{t('chat.welcome.title')}</h2>
      <p className="text-gray-500 dark:text-gray-400 mb-8">Start a conversation or try one of these prompts.</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-2xl">
        {[t('chat.welcome.prompt1'), t('chat.welcome.prompt2'), t('chat.welcome.prompt3')].map(prompt => (
            <button key={prompt} onClick={() => setInput(prompt)} className="p-3 bg-gray-200/50 dark:bg-gray-800/50 rounded-lg text-sm text-left hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors">
                {prompt}
            </button>
        ))}
      </div>
    </div>
  );

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
        <div className="relative">
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
            className="w-full pl-4 pr-12 py-3 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-2xl text-gray-800 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none max-h-40"
            rows={1}
            disabled={isLoading}
          />
          <button
            onClick={() => handleSend(input)}
            disabled={isLoading || input.trim() === ''}
            className="absolute right-2 bottom-2 p-2 rounded-full text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Send message"
          >
            <Icon name="send" className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatBot;
