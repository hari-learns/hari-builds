"use client";

import React, { useEffect, useRef, useState } from 'react';
import { Container } from './Container';
import { Section } from './Section';
import { motion } from 'framer-motion';

// Skills data - please update with your actual skills list
const skills = [
  'System Architecture',
  'Context Management - Models',
  'Full-Stack Engineering',
//   'Clear Communication',
  'ML',
//   'Database Optimization',
//   'CI/CD Pipelines',
  'Humour (Rare)',
  'Performance Optimization',
  'Mathematics',
  'Leadership',
  'Problem Solving',
];

export const Skillset: React.FC = () => {
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
      { threshold: 0.1 }
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
      <Section label="MY SKILLSET">
        <div
          ref={containerRef}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-lg)',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 'var(--space-sm)',
              justifyContent: 'flex-start',
            }}
          >
            {skills.map((skill, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
                transition={{
                  duration: 0.4,
                  delay: index * 0.05,
                  ease: 'easeOut',
                }}
                whileHover={{
                  scale: 1.05,
                  transition: { duration: 0.2 },
                }}
                style={{
                  padding: 'var(--space-xs) var(--space-md)',
                  border: '1px solid var(--border)',
                  borderRadius: '4px',
                  backgroundColor: 'var(--bg-secondary)',
                  fontSize: 'var(--text-small)',
                  color: 'var(--text-primary)',
                  fontWeight: 'var(--weight-medium)',
                  cursor: 'default',
                  transition: 'border-color 0.2s ease, background-color 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--text-primary)';
                  e.currentTarget.style.backgroundColor = 'var(--bg-primary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.backgroundColor = 'var(--bg-secondary)';
                }}
              >
                {skill}
              </motion.div>
            ))}
          </div>
        </div>
      </Section>
    </Container>
  );
};

