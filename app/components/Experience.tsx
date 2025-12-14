"use client";

import React, { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Briefcase, Calendar, MapPin, Terminal, Code2, Database, Server, Shield } from "lucide-react";

const experiences = [
    {
        company: "RNTBCI - Automobile sector",
        role: "Fullstack Engineer",
        date: "Dec 2024 - Present",
        location: "Chennai, India",
        description: "Engineered features for enterprise-level parts nomenclature management system serving as central reference database for global RN-M Alliance operations.",
        achievements: [
            "Developed multi-role approval workflows with automated email notifications.",
            "Optimized database queries reducing GCP infrastructure costs by 30%.",
            "Migrated legacy infrastructure to Google Cloud Platform with GKE."
        ],
        tech: ["GCP", "GKE", "Fullstack", "Optimization"],
        icon: <Briefcase size={20} />,
        color: "#c084fc"
    },
    {
        company: "Mphasis Limited - Logistics",
        role: "Java Developer",
        date: "Mar 2022 - Dec 2024",
        location: "Chennai, India",
        description: "Modernized legacy mainframe system for world's largest logistics company. Re-platformed to Java microservices managing global delivery routes.",
        achievements: [
            "Built RESTful APIs following OWASP security standards.",
            "Developed Spring Boot microservices with automated JUnit testing.",
            "Ensured zero-downtime deployments via Jenkins CI/CD pipelines."
        ],
        tech: ["Java", "Spring Boot", "Microservices", "Jenkins"],
        icon: <Server size={20} />,
        color: "#a78bfa"
    },
    {
        company: "Mphasis Limited - Banking",
        role: "Associate Developer",
        date: "Jun 2021 - Mar 2022",
        location: "Chennai, India",
        description: "Architected and maintained AWS data pipelines (Redshift, S3, Python) processing 10M+ customer records daily for major banking institution.",
        achievements: [
            "Migrated Oracle database to Amazon Redshift using Athena.",
            "Reduced query times by 60% and infrastructure costs significantly.",
            "Created automated shell scripts for daily data reloads."
        ],
        tech: ["AWS", "Redshift", "Python", "Shell Scripting"],
        icon: <Database size={20} />,
        color: "#8b5cf6"
    }
];

const ExperienceCard = ({ exp, index }: { exp: any; index: number }) => {
    return (
        <motion.div
            initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7, delay: index * 0.2 }}
            className={`relative flex items-center justify-between md:justify-normal gap-8 mb-16 ${index % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
                }`}
        >
            {/* Timeline Dot */}
            <div className="absolute left-4 md:left-1/2 transform -translate-x-1/2 w-8 h-8 rounded-full bg-[#111118] border-2 border-[#c084fc] flex items-center justify-center z-10 shadow-[0_0_15px_rgba(192,132,252,0.5)]">
                <div className="w-3 h-3 rounded-full bg-[#c084fc] animate-pulse"></div>
            </div>

            {/* Content Card */}
            <div className={`w-full md:w-[45%] pl-12 md:pl-0 ${index % 2 === 0 ? "md:pr-12 md:text-right" : "md:pl-12"}`}>
                <div className="bg-[#111118] p-6 rounded-xl border border-[#c084fc]/20 hover:border-[#c084fc]/50 transition-all duration-300 group hover:shadow-[0_0_30px_rgba(192,132,252,0.1)] relative overflow-hidden">

                    {/* "Secret" Background Code Effect */}
                    <div className="absolute inset-0 opacity-5 pointer-events-none font-mono text-[10px] leading-3 overflow-hidden">
                        {Array(20).fill(0).map((_, i) => (
                            <div key={i}>
                                {((i * 1337 + index * 42).toString(16) + "x86_64" + (i * index).toString(16)).substring(0, 12)}
                            </div>
                        ))}
                    </div>

                    <div className={`flex items-center gap-3 mb-2 ${index % 2 === 0 ? "md:justify-end" : ""}`}>
                        <span className="text-[#c084fc] font-mono text-xs px-2 py-1 rounded bg-[#c084fc]/10 border border-[#c084fc]/20">
                            {exp.date}
                        </span>
                    </div>

                    <h3 className="text-xl font-bold text-[#e4e4e7] mb-1 group-hover:text-[#c084fc] transition-colors">
                        {exp.role}
                    </h3>
                    <h4 className="text-[#a1a1aa] font-medium mb-4 flex items-center gap-2 md:inline-flex">
                        <span className="hidden md:inline">@</span> {exp.company}
                    </h4>

                    <p className="text-[#a1a1aa] text-sm mb-4 leading-relaxed">
                        {exp.description}
                    </p>

                    <ul className={`space-y-2 mb-4 ${index % 2 === 0 ? "md:items-end" : ""}`}>
                        {exp.achievements.map((item: string, i: number) => (
                            <li key={i} className="text-[#71717a] text-xs flex items-start gap-2">
                                <span className="text-[#c084fc] mt-1">▹</span>
                                <span className={`text-left ${index % 2 === 0 ? "md:text-right" : ""}`}>{item}</span>
                            </li>
                        ))}
                    </ul>

                    <div className={`flex flex-wrap gap-2 ${index % 2 === 0 ? "md:justify-end" : ""}`}>
                        {exp.tech.map((t: string) => (
                            <span key={t} className="text-[10px] font-mono text-[#c084fc] bg-[#c084fc]/5 px-2 py-1 rounded border border-[#c084fc]/10">
                                {t}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            {/* Empty space for the other side */}
            <div className="hidden md:block w-[45%]"></div>
        </motion.div>
    );
};

const Experience = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start end", "end start"]
    });

    const scaleY = useTransform(scrollYProgress, [0, 1], [0, 1]);

    return (
        <section id="experience" className="py-24 md:py-32 relative z-10" ref={containerRef}>
            <div className="container-custom">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-20"
                >
                    <h2 className="text-3xl md:text-5xl font-bold text-[#e4e4e7] mb-6">
                        Mission <span className="text-[#c084fc]">Logs</span>
                    </h2>
                    <div className="h-1 w-20 bg-[#c084fc] mx-auto rounded-full"></div>
                </motion.div>

                <div className="relative max-w-5xl mx-auto">
                    {/* Central Line */}
                    <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-[2px] bg-[#1a1a24] transform -translate-x-1/2">
                        <motion.div
                            className="w-full bg-gradient-to-b from-[#c084fc] via-[#a78bfa] to-[#c084fc] origin-top"
                            style={{ scaleY, height: "100%" }}
                        />
                    </div>

                    {experiences.map((exp, index) => (
                        <ExperienceCard key={index} exp={exp} index={index} />
                    ))}
                </div>

                {/* The "Surprise" Element */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.5 }}
                    className="mt-20 text-center"
                >
                    <div className="inline-block relative group cursor-pointer">
                        <div className="absolute -inset-1 bg-gradient-to-r from-[#c084fc] to-[#a78bfa] rounded-lg blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
                        <div className="relative px-8 py-4 bg-[#0a0a0f] ring-1 ring-[#27272a] rounded-lg leading-none flex items-center space-x-4">
                            <span className="text-[#e4e4e7] font-mono text-sm">
                                Status: <span className="text-[#c084fc] animate-pulse">AVAILABLE FOR NEW OPPORTUNITIES</span>
                            </span>
                            <Terminal size={16} className="text-[#c084fc]" />
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
};

export default Experience;
