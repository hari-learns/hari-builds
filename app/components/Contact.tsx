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
                    className="text-center max-w-2xl mx-auto"
                >
                    <span className="text-[#c084fc] font-mono text-xl block mb-4">04. Let's Connect</span>
                    <h2 className="contact-heading">Ready to Ship?</h2>

                    <p className="contact-description">
                        Consistently learning and unlearning. Let's stay ahead of what's next in AI-augmented development.
                        <br /><br />
                        If you're looking for someone who can ship, lead, and level up how your team works, let's talk.
                    </p>

                    <a href="mailto:hariharanrp.dev@gmail.com" className="inline-block px-8 py-4 bg-[#c084fc]/10 text-[#c084fc] border border-[#c084fc]/20 rounded-lg hover:bg-[#c084fc]/20 transition-all font-bold mb-12">
                        Start a Conversation
                    </a>

                    <div className="social-links">
                        <a href="mailto:hariharanrp.dev@gmail.com" aria-label="Email"><Mail /></a>
                        <a href="https://www.linkedin.com/in/hariharan-rp-3b4770242/" aria-label="LinkedIn" target="_blank" rel="noopener noreferrer"><Linkedin /></a>
                        <a href="https://x.com/hxharan" aria-label="X (Twitter)" target="_blank" rel="noopener noreferrer"><Twitter /></a>
                        <a href="/resume.pdf" aria-label="Resume" target="_blank" rel="noopener noreferrer" download><FileText /></a>
                    </div>
                </motion.div>
            </div>
        </section>
    );
};

export default Contact;
