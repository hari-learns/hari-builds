"use client";

import React, { useEffect, useRef, useState } from 'react';
import { ExternalLink } from 'lucide-react';

interface FeaturedProjectProps {
  title: string;
  description: string;
  longDescription?: string;
  techStack?: string[];
  link?: string;
  highlights?: string[];
}

export const FeaturedProject: React.FC<FeaturedProjectProps> = ({
  title,
  description,
  longDescription,
  techStack,
  link,
  highlights,
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
        padding: 'var(--space-lg)',
        border: '1px solid var(--border)',
        borderRadius: '8px',
        backgroundColor: 'var(--bg-secondary)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-md)',
        transition: 'transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease',
        cursor: 'pointer',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.borderColor = 'var(--text-primary)';
        e.currentTarget.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.1)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.borderColor = 'var(--border)';
        e.currentTarget.style.boxShadow = 'none';
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
        <h3
          style={{
            fontSize: '1.25rem', // 20px
            fontWeight: 'var(--weight-bold)',
            color: 'var(--text-primary)',
            margin: 0,
            lineHeight: 'var(--leading-tight)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-xs)',
          }}
        >
          {title}
          {link && (
            <ExternalLink
              size={18}
              style={{
                color: 'var(--text-muted)',
                opacity: 0.6,
              }}
            />
          )}
        </h3>
      </div>

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

      {longDescription && (
        <p
          style={{
            fontSize: 'var(--text-body)',
            color: 'var(--text-secondary)',
            fontWeight: 'var(--weight-normal)',
            lineHeight: 'var(--leading-relaxed)',
            margin: 0,
          }}
        >
          {longDescription}
        </p>
      )}

      {highlights && highlights.length > 0 && (
        <ul
          style={{
            listStyle: 'none',
            padding: 0,
            margin: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-xs)',
          }}
        >
          {highlights.map((highlight, index) => (
            <li
              key={index}
              style={{
                fontSize: 'var(--text-small)',
                color: 'var(--text-secondary)',
                lineHeight: 'var(--leading-normal)',
                paddingLeft: 'var(--space-md)',
                position: 'relative',
              }}
            >
              <span
                style={{
                  position: 'absolute',
                  left: 0,
                  top: '0.5em',
                  width: '4px',
                  height: '4px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--text-muted)',
                }}
              />
              {highlight}
            </li>
          ))}
        </ul>
      )}

      {techStack && techStack.length > 0 && (
        <div
          style={{
            fontSize: 'var(--text-small)',
            color: 'var(--text-muted)',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.5rem',
            paddingTop: 'var(--space-xs)',
            borderTop: '1px solid var(--border)',
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

