'use client';

import { useEffect, useState, useRef } from 'react';

const CHARACTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*()_+';

interface DecryptedTextProps {
  text: string;
  speed?: number;
  maxIterations?: number;
  className?: string;
  revealOnHover?: boolean;
}

export default function DecryptedText({
  text,
  speed = 50,
  maxIterations = 10,
  className = '',
  revealOnHover = false,
}: DecryptedTextProps) {
  const [displayText, setDisplayText] = useState(revealOnHover ? text : text.replace(/./g, ' '));
  const iterations = useRef(0);
  const interval = useRef<NodeJS.Timeout | null>(null);

  const startAnimation = () => {
    iterations.current = 0;
    if (interval.current) clearInterval(interval.current);

    interval.current = setInterval(() => {
      setDisplayText(() =>
        text
          .split('')
          .map((char, index) => {
            if (char === ' ') return ' ';
            if (index < iterations.current) {
              return text[index];
            }
            return CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)];
          })
          .join('')
      );

      // Increment iterations slowly based on maxIterations to control the reveal speed
      iterations.current += text.length / maxIterations;

      if (iterations.current >= text.length) {
        clearInterval(interval.current!);
        setDisplayText(text);
      }
    }, speed);
  };

  useEffect(() => {
    if (!revealOnHover) {
      startAnimation();
    }

    return () => {
      if (interval.current) clearInterval(interval.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, speed, maxIterations, revealOnHover]);

  const handleMouseEnter = () => {
    if (revealOnHover) {
      startAnimation();
    }
  };

  const handleMouseLeave = () => {
    if (revealOnHover) {
      setDisplayText(text);
      if (interval.current) clearInterval(interval.current);
    }
  };

  return (
    <span 
      className={`font-mono inline-block ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {displayText}
    </span>
  );
}
