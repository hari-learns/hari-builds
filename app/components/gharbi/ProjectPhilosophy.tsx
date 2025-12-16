"use client";

import React, { useEffect, useRef, useState } from 'react';
import { Container } from './Container';
import { motion } from 'framer-motion';

export const ProjectPhilosophy: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
          }
        });
      },
      { threshold: 0.2 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current);
      }
    };
  }, []);

  return (
    <Container>
      <div
        ref={containerRef}
        style={{
          padding: 'var(--space-3xl) 0',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          maxWidth: '700px',
          margin: '0 auto',
        }}
      >
        <motion.blockquote
          initial={{ opacity: 0, y: 20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          style={{
            margin: 0,
            padding: 0,
            border: 'none',
            fontStyle: 'normal',
          }}
        >
          <p
            style={{
              fontSize: 'var(--text-body)',
              color: 'var(--text-primary)',
              lineHeight: 'var(--leading-relaxed)',
              margin: 0,
              marginBottom: 'var(--space-md)',
              fontWeight: 'var(--weight-normal)',
            }}
          >
            Lemonade Stand is the single source of truth for my ideas and capabilities
          </p>
          <p
            style={{
              fontSize: 'var(--text-body)',
              color: 'var(--text-secondary)',
              lineHeight: 'var(--leading-relaxed)',
              margin: 0,
              fontWeight: 'var(--weight-normal)',
            }}
          >
            Lets build great products together
          </p>
        </motion.blockquote>
      </div>
    </Container>
  );
};

