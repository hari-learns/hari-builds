"use client";

import React from "react";
import { motion } from "framer-motion";
import { Github, ExternalLink, Folder, Video } from "lucide-react";

const featuredProjects = [
    {
        title: "Lemonade Stand",
        description: "Lemonade Stand transforms complex news into different styles and languages. Imagine explaining tariffs to your grandparent vs a policy expert. It uses AI to adapt content to your language, level, and preferred style.",
        tech: ["SaaS", "AI-Powered", "Next.js", "Production"],
        github: "",
        live: "https://lemonade-stand-zeta.vercel.app/",
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
        icon: <Video className="text-[#c084fc] w-10 h-10" />
    },
    {
        title: "HariOnCloud9",
        description: "Leetcode solutions and problem-solving repository.",
        tech: ["Algorithms", "Problem Solving"],
        github: "#",
        live: "#",
        icon: <Folder className="text-[#c084fc] w-10 h-10" />
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
                    <span className="text-[#c084fc] font-mono text-xl">02.</span>
                    <h2 className="text-3xl md:text-4xl font-bold text-[#e4e4e7]">What I Build</h2>
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
                                <div className="aspect-video bg-[#1a1a24] flex items-center justify-center text-[#71717a] border border-[#c084fc]/10 rounded-lg overflow-hidden group-hover:border-[#c084fc]/30 transition-colors">
                                    <span className="font-mono text-lg">{project.title} Preview</span>
                                </div>
                            </div>

                            <div className={`md:col-span-5 flex flex-col ${index % 2 === 0 ? 'md:items-end md:text-right md:order-2' : 'md:items-start md:text-left md:order-1'}`}>
                                <span className="text-[#c084fc] font-mono text-sm mb-2">Featured Project</span>
                                <h3 className="text-2xl font-bold text-[#e4e4e7] mb-4 hover:text-[#c084fc] transition-colors">
                                    <a href={project.live}>{project.title}</a>
                                </h3>
                                <div className="bg-[#111118] p-6 rounded-lg shadow-xl mb-6 z-10 w-full">
                                    <p className="text-[#71717a]">{project.description}</p>
                                </div>
                                <ul className={`flex flex-wrap gap-4 mb-6 text-[#71717a] font-mono text-sm ${index % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                                    {project.tech.map(t => <li key={t} className="mr-2">{t}</li>)}
                                </ul>
                                <div className="flex gap-4">
                                    {project.github && <a href={project.github} className="text-[#e4e4e7] hover:text-[#c084fc] transition-colors"><Github size={20} /></a>}
                                    {project.live && <a href={project.live} className="text-[#e4e4e7] hover:text-[#c084fc] transition-colors"><ExternalLink size={20} /></a>}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Projects;
