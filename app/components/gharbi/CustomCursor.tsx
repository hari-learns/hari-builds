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
      className={isHovering ? 'custom-cursor hover' : 'custom-cursor'}
      style={{
        x: springX,
        y: springY,
        opacity: isVisible ? 1 : 0,
      }}
    />
  );
};

