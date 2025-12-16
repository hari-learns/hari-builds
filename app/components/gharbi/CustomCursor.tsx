"use client";

import React, { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

export const CustomCursor: React.FC = () => {
  const [isHovering, setIsHovering] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 500, damping: 30 });
  const springY = useSpring(mouseY, { stiffness: 500, damping: 30 });

  useEffect(() => {
    setMounted(true);
    
    // Check if we should show cursor (not touch device)
    if (typeof window === 'undefined' || window.matchMedia('(pointer: coarse)').matches) {
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
      if (!isVisible) setIsVisible(true);
    };

    const handleMouseEnter = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      
      // Safely check classList
      const hasClassList = target.classList && typeof target.classList.contains === 'function';
      const isLink = target.tagName === 'A' || 
                     target.tagName === 'BUTTON' || 
                     (hasClassList && target.classList.contains('link-gharbi'));
      
      if (isLink) {
        setIsHovering(true);
      }
    };

    const handleMouseLeave = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      
      // Safely check classList
      const hasClassList = target.classList && typeof target.classList.contains === 'function';
      const isLink = target.tagName === 'A' || 
                     target.tagName === 'BUTTON' || 
                     (hasClassList && target.classList.contains('link-gharbi'));
      
      if (isLink) {
        setIsHovering(false);
      }
    };

    const handleMouseOut = () => {
      setIsVisible(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseenter', handleMouseEnter, true);
    document.addEventListener('mouseleave', handleMouseLeave, true);
    document.addEventListener('mouseout', handleMouseOut);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseenter', handleMouseEnter, true);
      document.removeEventListener('mouseleave', handleMouseLeave, true);
      document.removeEventListener('mouseout', handleMouseOut);
    };
  }, [mouseX, mouseY, isVisible]);

  // Don't render on server or touch devices
  if (!mounted || typeof window === 'undefined' || window.matchMedia('(pointer: coarse)').matches) {
    return null;
  }

  return (
    <motion.div
      className="custom-cursor"
      style={{
        x: springX,
        y: springY,
        opacity: isVisible ? 1 : 0,
        position: 'fixed',
        top: 0,
        left: 0,
        pointerEvents: 'none',
        zIndex: 9999,
      }}
    >
      <motion.svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        animate={{
          scale: isHovering ? 1.5 : 1,
        }}
        transition={{
          duration: 0.2,
          ease: "easeInOut"
        }}
      >
        <path
          d="M3 3L10.07 19.97L12.58 12.58L19.97 10.07L3 3Z"
          fill="var(--text-primary)"
          stroke="var(--bg-primary)"
          strokeWidth="1"
          strokeLinejoin="round"
        />
      </motion.svg>
    </motion.div>
  );
};

