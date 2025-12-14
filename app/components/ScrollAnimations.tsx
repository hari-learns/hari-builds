"use client";

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import { useTheme } from '../context/ThemeContext';

const ScrollAnimations = () => {
    const { isTech } = useTheme();
    const initialized = useRef(false);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const animationFrameRef = useRef<number | null>(null);

    // Run scroll animations ONLY ONCE on mount
    useEffect(() => {
        if (initialized.current) return;
        initialized.current = true;

        // Register plugins
        gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

        // Configure ScrollTrigger defaults
        ScrollTrigger.defaults({
            toggleActions: "play none none none",
            markers: false
        });

        // Small delay to ensure DOM is ready
        const initTimeout = setTimeout(() => {
            // 1. HERO SECTION - H1
            gsap.fromTo("h1",
                { opacity: 0, y: 50 },
                {
                    opacity: 1,
                    y: 0,
                    duration: 1,
                    delay: 0.3,
                    ease: "power3.out"
                }
            );

            // 2. HERO TEXT
            gsap.fromTo(".hero-text",
                { opacity: 0, y: 30 },
                {
                    opacity: 1,
                    y: 0,
                    duration: 0.8,
                    delay: 0.6,
                    ease: "power2.out"
                }
            );

            // 3. SECTION HEADERS
            document.querySelectorAll("h2").forEach(title => {
                gsap.fromTo(title,
                    { opacity: 0, x: -50 },
                    {
                        scrollTrigger: {
                            trigger: title,
                            start: "top 85%",
                        },
                        opacity: 1,
                        x: 0,
                        duration: 0.8,
                        ease: "power2.out"
                    }
                );
            });

            // 4. CARDS
            document.querySelectorAll(".card").forEach((card, index) => {
                gsap.fromTo(card,
                    { opacity: 0, y: 50 },
                    {
                        scrollTrigger: {
                            trigger: card,
                            start: "top 85%",
                        },
                        opacity: 1,
                        y: 0,
                        duration: 0.8,
                        delay: index * 0.1,
                        ease: "power2.out"
                    }
                );
            });

            // 5. PARALLAX BACKGROUND
            gsap.to(".star-field", {
                scrollTrigger: {
                    trigger: "body",
                    start: "top top",
                    end: "bottom bottom",
                    scrub: 1.5
                },
                y: "30%",
                ease: "none"
            });

        }, 100);

        // 6. KONAMI CODE (always active)
        const konamiCode = [
            "ArrowUp", "ArrowUp",
            "ArrowDown", "ArrowDown",
            "ArrowLeft", "ArrowRight",
            "ArrowLeft", "ArrowRight",
            "b", "a"
        ];
        let konamiIndex = 0;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === konamiCode[konamiIndex]) {
                konamiIndex++;
                if (konamiIndex === konamiCode.length) {
                    activateSecretMode();
                    konamiIndex = 0;
                }
            } else {
                konamiIndex = 0;
            }
        };

        const activateSecretMode = () => {
            const msg = document.createElement("div");
            msg.textContent = "◆ HYPER MODE ACTIVATED ◆";
            msg.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                font-family: 'Orbitron', monospace;
                font-size: 2rem;
                color: #fbbf24;
                text-shadow: 0 0 30px #fbbf24;
                z-index: 99999;
                animation: pulse 0.5s ease-in-out 3;
            `;
            document.body.appendChild(msg);
            setTimeout(() => msg.remove(), 2000);
        };

        document.addEventListener("keydown", handleKeyDown);

        return () => {
            clearTimeout(initTimeout);
            document.removeEventListener("keydown", handleKeyDown);
            ScrollTrigger.getAll().forEach(trigger => trigger.kill());
        };
    }, []); // Empty dependency - run only once

    // Cursor trail effect - tied to theme
    useEffect(() => {
        // Clean up previous canvas if exists
        if (canvasRef.current) {
            canvasRef.current.remove();
            canvasRef.current = null;
        }
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }

        if (!isTech) return;

        const cursorTrail: { x: number; y: number; time: number }[] = [];
        const maxTrailLength = 20;
        const canvas = document.createElement("canvas");
        canvas.id = "cursor-trail-canvas";
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        canvas.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            pointer-events: none;
            z-index: 9998;
        `;
        document.body.appendChild(canvas);
        canvasRef.current = canvas;
        const ctx = canvas.getContext("2d");

        const drawCursorTrail = () => {
            if (!ctx) return;
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            cursorTrail.forEach((point, index) => {
                const age = Date.now() - point.time;
                const opacity = 1 - (age / 1000);
                const size = 3 * (index / maxTrailLength);

                if (opacity > 0) {
                    ctx.beginPath();
                    ctx.arc(point.x, point.y, size, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(74, 125, 255, ${opacity * 0.5})`;
                    ctx.shadowBlur = 10;
                    ctx.shadowColor = `rgba(74, 125, 255, ${opacity})`;
                    ctx.fill();
                }
            });
            animationFrameRef.current = requestAnimationFrame(drawCursorTrail);
        };

        const handleMouseMove = (e: MouseEvent) => {
            cursorTrail.push({
                x: e.clientX,
                y: e.clientY,
                time: Date.now()
            });

            if (cursorTrail.length > maxTrailLength) {
                cursorTrail.shift();
            }
        };

        const handleResize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        document.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("resize", handleResize);
        drawCursorTrail();

        return () => {
            document.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("resize", handleResize);
            if (canvasRef.current) {
                canvasRef.current.remove();
                canvasRef.current = null;
            }
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [isTech]); // Only re-run cursor trail when theme changes

    return null;
};

export default ScrollAnimations;
