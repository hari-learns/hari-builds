"use client";

import React from "react";

const MinimalFooter = () => {
    return (
        <footer className="py-12 border-t border-zinc-900">
            <div className="max-w-3xl mx-auto px-6 flex justify-between items-center text-zinc-600 text-sm font-mono">
                <p>&copy; {new Date().getFullYear()} Hariharan</p>
                {/* <p>Built with Next.js & Tailwind</p> */}
            </div>
        </footer>
    );
};

export default MinimalFooter;
