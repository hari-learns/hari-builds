"use client";

import React, { useRef, useEffect, useState } from 'react';
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
  title = "Software Engineer",
  idNumber = "CHENNAI, IND",
}) => {
  const [hasDropped, setHasDropped] = useState(false);
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
        maxWidth: '270px',
        margin: '0 auto',
        position: 'relative',
        zIndex: 10,
      }}
    >
      {/* Drop Animation Container */}
      <motion.div
        initial={{ y: '-100vh', rotate: -5 }}
        animate={{ y: 0, rotate: 0 }}
        transition={{
          type: "spring",
          stiffness: 120,
          damping: 15,
          mass: 1.2,
          delay: 1.5,
        }}
        style={{
          transformOrigin: 'top center',
        }}
        onAnimationComplete={() => setHasDropped(true)}
      >
        {/* Lanyard String */}
        <div
          style={{
            position: 'absolute',
            top: '-1000px',
            left: '50%',
            width: '4px',
            height: '1000px', // Goes way up
            backgroundColor: 'var(--text-primary)',
            transform: 'translateX(-50%)',
            zIndex: -1,
            opacity: 0.8,
          }}
        />
        
        {/* Lanyard Clip */}
        <div
          style={{
            position: 'absolute',
            top: '-20px',
            left: '50%',
            width: '40px',
            height: '30px',
            backgroundColor: 'var(--text-primary)',
            transform: 'translateX(-50%)',
            borderRadius: '4px',
            zIndex: 0,
            clipPath: 'polygon(20% 0%, 80% 0%, 100% 100%, 0% 100%)',
          }}
        />

        {/* 3D Tilt Card */}
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
              backgroundColor: 'var(--bg-primary)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
              overflow: 'hidden',
              cursor: 'grab',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            }}
          >
            {/* Top Hole for Lanyard */}
            <div
              style={{
                position: 'absolute',
                top: '12px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '60px',
                height: '8px',
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: '4px',
                border: '1px solid var(--border)',
              }}
            />

            {/* Header / ID Section */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <div 
                  style={{ 
                    width: '12px', 
                    height: '12px', 
                    borderRadius: '50%', 
                    backgroundColor: '#22c55e',
                    boxShadow: '0 0 8px #22c55e',
                    animation: 'pulse 2s infinite'
                  }} 
                />
                <span style={{ fontSize: '10px', fontFamily: 'monospace', color: 'var(--text-muted)' }}>AVAILABLE TO WORK</span>
              </div>
              <span style={{ fontSize: '10px', fontFamily: 'monospace', color: 'var(--text-muted)' }}>{idNumber}</span>
            </div>

            {/* Photo Area */}
            <div
              style={{
                width: '100%',
                aspectRatio: '1',
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: '8px',
                overflow: 'hidden',
                marginBottom: '24px',
                border: '1px solid var(--border)',
                position: 'relative',
              }}
              className="group"
            >
              {/* Scanline Effect */}
              <div 
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(to bottom, transparent 50%, rgba(0, 0, 0, 0.1) 51%)',
                  backgroundSize: '100% 4px',
                  zIndex: 2,
                  pointerEvents: 'none',
                  opacity: 0,
                  transition: 'opacity 0.3s ease',
                }}
                className="group-hover:opacity-100"
              />
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
                    mixBlendMode: 'luminosity',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.filter = 'grayscale(0%) contrast(1.1)';
                    e.currentTarget.style.mixBlendMode = 'normal';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.filter = 'grayscale(100%)';
                    e.currentTarget.style.mixBlendMode = 'luminosity';
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
                    fontSize: '64px',
                    fontWeight: 'bold',
                    color: 'var(--text-muted)',
                    position: 'relative',
                  }}
                >
                  {name.charAt(0)}
                  {/* Grid pattern overlay */}
                  <div 
                    style={{
                      position: 'absolute',
                      inset: 0,
                      opacity: 0.1,
                      backgroundImage: 'radial-gradient(var(--text-primary) 1px, transparent 1px)',
                      backgroundSize: '10px 10px',
                    }} 
                  />
                </div>
              )}
            </div>

            {/* Text Info */}
            <div style={{ marginBottom: '24px' }}>
              <h2
                style={{
                  fontSize: '24px',
                  fontWeight: 'bold',
                  margin: '0 0 8px 0',
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.02em',
                }}
              >
                {name}
              </h2>
              <p
                style={{
                  fontSize: '14px',
                  color: 'var(--text-secondary)',
                  margin: 0,
                  lineHeight: '1.4',
                  fontWeight: 500,
                }}
              >
                {title}
              </p>
            </div>

            {/* Barcode Footer */}
            <div
              style={{
                width: '100%',
                height: '32px',
                backgroundImage: `repeating-linear-gradient(
                  90deg,
                  var(--text-primary),
                  var(--text-primary) 2px,
                  transparent 2px,
                  transparent 4px
                )`,
                opacity: 0.3,
              }}
            />
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};
