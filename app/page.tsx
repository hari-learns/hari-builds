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
    subtitle: 'at Mphasis Limited',
    date: '2022 — 2024',
    description: 'Modernized legacy mainframe system for world\'s largest logistics company. Re-platformed to Java microservices managing global delivery routes.',
    techStack: ['Java', 'Spring Boot', 'Microservices'],
  },
  {
    title: 'Associate Developer',
    subtitle: 'at Mphasis Limited',
    date: '2021 — 2022',
    description: 'Architected and maintained AWS data pipelines processing 10M+ customer records daily. Migrated Oracle database to Amazon Redshift.',
    techStack: ['AWS', 'Redshift', 'Python'],
  },
];

const featuredProject = {
  title: 'Lemonade Stand',
  description: 'Transforms complex news into different styles and languages using AI. Adapt content to your language, level, and preferred style.',
  longDescription: 'Imagine explaining tariffs to your grandparent vs a policy expert. Lemonade Stand uses AI to adapt content to your language, level, and preferred style. Built as a production-ready SaaS platform with a focus on user experience and scalability.',
  link: 'https://lemonade-stand-zeta.vercel.app/',
  techStack: ['Next.js', 'AI', 'SaaS', 'Production'],
  highlights: [
    'AI-powered content transformation engine',
    'Multi-language support with style adaptation',
    'Production-ready SaaS platform',
    'Scalable architecture for high traffic',
  ],
};

const otherProjects = [
  {
    title: 'Yeeeeetcode',
    description: 'Youtube channel and platform for solving DSA problems. Educational content for developers.',
    link: '#',
    techStack: ['Content', 'DSA', 'Education'],
  },
  {
    title: 'HariOnCloud9',
    description: 'Leetcode solutions and problem-solving repository. A collection of optimized algorithms.',
    link: '#',
    techStack: ['Algorithms', 'Problem Solving'],
  },
];

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
          {otherProjects.map((project, index) => (
            <ContentItem
              key={index}
              title={project.title}
              description={project.description}
              techStack={project.techStack}
              link={project.link}
            />
          ))}
        </Section>
      </Container>
      <SystemDesign />
      <Lifecycle />
      <ContactSection />
      <Footer />
    </main>
  );
}
