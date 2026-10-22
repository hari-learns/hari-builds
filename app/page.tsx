import { ThemeToggle } from "./ThemeToggle";
import { Reveal } from "./Reveal";
import { Shelf, type Book } from "./Shelf";

const work = [
  { title: "hachemicals.com", industry: "Chemical industry", body: "A leading chemical supplier in the UAE.", href: "https://hachemicals.com", preview: "/previews/hachemicals.com.jpg", video: "/previews/hachemicals.com.mp4", colors: ["#3b5043", "#36814b", "#409e78", "#cfe5d7"], dark: ["#03140b", "#1f7a34", "#52c7a0", "#d6ffe6"] },
  { title: "everestheattreaters.com", industry: "Metal industry", body: "A leading heat treatment agency in Chennai.", href: "https://everestheattreaters.com", preview: "/previews/everestheattreaters.com.jpg", video: "/previews/everestheattreaters.com.mp4", colors: ["#584235", "#a1481f", "#d16017", "#e5d2b3"], dark: ["#150602", "#9a2f08", "#ff7a1a", "#ffe0a8"] },
  { title: "iteracare.in", industry: "Medical industry", body: "A new technology promoting natural wellness.", href: "https://iteracare.in", preview: "/previews/iteracare.in.jpg", video: "/previews/iteracare.in.mp4", colors: ["#3b485d", "#3361a6", "#348ac1", "#cae0e5"], dark: ["#030c1f", "#1b4fa8", "#3fb6e8", "#d2fbff"] },
  { title: "aubstrac.com", industry: "Fintech industry", body: "A lifestyle brand around building wealth. Launching soon in India.", href: "https://aubstrac.com", preview: "/previews/aubstrac.com.jpg", video: "/previews/aubstrac.com.mp4", colors: ["#4f4a40", "#8b6226", "#b88628", "#e5dcbe"], dark: ["#0a0d1a", "#7a4a10", "#e0a43a", "#fff0c4"] },
  { title: "ownwords.page", industry: "SaaS industry", body: "Turn your thoughts into income.", href: "https://ownwords.page", preview: "/previews/ownwords.page.jpg", video: "/previews/ownwords.page.mp4", colors: ["#49494c", "#4f4f58", "#787884", "#e0e0e2"], dark: ["#09090b", "#2b2b33", "#8d8d9c", "#f4f4f8"] },
  { title: "vedarthika.in", industry: "Fashion industry", body: "Kanchipuram silk sarees, woven in silk and gold zari.", href: "https://vedarthika.in", preview: "/previews/vedarthika.in.jpg", video: "/previews/vedarthika.in.mp4", colors: ["#4d3d4e", "#862e41", "#ad6136", "#e5d4bf"], dark: ["#0a0b24", "#7a0f26", "#d99a2b", "#ffe9b0"] },
  { title: "ravoraapps.tech", industry: "IT industry", body: "A creative studio in Chennai, building modern products accelerated with AI.", href: "https://ravoraapps.tech", preview: "/previews/ravoraapps.tech.jpg", video: "/previews/ravoraapps.tech.mp4", colors: ["#40435a", "#414fbb", "#556ad1", "#d3d6e5"], dark: ["#070818", "#2a3cc9", "#6f8cff", "#e4e9ff"] },
] satisfies Book[];

export default function Home() {
  return (
    <main className="page">
      <header className="top">
        <span className="name">Hariharan</span>
        <ThemeToggle />
      </header>

      <article className="doc">
        <h1 className="lead">
          I do what I love as work.<br />I focus on <em>real&#8209;world effect</em> and an <em>anthropological perspective.</em>
        </h1>

        <Reveal className="copy">
          <p><strong>Already have a business?</strong> I&rsquo;ll help you optimize it, online and offline.</p>
          <p><strong>Starting something new?</strong> I&rsquo;ll take your brand from zero to one.</p>
        </Reveal>

        <Reveal className="copy">
          <p>What worked for others in the past, even with a proven record, may not work for you. Nobody tells you this: your path to success is yours to find.</p>
          <p>Let&rsquo;s find it together.</p>
        </Reveal>

        <Reveal className="copy">
          <p>I&rsquo;ve worked across several industries, talking to real people. Real clients, tackling the real world.</p>
        </Reveal>

        <Reveal className="copy">
          <p>My goal is to give my clients their time back.</p>
          <p>I value time over money.</p>
        </Reveal>

        <Reveal className="copy">
          <p>
            Reach out to me at{" "}
            <a href="mailto:hariharanrp.dev@gmail.com">hariharanrp.dev@gmail.com</a>
          </p>
        </Reveal>
      </article>

      <section className="work" aria-labelledby="work-h">
        <Reveal>
          <h2 id="work-h" className="work-title">Work I&rsquo;ve done</h2>
        </Reveal>
        <Reveal delay={120}>
          <Shelf books={work} />
        </Reveal>
      </section>

    </main>
  );
}
