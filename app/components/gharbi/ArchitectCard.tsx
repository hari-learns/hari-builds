"use client";

import React, { useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

interface ArchitectCardProps {
  imageUrl?: string;
  name?: string;
  title?: string;
  idNumber?: string;
}

export const ArchitectCard: React.FC<ArchitectCardProps> = ({
  imageUrl,
  name = "Hariharan",
  title = "System Architect",
  idNumber = "ARCH-001",
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseX = useSpring(x, { stiffness: 500, damping: 100 });
  const mouseY = useSpring(y, { stiffness: 500, damping: 100 });

  const rotateX = useTransform(mouseY, [-0.5, 0.5], [15, -15]);
  const rotateY = useTransform(mouseX, [-0.5, 0.5], [-15, 15]);

  function onMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
    const { left, top, width, height } = currentTarget.getBoundingClientRect();
    x.set((clientX - left) / width - 0.5);
    y.set((clientY - top) / height - 0.5);
  }

  function onMouseLeave() {
    x.set(0);
    y.set(0);
  }

  return (
    <div
      style={{
        perspective: '1000px',
        width: '100%',
        maxWidth: '320px',
        margin: '0 auto',
      }}
    >
      <motion.div
        ref={cardRef}
        style={{
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d',
        }}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
        whileHover={{ scale: 1.02 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
        <div
          style={{
            width: '100%',
            aspectRatio: '2/3',
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            padding: 'var(--space-md)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            position: 'relative',
            overflow: 'hidden',
            cursor: 'pointer',
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
            }}
          >
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--bg-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span style={{ fontSize: '12px', color: 'var(--text-primary)' }}>SA</span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div
                style={{
                  fontSize: 'var(--text-xs)',
                  color: 'var(--text-muted)',
                  fontFamily: 'monospace',
                }}
              >
                ID
              </div>
              <div
                style={{
                  fontSize: 'var(--text-small)',
                  color: 'var(--text-primary)',
                  fontFamily: 'monospace',
                }}
              >
                {idNumber}
              </div>
            </div>
          </div>

          {/* Photo Area */}
          <div
            style={{
              width: '100%',
              aspectRatio: '1',
              backgroundColor: 'var(--bg-primary)',
              border: '1px solid var(--border)',
              borderRadius: '4px',
              overflow: 'hidden',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            className="group"
          >
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={name}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  filter: 'grayscale(100%)',
                  transition: 'filter 0.3s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.filter = 'grayscale(0%)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.filter = 'grayscale(100%)';
                }}
              />
            ) : (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'var(--bg-primary)',
                  fontSize: '48px',
                  fontWeight: 'bold',
                  color: 'var(--text-muted)',
                }}
              >
                {name.charAt(0)}
              </div>
            )}
            {/* Scanline overlay on hover */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(transparent 50%, rgba(0,0,0,0.1) 50%)',
                backgroundSize: '100% 4px',
                opacity: 0,
                transition: 'opacity 0.3s ease',
                pointerEvents: 'none',
              }}
              className="group-hover:opacity-100"
            />
          </div>

          {/* Footer Info */}
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-xs)',
                marginBottom: 'var(--space-xs)',
              }}
            >
              <div
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--text-primary)',
                  animation: 'pulse 2s infinite',
                }}
              />
              <span
                style={{
                  fontSize: 'var(--text-xs)',
                  color: 'var(--text-primary)',
                  fontFamily: 'monospace',
                }}
              >
                ONLINE
              </span>
            </div>
            <h3
              style={{
                fontSize: 'var(--text-h2)',
                fontWeight: 'var(--weight-bold)',
                color: 'var(--text-primary)',
                margin: 0,
                marginBottom: '0.25rem',
              }}
            >
              {name}
            </h3>
            <p
              style={{
                fontSize: 'var(--text-small)',
                color: 'var(--text-muted)',
                margin: 0,
                fontFamily: 'monospace',
              }}
            >
              {title}
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

