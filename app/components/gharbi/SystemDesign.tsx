"use client";

import React, { useEffect, useRef, useState } from 'react';
import { Container } from './Container';
import { Section } from './Section';

export const SystemDesign: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [animationProgress, setAnimationProgress] = useState(0);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            // Animate the diagram
            let progress = 0;
            const interval = setInterval(() => {
              progress += 0.015;
              if (progress >= 1) {
                progress = 1;
                clearInterval(interval);
              }
              setAnimationProgress(progress);
            }, 30);
            return () => clearInterval(interval);
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

  // Component definitions (like microchip footprints)
  const components = [
    { id: 'AUTH', x: 100, y: 150, size: 40, delay: 0 },
    { id: 'API', x: 250, y: 80, size: 50, delay: 0.15 },
    { id: 'SYSTEM', x: 400, y: 150, size: 60, delay: 0.3 },
    { id: 'CACHE', x: 250, y: 220, size: 45, delay: 0.45 },
    { id: 'DB', x: 550, y: 150, size: 50, delay: 0.6 },
  ];

  // PCB trace connections with 90-degree routing
  const traces = [
    // AUTH to SYSTEM (via top route)
    { path: 'M 120,150 L 180,150 L 180,130 L 370,130 L 370,150', delay: 0.1 },
    // API to SYSTEM
    { path: 'M 275,105 L 275,130 L 370,130', delay: 0.25 },
    // SYSTEM to DB
    { path: 'M 430,150 L 520,150', delay: 0.4 },
    // SYSTEM to CACHE
    { path: 'M 400,180 L 400,200 L 275,200', delay: 0.55 },
  ];

  return (
    <Container>
      <Section label="SYSTEM ARCHITECTURE">
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
              flexDirection: 'column',
              gap: 'var(--space-md)',
            }}
          >
            <p
              style={{
                fontSize: 'var(--text-body)',
                color: 'var(--text-primary)',
                lineHeight: 'var(--leading-relaxed)',
                margin: 0,
              }}
            >
              AI writes the code. I design the system.
            </p>
            <p
              style={{
                fontSize: 'var(--text-body)',
                color: 'var(--text-secondary)',
                lineHeight: 'var(--leading-relaxed)',
                margin: 0,
              }}
            >
              With AI handling implementation, my focus has shifted to system architecture and design. I am working on acquiring the skills to design any application with any constraints to make things work. I believe there is always a way and there are solutions beyond what exists today. lets dive into the ocean together?
            </p>
          </div>

          {/* Circuit Board Style System Diagram */}
          <div
            style={{
              width: '100%',
              height: '350px',
              position: 'relative',
              marginTop: 'var(--space-xl)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              padding: 'var(--space-lg)',
            }}
          >
            <svg
              width="100%"
              height="100%"
              viewBox="0 0 650 300"
              style={{
                overflow: 'visible',
              }}
            >
              {/* Background grid (subtle) */}
              <defs>
                <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path
                    d="M 20 0 L 0 0 0 20"
                    fill="none"
                    stroke="var(--border)"
                    strokeWidth="0.5"
                    opacity="0.3"
                  />
                </pattern>
              </defs>
              <rect width="650" height="300" fill="url(#grid)" />

              {/* PCB Traces (connections) */}
              <g opacity={isVisible ? 1 : 0}>
                {traces.map((trace, idx) => {
                  const traceProgress = Math.max(0, Math.min(1, (animationProgress - trace.delay) / 0.15));
                  return (
                    <g key={idx}>
                      {/* Trace outline (darker) */}
                      <path
                        d={trace.path}
                        fill="none"
                        stroke="var(--text-primary)"
                        strokeWidth="4"
                        strokeLinecap="square"
                        style={{
                          opacity: traceProgress * 0.3,
                          transition: 'opacity 0.3s ease',
                        }}
                      />
                      {/* Trace center (brighter) */}
                      <path
                        d={trace.path}
                        fill="none"
                        stroke="var(--text-primary)"
                        strokeWidth="2"
                        strokeLinecap="square"
                        strokeDasharray="1000"
                        strokeDashoffset={1000 * (1 - traceProgress)}
                        style={{
                          opacity: traceProgress,
                          transition: 'opacity 0.3s ease',
                        }}
                      />
                      {/* Connection pads */}
                      <circle
                        cx={trace.path.split(' ')[1].split(',')[0]}
                        cy={trace.path.split(' ')[1].split(',')[1]}
                        r="3"
                        fill="var(--text-primary)"
                        style={{
                          opacity: traceProgress,
                        }}
                      />
                    </g>
                  );
                })}
              </g>

              {/* Component footprints (microchip style) */}
              <g opacity={isVisible ? 1 : 0}>
                {components.map((comp) => {
                  const compProgress = Math.max(0, Math.min(1, (animationProgress - comp.delay) / 0.15));
                  const halfSize = comp.size / 2;

                  return (
                    <g
                      key={comp.id}
                      style={{
                        opacity: compProgress,
                        transition: 'opacity 0.3s ease',
                      }}
                    >
                      {/* Main chip body */}
                      <rect
                        x={comp.x - halfSize}
                        y={comp.y - halfSize}
                        width={comp.size}
                        height={comp.size}
                        fill="var(--bg-primary)"
                        stroke="var(--text-primary)"
                        strokeWidth="2"
                        rx="2"
                      />

                      {/* Corner indicators (mounting holes) */}
                      <circle
                        cx={comp.x - halfSize + 5}
                        cy={comp.y - halfSize + 5}
                        r="2"
                        fill="var(--border)"
                      />
                      <circle
                        cx={comp.x + halfSize - 5}
                        cy={comp.y - halfSize + 5}
                        r="2"
                        fill="var(--border)"
                      />
                      <circle
                        cx={comp.x - halfSize + 5}
                        cy={comp.y + halfSize - 5}
                        r="2"
                        fill="var(--border)"
                      />
                      <circle
                        cx={comp.x + halfSize - 5}
                        cy={comp.y + halfSize - 5}
                        r="2"
                        fill="var(--border)"
                      />

                      {/* Pin markers on sides */}
                      {[-halfSize + 8, -halfSize + 16, -halfSize + 24].map((offset, i) => (
                        <g key={`pins-${i}`}>
                          {/* Top pins */}
                          {comp.x + offset >= comp.x - halfSize && comp.x + offset <= comp.x + halfSize - 8 && (
                            <rect
                              x={comp.x + offset}
                              y={comp.y - halfSize - 3}
                              width="4"
                              height="3"
                              fill="var(--text-primary)"
                            />
                          )}
                          {/* Bottom pins */}
                          {comp.x + offset >= comp.x - halfSize && comp.x + offset <= comp.x + halfSize - 8 && (
                            <rect
                              x={comp.x + offset}
                              y={comp.y + halfSize}
                              width="4"
                              height="3"
                              fill="var(--text-primary)"
                            />
                          )}
                        </g>
                      ))}

                      {/* Left/right pins */}
                      {[-halfSize + 10, 0, halfSize - 10].map((offset, i) => (
                        <g key={`pins-lr-${i}`}>
                          {/* Left pins */}
                          <rect
                            x={comp.x - halfSize - 3}
                            y={comp.y + offset - 2}
                            width="3"
                            height="4"
                            fill="var(--text-primary)"
                          />
                          {/* Right pins */}
                          <rect
                            x={comp.x + halfSize}
                            y={comp.y + offset - 2}
                            width="3"
                            height="4"
                            fill="var(--text-primary)"
                          />
                        </g>
                      ))}

                      {/* Label */}
                      <text
                        x={comp.x}
                        y={comp.y + 4}
                        textAnchor="middle"
                        fontSize="11"
                        fill="var(--text-primary)"
                        fontFamily="monospace"
                        fontWeight="bold"
                        letterSpacing="1"
                      >
                        {comp.id}
                      </text>

                      {/* Annotation below */}
                      <text
                        x={comp.x}
                        y={comp.y + halfSize + 18}
                        textAnchor="middle"
                        fontSize="8"
                        fill="var(--text-muted)"
                        fontFamily="monospace"
                      >
                        {`[${comp.x},${comp.y}]`}
                      </text>
                    </g>
                  );
                })}
              </g>

              {/* Legend/Annotations */}
              <g
                opacity={isVisible && animationProgress > 0.8 ? 1 : 0}
                style={{ transition: 'opacity 0.6s ease' }}
              >
                <text
                  x="10"
                  y="20"
                  fontSize="9"
                  fill="var(--text-muted)"
                  fontFamily="monospace"
                >
                  ARCHITECTURE v2.1.0
                </text>
                <text
                  x="10"
                  y="290"
                  fontSize="8"
                  fill="var(--text-muted)"
                  fontFamily="monospace"
                >
                  PCB LAYER: SYSTEM DESIGN
                </text>
              </g>
            </svg>
          </div>
        </div>
      </Section>
    </Container>
  );
};

