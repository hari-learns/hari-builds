"use client";

import React from "react";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";

const projects = [
    {
        title: "Lemonade Stand",
        description: "Transforms complex news into different styles and languages using AI. Adapt content to your language, level, and preferred style.",
        link: "https://lemonade-stand-zeta.vercel.app/",
        tech: "Next.js • AI • SaaS"
    },
    {
        title: "Yeeeeetcode",
        description: "Youtube channel and platform for solving DSA problems. Educational content for developers.",
        link: "#",
        tech: "Content • DSA • Education"
    },
    {
        title: "HariOnCloud9",
        description: "Leetcode solutions and problem-solving repository. A collection of optimized algorithms.",
        link: "#",
        tech: "Algorithms • Problem Solving"
    }
];

const MinimalProjects = () => {
    return (
        <section className="py-24 relative z-10">
            <div className="max-w-3xl mx-auto px-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="mb-16"
                >
                    <h2 className="text-sm font-mono text-zinc-500 uppercase tracking-widest mb-2">Selected Work</h2>
                    <div className="h-[1px] w-full bg-zinc-800"></div>
                </motion.div>

                <div className="grid gap-12">
                    {projects.map((project, index) => (
                        <motion.a
                            key={index}
                            href={project.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            className="group block p-6 -mx-6 rounded-xl hover:bg-zinc-900/50 transition-colors"
                        >
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="text-xl font-bold text-zinc-100 group-hover:text-white transition-colors flex items-center gap-2">
                                    {project.title}
                                    <ArrowUpRight size={18} className="opacity-0 group-hover:opacity-100 transition-opacity text-zinc-500" />
                                </h3>
                                <span className="text-xs font-mono text-zinc-500">{project.tech}</span>
                            </div>
                            <p className="text-zinc-400 leading-relaxed max-w-xl">
                                {project.description}
                            </p>
                        </motion.a>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default MinimalProjects;
