"use client";

import React from "react";
import { motion } from "framer-motion";

const experiences = [
    {
        company: "RNTBCI",
        role: "Fullstack Engineer",
        date: "2024 — Present",
        description: "Engineered features for enterprise-level parts nomenclature management system. Optimized database queries reducing GCP costs by 30%.",
        tech: ["GCP", "GKE", "Fullstack"]
    },
    {
        company: "Mphasis Limited",
        role: "Java Developer",
        date: "2022 — 2024",
        description: "Modernized legacy mainframe system for world's largest logistics company. Re-platformed to Java microservices managing global delivery routes.",
        tech: ["Java", "Spring Boot", "Microservices"]
    },
    {
        company: "Mphasis Limited",
        role: "Associate Developer",
        date: "2021 — 2022",
        description: "Architected and maintained AWS data pipelines processing 10M+ customer records daily. Migrated Oracle database to Amazon Redshift.",
        tech: ["AWS", "Redshift", "Python"]
    }
];

const MinimalExperience = () => {
    return (
        <section className="py-24 relative z-10">
            <div className="max-w-3xl mx-auto px-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="mb-16"
                >
                    <h2 className="text-sm font-mono text-zinc-500 uppercase tracking-widest mb-2">Experience</h2>
                    <div className="h-[1px] w-full bg-zinc-800"></div>
                </motion.div>

                <div className="space-y-16">
                    {experiences.map((exp, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            className="group"
                        >
                            <div className="flex flex-col md:flex-row md:items-baseline justify-between mb-4">
                                <h3 className="text-xl font-bold text-zinc-100 group-hover:text-zinc-400 transition-colors">
                                    {exp.role} <span className="text-zinc-500 font-normal">at {exp.company}</span>
                                </h3>
                                <span className="text-sm font-mono text-zinc-500 mt-1 md:mt-0">{exp.date}</span>
                            </div>
                            <p className="text-zinc-400 leading-relaxed mb-4 max-w-2xl">
                                {exp.description}
                            </p>
                            <div className="flex gap-3">
                                {exp.tech.map((t) => (
                                    <span key={t} className="text-xs font-mono text-zinc-600 bg-zinc-900/50 px-2 py-1 rounded border border-zinc-800">
                                        {t}
                                    </span>
                                ))}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default MinimalExperience;
