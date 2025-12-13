"use client";

import React from "react";
import { motion } from "framer-motion";
import { Github, Linkedin, Mail, FileText, Globe } from "lucide-react";

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
                    <span className="text-[#22d3ee] font-mono text-xl block mb-4">04. What's Next?</span>
                    <h2 className="contact-heading">Get In Touch</h2>

                    <p className="contact-description">
                        I'm currently looking for new opportunities and my inbox is always open.
                        Whether you have a question or just want to say hi, I'll get back to you!
                    </p>

                    <a href="mailto:hariharanrp.dev@gmail.com" className="contact-button">
                        Say Hello
                    </a>

                    <div className="social-links">
                        <a href="mailto:hariharanrp.dev@gmail.com" aria-label="Email"><Mail /></a>
                        <a href="https://hari-builds.tech" aria-label="Website" target="_blank" rel="noopener noreferrer"><Globe /></a>
                        <a href="#" aria-label="GitHub"><Github /></a>
                        <a href="#" aria-label="LinkedIn"><Linkedin /></a>
                        <a href="#" aria-label="Resume"><FileText /></a>
                    </div>
                </motion.div>
            </div>
        </section>
    );
};

export default Contact;
