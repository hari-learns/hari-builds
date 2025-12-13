"use client";

import React, { useEffect, useState } from "react";

const StarField = () => {
    const [stars, setStars] = useState<{ id: number; style: React.CSSProperties }[]>([]);

    useEffect(() => {
        const generateStars = (count: number, size: number, opacityRange: [number, number], duration: number) => {
            return Array.from({ length: count }).map((_, i) => {
                const left = Math.random() * 100;
                const top = Math.random() * 100;
                const opacity = Math.random() * (opacityRange[1] - opacityRange[0]) + opacityRange[0];
                const delay = Math.random() * duration;

                return {
                    id: Math.random(),
                    style: {
                        left: `${left}%`,
                        top: `${top}%`,
                        width: `${size}px`,
                        height: `${size}px`,
                        opacity,
                        animation: `drift ${duration}s linear infinite`,
                        animationDelay: `-${delay}s`,
                    },
                };
            });
        };

        const layer1 = generateStars(200, 1, [0.3, 0.6], 100);
        const layer2 = generateStars(100, 2, [0.5, 0.8], 75);
        const layer3 = generateStars(50, 3, [0.7, 1.0], 50);

        setStars([...layer1, ...layer2, ...layer3]);
    }, []);

    return (
        <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
            {stars.map((star) => (
                <div
                    key={star.id}
                    className="absolute bg-white rounded-full"
                    style={star.style}
                />
            ))}
        </div>
    );
};

export default StarField;
