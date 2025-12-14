"use client";

import React from "react";
import { motion } from "framer-motion";
import Image from "next/image";

const About = () => {
    return (
        <section id="about" className="py-24 md:py-32 relative z-10">
            <div className="container-custom">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="flex items-center gap-4 mb-12"
                >
                    <span className="text-[#c084fc] font-mono text-xl">01.</span>
                    <h2 className="text-3xl md:text-4xl font-bold text-[#e4e4e7]">The AI-Native Developer</h2>
                    <div className="h-[1px] bg-[#1a1a24] flex-grow ml-4 max-w-xs"></div>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-[3fr_2fr] gap-12 md:gap-20">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="text-[#a1a1aa] text-lg leading-relaxed space-y-6"
                    >
                        <p>
                            I've been building software for 4+ years, and here's what sets me apart: I don't just use AI—I understand how to get the best out of it, and I help teams do the same.
                        </p>
                        <p>
                            When AI tools first hit our teams, everyone was a bit confused about how to properly utilize them. A single prompt could either give you nothing or build an entire feature. It all depended on how you used it. I learned through curiosity and experimentation, then drove my team to level up alongside me.
                        </p>
                        <p>
                            I might not have every algorithm memorized, but if there's a better solution for a problem, I'll research it, understand it deeply, and implement it correctly. The difference? Curiosity and a relentless drive to learn.
                        </p>
                        <p className="text-[#e4e4e7] font-medium border-l-2 border-[#c084fc] pl-4 italic">
                            My approach: AI is a tool, not magic. I focus on building systems that are simple, secure, and scalable. The best code is code you don't have to explain.
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.4 }}
                        className="relative"
                    >
                        <div className="image-wrapper w-64 h-64 mx-auto md:mx-0 rounded-full overflow-hidden border-2 border-[#c084fc] shadow-[0_0_30px_rgba(192,132,252,0.3)] relative group">
                            <Image
                                src="/picture.jpeg"
                                alt="Hariharan R P"
                                fill
                                className="object-cover object-[center_60%] transition-transform duration-500 group-hover:scale-110"
                            />
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
};

export default About;
