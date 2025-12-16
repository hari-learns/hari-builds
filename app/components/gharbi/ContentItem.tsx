"use client";

import React, { useEffect, useRef, useState } from 'react';

interface ContentItemProps {
  title: string;
  subtitle?: string;
  description?: string;
  techStack?: string[];
  date?: string;
  link?: string;
  icon?: React.ReactNode;
}

export const ContentItem: React.FC<ContentItemProps> = ({
  title,
  subtitle,
  description,
  techStack,
  date,
  link,
  icon,
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

  const content = (
    <div
      ref={itemRef}
      className={`fade-in ${isVisible ? 'visible' : ''}`}
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
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
          {icon && (
            <div
              style={{
                width: '24px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-primary)',
              }}
            >
              {icon}
            </div>
          )}
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
            color: 'var(--text-secondary)',
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
  );

  if (link) {
    return (
      <a href={link} target="_blank" rel="noopener noreferrer" className="link-gharbi">
        {content}
      </a>
    );
  }

  return content;
};

