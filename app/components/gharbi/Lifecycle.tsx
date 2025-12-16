"use client";

import React, { useEffect, useRef, useState } from 'react';
import { Lightbulb, PenTool, Code2, Lock, ShieldCheck, Rocket, TrendingUp } from 'lucide-react';
import { Container } from './Container';
import { Section } from './Section';

const steps = [
  { icon: Lightbulb, title: "IDEATE", desc: "Problem & Solution", x: 8, y: 50 },
  { icon: PenTool, title: "ARCHITECT", desc: "System Design", x: 25, y: 20 },
  { icon: Code2, title: "BUILD", desc: "AI-Augmented", x: 42, y: 80 },
  { icon: Lock, title: "FORTIFY", desc: "Zero Trust & Hardening", x: 58, y: 20 },
  { icon: Rocket, title: "DEPLOY", desc: "CI/CD Pipeline", x: 75, y: 80 },
  { icon: TrendingUp, title: "SCALE", desc: "Growth & Monitor", x: 92, y: 50 },
];

export const Lifecycle: React.FC = () => {
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
      <Section label="HOW I SHIP">
        <div
          ref={containerRef}
          style={{
            position: 'relative',
            width: '100%',
            marginTop: 'var(--space-md)',
          }}
        >
          {/* Lifecycle Layout */}
          <div style={{ height: '400px', width: '100%', position: 'relative' }}>
            {/* SVG Path with dotted 4-directional lines */}
            <svg
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                overflow: 'visible',
                pointerEvents: 'none',
              }}
              viewBox="0 0 1400 400"
              preserveAspectRatio="none"
            >
              <g
                style={{
                  opacity: isVisible ? 1 : 0,
                  transition: 'opacity 0.6s ease-out',
                }}
              >
                {/* IDEATE to ARCHITECT */}
                <line x1="112" y1="200" x2="200" y2="200" stroke="var(--border)" strokeWidth="2" strokeDasharray="5,5" />
                <line x1="200" y1="200" x2="200" y2="80" stroke="var(--border)" strokeWidth="2" strokeDasharray="5,5" />
                <line x1="200" y1="80" x2="350" y2="80" stroke="var(--border)" strokeWidth="2" strokeDasharray="5,5" />

                {/* ARCHITECT to BUILD */}
                <line x1="350" y1="80" x2="450" y2="80" stroke="var(--border)" strokeWidth="2" strokeDasharray="5,5" />
                <line x1="450" y1="80" x2="450" y2="320" stroke="var(--border)" strokeWidth="2" strokeDasharray="5,5" />
                <line x1="450" y1="320" x2="588" y2="320" stroke="var(--border)" strokeWidth="2" strokeDasharray="5,5" />

                {/* BUILD to FORTIFY */}
                <line x1="588" y1="320" x2="650" y2="320" stroke="var(--border)" strokeWidth="2" strokeDasharray="5,5" />
                <line x1="650" y1="320" x2="650" y2="80" stroke="var(--border)" strokeWidth="2" strokeDasharray="5,5" />
                <line x1="650" y1="80" x2="812" y2="80" stroke="var(--border)" strokeWidth="2" strokeDasharray="5,5" />

                {/* FORTIFY to DEPLOY */}
                <line x1="812" y1="80" x2="900" y2="80" stroke="var(--border)" strokeWidth="2" strokeDasharray="5,5" />
                <line x1="900" y1="80" x2="900" y2="320" stroke="var(--border)" strokeWidth="2" strokeDasharray="5,5" />
                <line x1="900" y1="320" x2="1050" y2="320" stroke="var(--border)" strokeWidth="2" strokeDasharray="5,5" />

                {/* DEPLOY to SCALE */}
                <line x1="1050" y1="320" x2="1150" y2="320" stroke="var(--border)" strokeWidth="2" strokeDasharray="5,5" />
                <line x1="1150" y1="320" x2="1150" y2="200" stroke="var(--border)" strokeWidth="2" strokeDasharray="5,5" />
                <line x1="1150" y1="200" x2="1288" y2="200" stroke="var(--border)" strokeWidth="2" strokeDasharray="5,5" />
              </g>
            </svg>

            {/* Steps */}
            <div
              style={{
                position: 'relative',
                width: '100%',
                height: '100%',
              }}
            >
              {steps.map((step, index) => {
                const Icon = step.icon;
                const isBuild = step.title === "BUILD";

                return (
                  <div
                    key={index}
                    style={{
                      position: 'absolute',
                      left: `${step.x}%`,
                      top: `${step.y}%`,
                      transform: 'translate(-50%, -50%)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      textAlign: 'center',
                      opacity: isVisible ? 1 : 0,
                      transition: `opacity 0.6s ease-out ${index * 0.1}s`,
                    }}
                  >
                    <div
                      style={{
                        position: 'relative',
                        width: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        border: '1px solid var(--border)',
                        backgroundColor: 'var(--bg-secondary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: 'var(--space-xs)',
                        cursor: 'default',
                        transition: 'transform 0.2s ease, border-color 0.2s ease',
                      }}
                    >
                      <Icon size={20} style={{ color: 'var(--text-primary)' }} />
                    </div>

                    {/* 10X Faster Label - Permanent for BUILD */}
                    {isBuild && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '-45px',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          padding: 'var(--space-xs) var(--space-sm)',
                          backgroundColor: 'var(--bg-primary)',
                          border: '1px solid var(--border)',
                          borderRadius: '4px',
                          fontSize: 'var(--text-xs)',
                          color: 'var(--text-primary)',
                          whiteSpace: 'nowrap',
                          zIndex: 100,
                          fontWeight: 'var(--weight-medium)',
                          letterSpacing: '0.05em',
                        }}
                      >
                        10X FASTER WITH AI
                      </div>
                    )}

                    <h3
                      style={{
                        fontSize: 'var(--text-small)',
                        fontWeight: 'var(--weight-bold)',
                        color: 'var(--text-primary)',
                        margin: 0,
                        marginBottom: '0.25rem',
                        letterSpacing: '0.05em',
                        marginTop: isBuild ? 'var(--space-xs)' : 0,
                      }}
                    >
                      {step.title}
                    </h3>
                    <p
                      style={{
                        fontSize: 'var(--text-xs)',
                        color: 'var(--text-muted)',
                        margin: 0,
                        maxWidth: '120px',
                      }}
                    >
                      {step.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </Section>
    </Container>
  );
};
