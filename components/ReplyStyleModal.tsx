import React, { useMemo } from 'react';
import { useTranslation } from '../contexts/LanguageContext';
import { getReplyStyles } from '../constants';
import { Icon } from './common/Icon';

interface ReplyStyleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectStyle: (prompt: string) => void;
}

export const ReplyStyleModal: React.FC<ReplyStyleModalProps> = ({ isOpen, onClose, onSelectStyle }) => {
  const { t } = useTranslation();
  const replyStyles = useMemo(() => getReplyStyles(t), [t]);

  if (!isOpen) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 transition-opacity"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div 
        className="relative bg-gray-800 rounded-xl shadow-2xl p-6 m-4 w-full max-w-md border border-gray-700 transform transition-all"
        onClick={(e) => e.stopPropagation()} // Prevent closing modal when clicking inside
      >
        <button
            onClick={onClose}
            className="absolute top-3 right-3 p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full transition-colors"
            aria-label="Close"
        >
            <Icon name="close" className="w-5 h-5" />
        </button>

        <h2 className="text-xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 mb-6">
          {t('processor.replyModal.title')}
        </h2>
        
        <div className="flex flex-col space-y-3">
          {replyStyles.map((style) => (
            <button
              key={style.id}
              onClick={() => onSelectStyle(style.prompt)}
              className="w-full p-4 bg-gray-700 text-gray-200 rounded-lg font-semibold text-center hover:bg-blue-600 hover:text-white transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800"
            >
              {style.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
