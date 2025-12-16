"use client";

import React, { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

export const RoamingCube: React.FC = () => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 50, damping: 20 });
  const springY = useSpring(mouseY, { stiffness: 50, damping: 20 });
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };

    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [mouseX, mouseY]);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 1,
        overflow: 'hidden',
      }}
    >
      <motion.div
        style={{
          position: 'absolute',
          x: springX,
          y: springY,
          transformStyle: 'preserve-3d',
        }}
        animate={{
          rotateX: scrollY * 0.1,
          rotateY: scrollY * 0.1,
          rotateZ: scrollY * 0.05,
        }}
        transition={{
          duration: 0,
        }}
      >
        <Cube3D />
      </motion.div>
    </div>
  );
};

const Cube3D: React.FC = () => {
  return (
    <div
      style={{
        width: '80px',
        height: '80px',
        position: 'relative',
        transformStyle: 'preserve-3d',
        animation: 'rotateCube 20s infinite linear',
        opacity: 0.25,
      }}
    >
      <style jsx>{`
        @keyframes rotateCube {
          0% {
            transform: rotateX(0deg) rotateY(0deg) rotateZ(0deg);
          }
          100% {
            transform: rotateX(360deg) rotateY(360deg) rotateZ(360deg);
          }
        }
      `}</style>
      {/* Front face */}
      <div
        style={{
          position: 'absolute',
          width: '80px',
          height: '80px',
          border: '1px solid var(--text-primary)',
          transform: 'translateZ(40px)',
        }}
      />
      {/* Back face */}
      <div
        style={{
          position: 'absolute',
          width: '80px',
          height: '80px',
          border: '1px solid var(--text-primary)',
          transform: 'translateZ(-40px)',
        }}
      />
      {/* Top face */}
      <div
        style={{
          position: 'absolute',
          width: '80px',
          height: '80px',
          border: '1px solid var(--text-secondary)',
          transform: 'rotateX(90deg) translateZ(40px)',
        }}
      />
      {/* Bottom face */}
      <div
        style={{
          position: 'absolute',
          width: '80px',
          height: '80px',
          border: '1px solid var(--text-secondary)',
          transform: 'rotateX(-90deg) translateZ(40px)',
        }}
      />
      {/* Right face */}
      <div
        style={{
          position: 'absolute',
          width: '80px',
          height: '80px',
          border: '1px solid var(--text-muted)',
          transform: 'rotateY(90deg) translateZ(40px)',
        }}
      />
      {/* Left face */}
      <div
        style={{
          position: 'absolute',
          width: '80px',
          height: '80px',
          border: '1px solid var(--text-muted)',
          transform: 'rotateY(-90deg) translateZ(40px)',
        }}
      />
    </div>
  );
};

