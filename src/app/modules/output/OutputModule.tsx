"use client";

import React, { useState, useEffect, useRef } from 'react';
import TypewriterText from '@/app/foundation/components/TypewriterText';

interface OutputModuleProps {
  userId: string;
  className?: string;
  style?: React.CSSProperties;
}

interface OutputContent {
  type: 'text' | 'translation';
  content?: string;
  title?: string;
  original?: {
    text: string;
    language: string;
  };
  translated?: {
    text: string;
    language: string;
  };
  metadata?: any;
  timestamp?: number;
}

/**
 * Output Module Component
 * Displays VA results with typewriter animation for natural text appearance
 */
export function OutputModule({ className = '', style }: OutputModuleProps) {
  const [content, setContent] = useState<OutputContent | null>(null);
  const [displayText, setDisplayText] = useState<string>('');
  const [isAnimating, setIsAnimating] = useState(false);

  // Listen for VA operations
  useEffect(() => {
    const handleOutputOperation = (event: CustomEvent) => {
      const { operation, params } = event.detail;
      console.log('[OutputModule] Received operation:', operation, params);
      
      switch(operation) {
        case 'displayText':
          handleDisplayText(params);
          break;
        case 'displayTranslation':
          handleDisplayTranslation(params);
          break;
        case 'clear':
          handleClear();
          break;
        case 'append':
          handleAppend(params);
          break;
        case 'refresh':
          if (params) {
            setContent(params);
            prepareTextForDisplay(params);
          }
          break;
      }
    };
    
    window.addEventListener('output:operation', handleOutputOperation as EventListener);
    return () => {
      window.removeEventListener('output:operation', handleOutputOperation as EventListener);
    };
  }, [content]);

  const handleDisplayText = (params: any) => {
    setContent(params);
    prepareTextForDisplay(params);
  };

  const handleDisplayTranslation = (params: any) => {
    setContent(params);
    // For translation, display the translated text
    const text = params.translated?.text || params.content || '';
    setDisplayText(text);
    // Force re-render of typewriter by changing key
    typewriterKey.current += 1;
    setIsAnimating(true);
  };

  const handleClear = () => {
    setContent(null);
    setDisplayText('');
    setIsAnimating(false);
  };

  const handleAppend = (params: any) => {
    if (content && content.type === 'text') {
      const newText = (content.content || '') + '\n' + params.content;
      const updatedContent = { ...content, content: newText };
      setContent(updatedContent);
      prepareTextForDisplay(updatedContent);
    } else {
      handleDisplayText({ type: 'text', content: params.content });
    }
  };

  const prepareTextForDisplay = (contentData: OutputContent) => {
    let text = '';
    
    if (contentData.type === 'translation' && contentData.translated) {
      text = contentData.translated.text;
    } else if (contentData.content) {
      text = contentData.content;
    }
    
    setDisplayText(text);
    // Force re-render of typewriter
    typewriterKey.current += 1;
    setIsAnimating(true);
  };

  // Key for forcing typewriter re-animation
  const typewriterKey = useRef(0);

  // Language labels for translations
  const getLanguageLabel = (lang: string) => {
    const labels: Record<string, string> = {
      'en': 'English',
      'es': 'Spanish',
      'fr': 'French',
      'de': 'German',
      'ja': 'Japanese',
      'zh': 'Chinese',
      'pt': 'Portuguese',
      'it': 'Italian',
      'ru': 'Russian',
      'ko': 'Korean'
    };
    return labels[lang] || lang.toUpperCase();
  };

  if (!content && !displayText) {
    return (
      <div className={`output-module-empty flex items-center justify-center h-full ${className}`} style={style}>
        <div className="text-gray-400 text-center">
          <div className="text-lg mb-2">Output Panel</div>
          <div className="text-sm">Results will appear here</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`output-module h-full overflow-auto bg-background ${className}`} style={style}>
      <div className="p-6">
        {/* Header for translations */}
        {content?.type === 'translation' && content.translated && (
          <div className="mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Translation
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {content.original && getLanguageLabel(content.original.language)} → {getLanguageLabel(content.translated.language)}
              </span>
            </div>
          </div>
        )}

        {/* Title if provided */}
        {content?.title && (
          <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
            {content.title}
          </h2>
        )}

        {/* Main content display */}
        <div className="output-content">
          {displayText && (
            <div className="whitespace-pre-wrap break-words">
              {isAnimating ? (
                <TypewriterText
                  key={typewriterKey.current}
                  text={displayText}
                  typingSpeed={30}
                  showCursor={true}
                  cursorCharacter="|"
                  className="text-gray-700 dark:text-gray-300 text-base"
                  onComplete={() => setIsAnimating(false)}
                />
              ) : (
                <div className="text-gray-700 dark:text-gray-300 text-base">
                  {displayText}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Metadata footer */}
        {content?.timestamp && (
          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="text-xs text-gray-400 dark:text-gray-500">
              Generated at {new Date(content.timestamp).toLocaleTimeString()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default OutputModule;