"use client";

import React from "react";
import { motion } from "framer-motion";
import { Brain, Shield, Users, Zap } from "lucide-react";

const Value = () => {
    return (
        <section id="philosophy" className="py-24 md:py-32 relative z-10">
            <div className="container-custom">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="flex items-center gap-4 mb-16"
                >
                    <span className="text-[#c084fc] font-mono text-xl">03.</span>
                    <h2 className="text-3xl md:text-4xl font-bold text-[#e4e4e7]">How I Add Value</h2>
                    <div className="h-[1px] bg-[#1a1a24] flex-grow ml-4 max-w-xs"></div>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-24">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="bg-[#111118] p-8 rounded-xl border border-[#c084fc]/10 hover:border-[#c084fc]/30 transition-all group"
                    >
                        <div className="w-12 h-12 bg-[#c084fc]/10 rounded-lg flex items-center justify-center mb-6 group-hover:bg-[#c084fc]/20 transition-colors">
                            <Users className="text-[#c084fc]" size={24} />
                        </div>
                        <h3 className="text-2xl font-bold text-[#e4e4e7] mb-4">The 10x Engineer Mindset</h3>
                        <p className="text-[#a1a1aa] leading-relaxed mb-6">
                            Its vital we build systems that prevent bugs. recently at my work, I turned a security bottleneck into an automated workflow, saving hours per sprint for the entire team.
                        </p>
                        <div className="pl-4 border-l-2 border-[#c084fc]">
                            <p className="text-[#e4e4e7] font-medium italic">
                                "Automate the boring. Master the complex. Ship the impossible."
                            </p>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="bg-[#111118] p-8 rounded-xl border border-[#c084fc]/10 hover:border-[#c084fc]/30 transition-all group"
                    >
                        <div className="w-12 h-12 bg-[#c084fc]/10 rounded-lg flex items-center justify-center mb-6 group-hover:bg-[#c084fc]/20 transition-colors">
                            <Brain className="text-[#c084fc]" size={24} />
                        </div>
                        <h3 className="text-2xl font-bold text-[#e4e4e7] mb-4">Strategic AI Integration</h3>
                        <p className="text-[#a1a1aa] leading-relaxed mb-4">
                            I architect workflows where LLMs handle the heavy lifting so humans can focus on high-level logic.
                        </p>
                        <ul className="space-y-2 text-[#a1a1aa] font-mono text-sm">
                            <li className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#c084fc]"></span>
                                Context-aware coding workflows
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#c084fc]"></span>
                                Cost-optimized model routing
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#c084fc]"></span>
                                Rapid prototyping to production
                            </li>
                        </ul>
                    </motion.div>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="max-w-4xl mx-auto"
                >
                    <h3 className="text-2xl font-bold text-[#e4e4e7] mb-8 text-center">My Philosophy</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="p-6 bg-[#111118]/50 rounded-lg border border-[#27272a] hover:border-[#c084fc]/30 transition-colors">
                            <h4 className="text-[#c084fc] font-bold mb-3 flex items-center gap-2">
                                <Zap size={18} /> Speed is a Feature
                            </h4>
                            <p className="text-[#a1a1aa] text-sm">
                                In the age of AI, shipping fast is the default. Shipping quality fast is the differentiator. I optimize for both velocity and stability.
                            </p>
                        </div>
                        <div className="p-6 bg-[#111118]/50 rounded-lg border border-[#27272a] hover:border-[#c084fc]/30 transition-colors">
                            <h4 className="text-[#c084fc] font-bold mb-3 flex items-center gap-2">
                                <Shield size={18} /> Simplicity Wins
                            </h4>
                            <p className="text-[#a1a1aa] text-sm">
                                Complex code is a liability. I fight for simplicity in architecture, UI, and communication. If it's hard to explain, it's wrong.
                            </p>
                        </div>
                        <div className="p-6 bg-[#111118]/50 rounded-lg border border-[#27272a] hover:border-[#c084fc]/30 transition-colors">
                            <h4 className="text-[#c084fc] font-bold mb-3 flex items-center gap-2">
                                <Users size={18} /> The Force Multiplier
                            </h4>
                            <p className="text-[#a1a1aa] text-sm">
                                I don't just write code. I amplify the team. Whether it's automating workflows or mentoring, I believe I make my colleagues around me better.
                            </p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
};

export default Value;
