"use client";

import React from 'react';
import { Container } from './Container';
import { Github, Linkedin, Mail, Twitter } from 'lucide-react';
import { ArchitectCard } from './ArchitectCard';

interface SocialLink {
  name: string;
  url: string;
  icon: React.ReactNode;
}

const socialLinks: SocialLink[] = [
  { name: 'GitHub', url: 'https://github.com', icon: <Github size={20} /> },
  { name: 'LinkedIn', url: 'https://linkedin.com', icon: <Linkedin size={20} /> },
  { name: 'Twitter', url: 'https://twitter.com', icon: <Twitter size={20} /> },
  { name: 'Email', url: 'mailto:hello@example.com', icon: <Mail size={20} /> },
];

export const Hero: React.FC = () => {
  return (
    <Container>
      <section
        style={{
          paddingTop: 'var(--space-3xl)',
          paddingBottom: 'var(--space-3xl)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-md)',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'flex-start',
            gap: 'var(--space-xl)',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ flex: 1, minWidth: '300px' }}>
        <h1
          style={{
            fontSize: 'var(--text-hero)',
            fontWeight: 'var(--weight-bold)',
            color: 'var(--text-primary)',
            lineHeight: 'var(--leading-tight)',
            margin: 0,
          }}
        >
          Hariharan
        </h1>
        <p
          style={{
            fontSize: 'var(--text-body)',
            color: 'var(--text-muted)',
            fontWeight: 'var(--weight-normal)',
            lineHeight: 'var(--leading-normal)',
            margin: 0,
          }}
        >
          AI-Native Developer & Fullstack Architect
        </p>
        <p
          style={{
            fontSize: 'var(--text-body)',
            color: 'var(--text-primary)',
            fontWeight: 'var(--weight-normal)',
            lineHeight: 'var(--leading-relaxed)',
            margin: 0,
            marginTop: 'var(--space-md)',
            maxWidth: '600px',
          }}
        >
          I build systems that scale and matter. Leveraging AI as a force multiplier to ship faster, better, and with zero friction.
        </p>
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            gap: 'var(--space-sm)',
            alignItems: 'center',
            marginTop: 'var(--space-md)',
          }}
        >
          {socialLinks.map((link) => (
            <a
              key={link.name}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="link-gharbi"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-primary)',
              }}
              aria-label={link.name}
            >
              {link.icon}
            </a>
          ))}
          </div>
          </div>
          <div
            style={{
              flexShrink: 0,
              width: '100%',
              maxWidth: '320px',
              margin: '0 auto',
            }}
          >
            <ArchitectCard />
          </div>
        </div>
      </section>
    </Container>
  );
};

