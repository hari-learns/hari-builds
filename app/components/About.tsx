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
                    <span className="text-[#22d3ee] font-mono text-xl">01.</span>
                    <h2 className="text-3xl md:text-4xl font-bold text-[#e4e4e7]">About Me</h2>
                    <div className="h-[1px] bg-[#1a1a24] flex-grow ml-4 max-w-xs"></div>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-[3fr_2fr] gap-12 md:gap-20">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="text-[#71717a] text-lg leading-relaxed space-y-6"
                    >
                        <p>
                            I am a Full-stack engineer with over 4 years of experience building enterprise systems and modern SaaS applications. My expertise lies in AI-augmented development, where I leverage LLMs, context management, and prompt engineering to significantly accelerate the development lifecycle.
                        </p>
                        <p>
                            I have a proven track record of architecting, building, and deploying complete web applications globally using Next.js, React, and cloud infrastructure. From database design to production deployment, I handle the entire stack independently.
                        </p>
                        <p>
                            I hold a B.TECH specialization in IoT from VIT University, Vellore. Currently, I am focused on building scalable solutions for high-impact business problems and advancing with AI.
                        </p>

                        <div className="mt-8">
                            <p className="mb-4 font-mono text-sm text-[#e4e4e7]">Here are a few technologies I work with:</p>
                            <div className="flex flex-wrap gap-2">
                                {[
                                    "JavaScript/TypeScript", "React", "Next.js", "Angular",
                                    "Java", "Spring Boot", "Node.js", "Python",
                                    "AWS", "GCP", "Docker", "Kubernetes",
                                    "PostgreSQL", "MySQL", "Supabase"
                                ].map((tech) => (
                                    <span key={tech} className="tech-tag">
                                        {tech}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.4 }}
                        className="relative"
                    >
                        <div className="image-wrapper w-48 h-48 mx-auto md:mx-0 rounded-full overflow-hidden border-2 border-[#22d3ee]">
                            {/* Placeholder image - user can replace later */}
                            <div className="w-full h-full bg-[#1a1a24] flex items-center justify-center text-[#71717a] flex-col gap-2 p-4 text-center">
                                <span className="text-2xl">👨‍💻</span>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
};

export default About;
