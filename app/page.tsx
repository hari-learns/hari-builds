"use client";

import React from 'react';
import { Container } from './components/gharbi/Container';
import { Section } from './components/gharbi/Section';
import { Hero } from './components/gharbi/Hero';
import { ContentItem } from './components/gharbi/ContentItem';
import { ExperienceItem } from './components/gharbi/ExperienceItem';
import { FeaturedProject } from './components/gharbi/FeaturedProject';
import { ThemeToggle } from './components/gharbi/ThemeToggle';
import { Footer } from './components/gharbi/Footer';
import { Lifecycle } from './components/gharbi/Lifecycle';
import { SystemDesign } from './components/gharbi/SystemDesign';
import { Skillset } from './components/gharbi/Skillset';
import { ProjectPhilosophy } from './components/gharbi/ProjectPhilosophy';
import { RoamingCube } from './components/gharbi/RoamingCube';
import { CustomCursor } from './components/gharbi/CustomCursor';
import { ArchitectCard } from './components/gharbi/ArchitectCard';
import { ContactSection } from './components/gharbi/ContactSection';

const experiences = [
  {
    title: 'Fullstack Engineer',
    subtitle: 'at RNTBCI',
    date: '2024 — Present',
    description: 'Engineered features for enterprise-level parts nomenclature management system. Optimized database queries reducing GCP costs by 30%.',
    techStack: ['GCP', 'GKE', 'Fullstack'],
  },
  {
    title: 'Java Developer',
    subtitle: 'at Mphasis Limited [Banking]',
    date: '2022 — 2024',
    description: 'Modernized legacy mainframe system for world\'s largest logistics company. Re-platformed to Java microservices managing global delivery routes.',
    techStack: ['Java', 'Spring Boot', 'Microservices'],
  },
  {
    title: 'Associate Developer',
    subtitle: 'at Mphasis Limited [Logistics]',
    date: '2021 — 2022',
    description: 'Architected and maintained AWS data pipelines processing 10M+ customer records daily. Migrated Oracle database to Amazon Redshift.',
    techStack: ['AWS', 'Redshift', 'Python'],
  },
];

const featuredProject = {
  title: 'Lemonade Stand',
  description: 'A fun experiment with AI to transform complex news into different styles and languages. Built to explore how content can adapt to different audiences.',
  longDescription: 'Imagine explaining tariffs to your grandparent vs a policy expert. This side project uses AI to adapt content to your language, level, and preferred style. A weekend experiment that turned into something interesting.',
  link: 'https://lemonade-stand-zeta.vercel.app/',
  techStack: ['AI', 'Fun-news', 'Experiment'],
  highlights: [
    'AI-powered content transformation',
    'Multi-language support',
    'Built for learning and experimentation',
    'Open to explore and play around',
  ],
};

export default function Home() {
  return (
    <main style={{ minHeight: '100vh', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      <CustomCursor />
      <RoamingCube />
      <ThemeToggle />
      <Hero />
      <Container>
        <Section label="EXPERIENCE">
          <div
            style={{
              position: 'relative',
              paddingLeft: 'var(--space-lg)',
            }}
          >
            {/* Vertical line */}
            <div
              style={{
                position: 'absolute',
                left: '0',
                top: '0',
                bottom: '0',
                width: '1px',
                backgroundColor: 'var(--border)',
              }}
            />
            {experiences.map((exp, index) => (
              <ExperienceItem
                key={index}
                title={exp.title}
                subtitle={exp.subtitle}
                date={exp.date}
                description={exp.description}
                techStack={exp.techStack}
                isLast={index === experiences.length - 1}
              />
            ))}
          </div>
        </Section>

        <Section label="SELECTED WORK">
          <FeaturedProject
            title={featuredProject.title}
            description={featuredProject.description}
            longDescription={featuredProject.longDescription}
            techStack={featuredProject.techStack}
            link={featuredProject.link}
            highlights={featuredProject.highlights}
          />
          <FeaturedProject
            title="Brewing"
            description="Currently working on new projects and ideas. Building solutions that matter, one commit at a time."
            longDescription="In active development. Exploring new technologies, providing great service, and shipping products that make a difference."
            techStack={['In Progress', 'Having fun']}
          />
        </Section>
      </Container>
      <SystemDesign />
      <Skillset />
      <ProjectPhilosophy />
      <Lifecycle />
      <ContactSection />
    </main>
  );
}
