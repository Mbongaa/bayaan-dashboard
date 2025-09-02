"use client";

import React, { useEffect, useState, useRef } from 'react';

interface TypewriterTextProps {
  text: string;
  typingSpeed?: number;
  showCursor?: boolean;
  cursorCharacter?: string;
  onComplete?: () => void;
  className?: string;
  isLatestMessage?: boolean;
}

const TypewriterText: React.FC<TypewriterTextProps> = ({
  text,
  typingSpeed = 50,
  showCursor = true,
  cursorCharacter = '|',
  onComplete,
  className = '',
  isLatestMessage = false,
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const [currentCharIndex, setCurrentCharIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [currentText, setCurrentText] = useState(text);
  const cursorRef = useRef<HTMLSpanElement>(null);

  // Reset animation when text changes
  useEffect(() => {
    if (text !== currentText) {
      setDisplayedText('');
      setCurrentCharIndex(0);
      setIsComplete(false);
      setCurrentText(text);
      if (cursorRef.current) {
        cursorRef.current.style.opacity = '1';
      }
    }
  }, [text, currentText]);

  // Cursor blinking animation
  useEffect(() => {
    if (showCursor && cursorRef.current && !isComplete) {
      const blinkInterval = setInterval(() => {
        if (cursorRef.current) {
          cursorRef.current.style.opacity = 
            cursorRef.current.style.opacity === '0' ? '1' : '0';
        }
      }, 500);

      return () => clearInterval(blinkInterval);
    }
  }, [showCursor, isComplete]);

  // Typewriter animation
  useEffect(() => {
    if (currentCharIndex < currentText.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(prev => prev + currentText[currentCharIndex]);
        setCurrentCharIndex(prev => prev + 1);
      }, typingSpeed);

      return () => clearTimeout(timeout);
    } else if (currentCharIndex === currentText.length && !isComplete) {
      // Animation complete
      setIsComplete(true);
      if (onComplete) {
        onComplete();
      }
      // Hide cursor after completion (unless it's the latest message)
      if (cursorRef.current && !isLatestMessage) {
        cursorRef.current.style.opacity = '0';
      }
    }
  }, [currentCharIndex, currentText, typingSpeed, isComplete, onComplete]);

  return (
    <span className={`typewriter-container ${className}`}>
      <span className="typewriter-text">{displayedText}</span>
      {showCursor && (
        <span
          ref={cursorRef}
          className="typewriter-cursor"
          style={{ 
            marginLeft: '2px',
            opacity: 1,
            transition: 'opacity 0.1s'
          }}
        >
          {cursorCharacter}
        </span>
      )}
    </span>
  );
};

export default TypewriterText;