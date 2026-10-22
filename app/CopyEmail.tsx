"use client";

import { useState } from "react";

export function CopyEmail({ email }: { email: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {}
  };
  return (
    <div className="mail">
      <a href={`mailto:${email}`} className="addr">
        {email}
        <span className="arrow" aria-hidden>↗</span>
      </a>
      <button type="button" onClick={copy} className="copy" aria-live="polite">
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}
