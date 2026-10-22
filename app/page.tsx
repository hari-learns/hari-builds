import { CopyEmail } from "./CopyEmail";

export default function Home() {
  return (
    <main className="stage">
      <div className="glow" aria-hidden />
      <div className="grain" aria-hidden />

      <header className="top">
        <span className="mark">H.</span>
        <span className="status"><i /> Open for projects</span>
      </header>

      <section className="center">
        <p className="eyebrow">Freelancer</p>
        <h1>
          Hari<span className="dot">.</span>
        </h1>
        <p className="line">
          I build things for people who <em>care how they turn out.</em>
        </p>
      </section>

      <footer className="bottom">
        <span className="label">Reach out</span>
        <CopyEmail email="hariharanrp.dev@gmail.com" />
      </footer>
    </main>
  );
}
