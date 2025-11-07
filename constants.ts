// Fix: Export `getReplyStyles` to resolve an import error in `ReplyStyleModal.tsx` and refactor to avoid code duplication.
export const getReplyStyles = (t: (key: string) => string) => [
  { 
    id: 'reply-neutral', 
    label: t('processor.replyStyles.neutral'), 
    prompt: t('processor.replyStyles.neutralPrompt') 
  },
  { 
    id: 'reply-friendly', 
    label: t('processor.replyStyles.friendly'), 
    prompt: t('processor.replyStyles.friendlyPrompt') 
  },
  { 
    id: 'reply-sarcastic', 
    label: t('processor.replyStyles.sarcastic'), 
    prompt: t('processor.replyStyles.sarcasticPrompt') 
  },
];

export const getPredefinedPrompts = (t: (key: string) => string) => [
  { 
    id: 'summarize', 
    label: t('processor.prompts.summarize'), 
    prompt: t('processor.prompts.summarizePrompt'),
    icon: 'summarize' as const,
  },
  { 
    id: 'expand-text', 
    label: t('processor.prompts.expandText'), 
    prompt: t('processor.prompts.expandTextPrompt'),
    icon: 'expand' as const,
  },
  { 
    id: 'reply-ai', 
    label: t('processor.prompts.replyAI'), 
    prompt: t('processor.prompts.replyAIPrompt'),
    icon: 'reply' as const,
  },
  { 
    id: 'quick-reply', 
    label: t('processor.prompts.quickReply'), 
    isMenu: true,
    icon: 'reply' as const,
    subActions: getReplyStyles(t)
  },
  {
    id: 'translate',
    label: t('processor.prompts.translate'),
    isMenu: true,
    icon: 'translate' as const,
    subActions: [
      { id: 'translate-vi', label: t('processor.prompts.translateViTarget'), prompt: 'Translate the following text into Vietnamese:' },
      { id: 'translate-en', label: t('processor.prompts.translateEnTarget'), prompt: 'Translate the following text into English:' },
      { id: 'translate-es', label: t('processor.prompts.translateEsTarget'), prompt: 'Translate the following text into Spanish:' },
      { id: 'translate-fr', label: t('processor.prompts.translateFrTarget'), prompt: 'Translate the following text into French:' },
      { id: 'translate-de', label: t('processor.prompts.translateDeTarget'), prompt: 'Translate the following text into German:' },
      { id: 'translate-ja', label: t('processor.prompts.translateJaTarget'), prompt: 'Translate the following text into Japanese:' },
      { id: 'translate-ko', label: t('processor.prompts.translateKoTarget'), prompt: 'Translate the following text into Korean:' },
      { id: 'translate-zh', label: t('processor.prompts.translateZhTarget'), prompt: 'Translate the following text into Chinese (Simplified):' },
      { id: 'translate-ru', label: t('processor.prompts.translateRuTarget'), prompt: 'Translate the following text into Russian:' },
      { id: 'translate-pt', label: t('processor.prompts.translatePtTarget'), prompt: 'Translate the following text into Portuguese:' },
      { id: 'translate-it', label: t('processor.prompts.translateItTarget'), prompt: 'Translate the following text into Italian:' },
      { id: 'translate-hi', label: t('processor.prompts.translateHiTarget'), prompt: 'Translate the following text into Hindi:' },
      { id: 'translate-ar', label: t('processor.prompts.translateArTarget'), prompt: 'Translate the following text into Arabic:' },
      { id: 'translate-nl', label: t('processor.prompts.translateNlTarget'), prompt: 'Translate the following text into Dutch:' },
      { id: 'translate-tr', label: t('processor.prompts.translateTrTarget'), prompt: 'Translate the following text into Turkish:' },
    ]
  },
  { 
    id: 'fix-grammar', 
    label: t('processor.prompts.fixGrammar'), 
    prompt: t('processor.prompts.fixGrammarPrompt'),
    icon: 'grammar' as const,
  },
  { 
    id: 'explain-like-im-5', 
    label: t('processor.prompts.explainLikeIm5'), 
    prompt: t('processor.prompts.explainLikeIm5Prompt'),
    icon: 'explain' as const,
  },
  { 
    id: 'json-converter', 
    label: t('processor.prompts.jsonConverter'), 
    prompt: t('processor.prompts.jsonConverterPrompt'),
    icon: 'json' as const,
  },
];