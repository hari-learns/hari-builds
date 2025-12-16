"use client";

import React, { useEffect, useRef, useState } from 'react';

interface ExperienceItemProps {
  title: string;
  subtitle?: string;
  description?: string;
  techStack?: string[];
  date?: string;
  isLast?: boolean;
}

export const ExperienceItem: React.FC<ExperienceItemProps> = ({
  title,
  subtitle,
  description,
  techStack,
  date,
  isLast = false,
}) => {
  const itemRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.1) {
            setIsVisible(true);
          }
        });
      },
      { threshold: 0.1 }
    );

    if (itemRef.current) {
      observer.observe(itemRef.current);
    }

    return () => {
      if (itemRef.current) {
        observer.unobserve(itemRef.current);
      }
    };
  }, []);

  return (
    <div
      ref={itemRef}
      style={{
        position: 'relative',
        paddingLeft: 'var(--space-lg)',
        paddingBottom: 'var(--space-xl)',
        opacity: isVisible ? 1 : 0.3,
        transition: 'opacity 0.6s ease-out',
      }}
    >
      {/* Vertical line connector */}
      {!isLast && (
        <div
          style={{
            position: 'absolute',
            left: '6px',
            top: '2rem',
            bottom: '0',
            width: '1px',
            backgroundColor: 'var(--border)',
          }}
        />
      )}

      {/* Dot on the line */}
      <div
        style={{
          position: 'absolute',
          left: '0',
          top: '0.5rem',
          width: '12px',
          height: '12px',
          borderRadius: '50%',
          backgroundColor: 'var(--text-primary)',
          border: '2px solid var(--bg-primary)',
          transition: 'transform 0.2s ease',
        }}
      />

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-sm)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 'var(--space-sm)',
            flexWrap: 'wrap',
          }}
        >
          <div>
            <h3
              style={{
                fontSize: '1.125rem', // 18px
                fontWeight: 'var(--weight-bold)',
                color: 'var(--text-primary)',
                margin: 0,
                lineHeight: 'var(--leading-tight)',
              }}
            >
              {title}
            </h3>
            {subtitle && (
              <p
                style={{
                  fontSize: 'var(--text-body)',
                  color: 'var(--text-muted)',
                  fontWeight: 'var(--weight-normal)',
                  margin: 0,
                  marginTop: '0.25rem',
                }}
              >
                {subtitle}
              </p>
            )}
          </div>
          {date && (
            <span
              style={{
                fontSize: 'var(--text-small)',
                color: 'var(--text-muted)',
                whiteSpace: 'nowrap',
              }}
            >
              {date}
            </span>
          )}
        </div>
        {description && (
          <p
            style={{
              fontSize: 'var(--text-body)',
              color: 'var(--text-primary)',
              fontWeight: 'var(--weight-normal)',
              lineHeight: 'var(--leading-normal)',
              margin: 0,
            }}
          >
            {description}
          </p>
        )}
        {techStack && techStack.length > 0 && (
          <div
            style={{
              fontSize: 'var(--text-small)',
              color: 'var(--text-muted)',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '0.5rem',
            }}
          >
            {techStack.map((tech, index) => (
              <span key={index}>
                {tech}
                {index < techStack.length - 1 && ' · '}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

