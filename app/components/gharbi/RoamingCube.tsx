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
        width: '50px',
        height: '50px',
        position: 'relative',
        transformStyle: 'preserve-3d',
        animation: 'rotateCube 20s infinite linear',
        opacity: 0.3,
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
      
      {/* Front face edges */}
      <div style={{ position: 'absolute', width: '50px', height: '1px', backgroundColor: 'var(--text-primary)', transform: 'translateZ(25px)' }} />
      <div style={{ position: 'absolute', width: '50px', height: '1px', backgroundColor: 'var(--text-primary)', transform: 'translateZ(25px) translateY(49px)' }} />
      <div style={{ position: 'absolute', width: '1px', height: '50px', backgroundColor: 'var(--text-primary)', transform: 'translateZ(25px)' }} />
      <div style={{ position: 'absolute', width: '1px', height: '50px', backgroundColor: 'var(--text-primary)', transform: 'translateZ(25px) translateX(49px)' }} />

      {/* Back face edges */}
      <div style={{ position: 'absolute', width: '50px', height: '1px', backgroundColor: 'var(--text-primary)', transform: 'translateZ(-25px)' }} />
      <div style={{ position: 'absolute', width: '50px', height: '1px', backgroundColor: 'var(--text-primary)', transform: 'translateZ(-25px) translateY(49px)' }} />
      <div style={{ position: 'absolute', width: '1px', height: '50px', backgroundColor: 'var(--text-primary)', transform: 'translateZ(-25px)' }} />
      <div style={{ position: 'absolute', width: '1px', height: '50px', backgroundColor: 'var(--text-primary)', transform: 'translateZ(-25px) translateX(49px)' }} />

      {/* Connecting edges (front to back) */}
      <div style={{ position: 'absolute', width: '50px', height: '1px', backgroundColor: 'var(--text-primary)', transform: 'rotateY(90deg) translateZ(25px)' }} />
      <div style={{ position: 'absolute', width: '50px', height: '1px', backgroundColor: 'var(--text-primary)', transform: 'rotateY(90deg) translateZ(-25px)' }} />
      <div style={{ position: 'absolute', width: '50px', height: '1px', backgroundColor: 'var(--text-primary)', transform: 'rotateY(90deg) translateZ(25px) translateY(49px)' }} />
      <div style={{ position: 'absolute', width: '50px', height: '1px', backgroundColor: 'var(--text-primary)', transform: 'rotateY(90deg) translateZ(-25px) translateY(49px)' }} />

      {/* Corner vertices (minimal dots) */}
      {[
        { x: 0, y: 0, z: 25 },
        { x: 49, y: 0, z: 25 },
        { x: 0, y: 49, z: 25 },
        { x: 49, y: 49, z: 25 },
        { x: 0, y: 0, z: -25 },
        { x: 49, y: 0, z: -25 },
        { x: 0, y: 49, z: -25 },
        { x: 49, y: 49, z: -25 },
      ].map((vertex, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            width: '3px',
            height: '3px',
            borderRadius: '50%',
            backgroundColor: 'var(--text-primary)',
            transform: `translate3d(${vertex.x - 1.5}px, ${vertex.y - 1.5}px, ${vertex.z}px)`,
          }}
        />
      ))}
    </div>
  );
};

