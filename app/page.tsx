import StarField from "./components/StarField";
import Spaceship from "./components/Spaceship";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import About from "./components/About";
import Experience from "./components/Experience";
import Projects from "./components/Projects";
import Standout from "./components/Standout";
import Value from "./components/Value";
import Contact from "./components/Contact";
import Footer from "./components/Footer";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0a0a0f] text-[#e4e4e7] overflow-x-hidden">
      <StarField />
      <Spaceship />
      <Spaceship />
      <Navbar />
      <Hero />
      <About />
      <Experience />
      <Projects />
      <Standout />
      <Value />
      <Contact />
      <Footer />
    </main>
  );
}
