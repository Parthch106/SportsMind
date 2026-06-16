'use client';

import React, { useRef, useState, useEffect } from 'react';

interface BorderGlowProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
  borderWidth?: number;
  glowSize?: number;
}

export default function BorderGlow({
  children,
  className = '',
  glowColor = 'rgba(16, 185, 129, 0.4)', // Emerald by default
  borderWidth = 1,
  glowSize = 300,
}: BorderGlowProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: -1000, y: -1000 });
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    const updateMousePosition = (ev: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      setMousePosition({
        x: ev.clientX - rect.left,
        y: ev.clientY - rect.top,
      });
    };

    if (isHovering && containerRef.current) {
      window.addEventListener('mousemove', updateMousePosition);
    }

    return () => {
      window.removeEventListener('mousemove', updateMousePosition);
    };
  }, [isHovering]);

  return (
    <div
      ref={containerRef}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => {
        setIsHovering(false);
        setMousePosition({ x: -1000, y: -1000 }); // Move glow far away
      }}
      className={`relative overflow-hidden group ${className}`}
    >
      {/* Glow gradient background tracking the mouse */}
      <div
        className="pointer-events-none absolute inset-0 z-0 transition-opacity duration-300 ease-in-out"
        style={{
          opacity: isHovering ? 1 : 0,
          background: `radial-gradient(${glowSize}px circle at ${mousePosition.x}px ${mousePosition.y}px, ${glowColor}, transparent 100%)`,
        }}
      />
      
      {/* Inner container to create the 'border' effect by blocking out the center */}
      <div
        className="absolute inset-0 z-0 rounded-inherit"
        style={{
          margin: `${borderWidth}px`,
          backgroundColor: 'inherit', // Should inherit the background color of the parent so only the border glows
          backdropFilter: 'inherit',
        }}
      />

      {/* Actual Content */}
      <div className="relative z-10 h-full w-full">
        {children}
      </div>
    </div>
  );
}
