"use client";

import React from "react";
import { motion } from "framer-motion";
import { Linkedin, Mail, FileText, Twitter } from "lucide-react";

const Contact = () => {
    return (
        <section id="contact" className="relative z-10">
            <div className="container-custom">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="text-center max-w-5xl mx-auto"
                >
                    {/* <span className="text-[#c084fc] font-mono text-xl block mb-4">04. Let's Connect</span> */}
                    <h2 className="text-6xl md:text-8xl font-bold text-[#e4e4e7] mb-8">Ready to Ship?</h2>

                    <p className="contact-description mb-12">
                        Consistently learning and unlearning. Let's stay ahead of what's next in AI-augmented development.
                        <br /><br />
                        If you're looking for someone who can ship, lead, and level up how your team works, let's talk.
                    </p>

                    <a href="mailto:hariharanrp.dev@gmail.com" className="button inline-block px-8 py-4 bg-[#c084fc]/10 text-[#c084fc] border border-[#c084fc]/20 rounded-lg hover:bg-[#c084fc]/20 transition-all font-bold mb-16">
                        Start a Conversation
                    </a>

                    <div className="flex justify-center gap-8 text-[#a1a1aa] mb-16">
                        <a href="mailto:hariharanrp.dev@gmail.com" aria-label="Email" className="hover:text-[#c084fc] transition-colors hover:scale-110 transform duration-200"><Mail size={24} /></a>
                        <a href="https://www.linkedin.com/in/hariharan-rp-3b4770242/" aria-label="LinkedIn" target="_blank" rel="noopener noreferrer" className="hover:text-[#c084fc] transition-colors hover:scale-110 transform duration-200"><Linkedin size={24} /></a>
                        <a href="https://x.com/hxharan" aria-label="X (Twitter)" target="_blank" rel="noopener noreferrer" className="hover:text-[#c084fc] transition-colors hover:scale-110 transform duration-200"><Twitter size={24} /></a>
                        <a href="/resume.pdf" aria-label="Resume" target="_blank" rel="noopener noreferrer" download className="hover:text-[#c084fc] transition-colors hover:scale-110 transform duration-200"><FileText size={24} /></a>
                    </div>
                </motion.div>
            </div>
        </section>
    );
};

export default Contact;
