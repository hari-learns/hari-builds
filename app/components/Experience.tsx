"use client";

import React from "react";
import { motion } from "framer-motion";

const experiences = [
    {
        company: "RNTBCI - Automobile sector",
        title: "Fullstack Engineer",
        date: "Dec 2024 - Present",
        points: [
            "Engineered features for enterprise-level parts nomenclature management system serving as central reference database for global RN-M Alliance operations.",
            "Developed multi-role approval workflows with automated email notifications and audit trails, streamlining cross-team collaboration for international alliance operations.",
            "Optimized database queries and managed API call patterns, reducing GCP infrastructure costs by 30% through intelligent query optimization and caching.",
            "Migrated legacy infrastructure to Google Cloud Platform with containerized deployments on GKE, improving scalability and operational efficiency."
        ],
        tech: ["GCP", "GKE", "Fullstack", "Optimization"]
    },
    {
        company: "Mphasis Limited - Logistics sector",
        title: "Java Developer",
        date: "Mar 2022 - Dec 2024",
        points: [
            "Collaborated to modernizing legacy mainframe system for world's largest logistics company. Re-platformed to Java microservices managing global delivery routes.",
            "Built RESTful APIs following OWASP security standards, implementing authentication layers for web services serving international logistics operations.",
            "Developed Spring Boot microservices with automated JUnit testing and deployed through Jenkins CI/CD pipelines, ensuring zero-downtime across multiple batch jobs."
        ],
        tech: ["Java", "Spring Boot", "Microservices", "Jenkins", "OWASP"]
    },
    {
        company: "Mphasis Limited - Banking sector",
        title: "Associate Developer",
        date: "Jun 2021 - Mar 2022",
        points: [
            "Architected and maintained AWS data pipelines (Redshift, S3, Python) processing 10M+ customer records daily for major banking institution.",
            "Collaborated in 4-person team migrating Oracle database to Amazon Redshift using Athena, reducing query times by 60% and infrastructure costs significantly.",
            "Created automated shell scripts for daily data reloads and monitoring, eliminating manual intervention and ensuring constant uptime."
        ],
        tech: ["AWS", "Redshift", "Python", "Oracle", "Shell Scripting"]
    }
];

const Experience = () => {
    return (
        <section id="experience" className="py-24 md:py-32 relative z-10">
            <div className="container-custom">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="flex items-center gap-4 mb-16"
                >
                    <span className="text-[#22d3ee] font-mono text-xl">03.</span>
                    <h2 className="text-3xl md:text-4xl font-bold text-[#e4e4e7]">Where I've Worked</h2>
                    <div className="h-[1px] bg-[#1a1a24] flex-grow ml-4 max-w-xs"></div>
                </motion.div>

                <div className="max-w-3xl mx-auto">
                    {experiences.map((exp, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: index * 0.1 }}
                            className="experience-item"
                        >
                            <div className="experience-header">
                                <h3 className="experience-title">
                                    {exp.title} <span className="text-[#22d3ee]">@ {exp.company}</span>
                                </h3>
                                <span className="experience-date">{exp.date}</span>
                            </div>
                            <ul className="experience-list">
                                {exp.points.map((point, i) => (
                                    <li key={i}>{point}</li>
                                ))}
                            </ul>
                            <div className="flex flex-wrap gap-2 mt-4">
                                {exp.tech.map((t) => (
                                    <span key={t} className="text-xs font-mono text-[#22d3ee] bg-[#1a1a24] px-2 py-1 rounded">
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

export default Experience;
