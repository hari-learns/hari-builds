"use client";

import React from "react";
import { motion } from "framer-motion";
import { Github, ExternalLink, Folder, Video } from "lucide-react";

const featuredProjects = [
    {
        title: "Lemonade Stand",
        description: "SaaS: Founded and developed 'lemonade-stand', a platform where news is delivered in a fun and engaging way to users globally.",
        tech: ["SaaS", "Web App", "Full Stack"],
        github: "#",
        live: "#",
        image: null
    },
    {
        title: "AI Vibe Coding",
        description: "Secure websites made in hours using AI-augmented development. Includes 'portfolio' and 'worksite-custom' projects demonstrating rapid production-grade delivery.",
        tech: ["AI", "Security", "Rapid Dev"],
        github: "#",
        live: "#",
        image: null
    }
];

const otherProjects = [
    {
        title: "Yeeeeetcode",
        description: "Youtube channel and platform for solving DSA problems.",
        tech: ["DSA", "Education", "Content"],
        github: "#",
        live: "#",
        icon: <Video className="text-[#22d3ee] w-10 h-10" />
    },
    {
        title: "HariOnCloud9",
        description: "Leetcode solutions and problem-solving repository.",
        tech: ["Algorithms", "Problem Solving"],
        github: "#",
        live: "#",
        icon: <Folder className="text-[#22d3ee] w-10 h-10" />
    }
];

const Projects = () => {
    return (
        <section id="projects" className="py-24 md:py-32 relative z-10">
            <div className="container-custom">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="flex items-center gap-4 mb-16"
                >
                    <span className="text-[#22d3ee] font-mono text-xl">02.</span>
                    <h2 className="text-3xl md:text-4xl font-bold text-[#e4e4e7]">Proof of Work</h2>
                    <div className="h-[1px] bg-[#1a1a24] flex-grow ml-4 max-w-xs"></div>
                </motion.div>

                <div className="flex flex-col gap-24 mb-32">
                    {featuredProjects.map((project, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                            className={`grid grid-cols-1 md:grid-cols-12 gap-8 items-center`}
                        >
                            <div className={`md:col-span-7 relative ${index % 2 === 0 ? 'md:order-1' : 'md:order-2'}`}>
                                <div className="aspect-video bg-[#1a1a24] flex items-center justify-center text-[#71717a] border border-[#22d3ee]/10 rounded-lg overflow-hidden group-hover:border-[#22d3ee]/30 transition-colors">
                                    <span className="font-mono text-lg">{project.title} Preview</span>
                                </div>
                            </div>

                            <div className={`md:col-span-5 flex flex-col ${index % 2 === 0 ? 'md:items-end md:text-right md:order-2' : 'md:items-start md:text-left md:order-1'}`}>
                                <span className="text-[#22d3ee] font-mono text-sm mb-2">Featured Project</span>
                                <h3 className="text-2xl font-bold text-[#e4e4e7] mb-4 hover:text-[#22d3ee] transition-colors">
                                    <a href={project.live}>{project.title}</a>
                                </h3>
                                <div className="bg-[#111118] p-6 rounded-lg shadow-xl mb-6 z-10 w-full">
                                    <p className="text-[#71717a]">{project.description}</p>
                                </div>
                                <ul className={`flex flex-wrap gap-4 mb-6 text-[#71717a] font-mono text-sm ${index % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                                    {project.tech.map(t => <li key={t} className="mr-2">{t}</li>)}
                                </ul>
                                <div className="flex gap-4">
                                    <a href={project.github} className="text-[#e4e4e7] hover:text-[#22d3ee] transition-colors"><Github size={20} /></a>
                                    <a href={project.live} className="text-[#e4e4e7] hover:text-[#22d3ee] transition-colors"><ExternalLink size={20} /></a>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                <h3 className="text-2xl font-bold text-[#e4e4e7] mb-12 text-center">Other Noteworthy Projects</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-20">
                    {otherProjects.map((project, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: index * 0.1 }}
                            className="bg-[#111118] p-8 rounded-lg hover:-translate-y-2 transition-transform duration-300 border border-transparent hover:border-[#22d3ee]/20 group h-full flex flex-col"
                        >
                            <div className="flex justify-between items-start mb-6">
                                <div className="text-[#22d3ee]">
                                    {project.icon}
                                </div>
                                <div className="flex gap-4">
                                    <a href={project.github} className="text-[#71717a] hover:text-[#22d3ee] transition-colors"><Github size={20} /></a>
                                    <a href={project.live} className="text-[#71717a] hover:text-[#22d3ee] transition-colors"><ExternalLink size={20} /></a>
                                </div>
                            </div>
                            <h3 className="text-xl font-bold text-[#e4e4e7] mb-4 group-hover:text-[#22d3ee] transition-colors">{project.title}</h3>
                            <p className="text-[#71717a] mb-6 flex-grow">{project.description}</p>
                            <ul className="flex flex-wrap gap-3 text-[#71717a] font-mono text-xs mt-auto">
                                {project.tech.map(t => <li key={t} className="mr-2">{t}</li>)}
                            </ul>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Projects;
