"use client";

import React, { useState } from 'react';
import { Mail, Phone, X } from 'lucide-react';
import { Container } from './Container';
import { Section } from './Section';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';

export const ContactSection: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedOption, setSelectedOption] = useState<'email' | 'phone' | null>(null);

  const email = 'hariharanrp.dev@gmail.com';
  const phone = '+91 9884966442';

  const handleReachOutClick = () => {
    if (!isExpanded) {
      setIsExpanded(true);
    } else {
      setIsExpanded(false);
      setSelectedOption(null);
    }
  };

  const handleOptionClick = (option: 'email' | 'phone', e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedOption === option) {
      if (option === 'email') {
        window.location.href = `mailto:${email}`;
      } else if (option === 'phone') {
        window.location.href = `tel:${phone.replace(/\s/g, '')}`;
      }
    } else {
      setSelectedOption(option);
    }
  };

  return (
    <Container>
      <Section label="REACH OUT">
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 'var(--space-xl) 0',
          }}
        >
          <LayoutGroup>
            <div
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                maxWidth: '600px',
              }}
            >
              {/* Left side - Email */}
              <AnimatePresence mode="wait">
                {isExpanded && (
                  <motion.div
                    key="email-button"
                    layout
                    initial={{ opacity: 0, scale: 0.8, x: -30 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.8, x: -30 }}
                    transition={{
                      type: 'spring',
                      stiffness: 300,
                      damping: 25,
                      opacity: { duration: 0.2, delay: 0.1 },
                    }}
                    style={{
                      marginRight: 'var(--space-sm)',
                      overflow: 'hidden',
                    }}
                  >
                    <motion.button
                      layout
                      onClick={(e) => handleOptionClick('email', e)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      style={{
                        padding: 'var(--space-md) var(--space-lg)',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        backgroundColor: selectedOption === 'email' ? 'var(--bg-primary)' : 'var(--bg-secondary)',
                        color: 'var(--text-primary)',
                        fontSize: 'var(--text-body)',
                        fontWeight: 'var(--weight-medium)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--space-sm)',
                        whiteSpace: 'nowrap',
                        transition: 'border-color 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = 'var(--text-primary)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'var(--border)';
                      }}
                    >
                      <Mail size={18} />
                      <AnimatePresence mode="wait">
                        {selectedOption === 'email' ? (
                          <motion.span
                            key="email-text"
                            initial={{ opacity: 0, width: 0 }}
                            animate={{ opacity: 1, width: 'auto' }}
                            exit={{ opacity: 0, width: 0 }}
                            transition={{ duration: 0.3 }}
                            style={{
                              fontSize: 'var(--text-small)',
                              overflow: 'hidden',
                              display: 'inline-block',
                            }}
                          >
                            {email}
                          </motion.span>
                        ) : (
                          <motion.span
                            key="email-label"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2, delay: 0.15 }}
                          >
                            Email
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Center Button */}
              <motion.button
                layout
                onClick={handleReachOutClick}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                style={{
                  padding: 'var(--space-md) var(--space-lg)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  backgroundColor: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  fontSize: 'var(--text-body)',
                  fontWeight: 'var(--weight-medium)',
                  cursor: 'pointer',
                  transition: 'border-color 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 'var(--space-sm)',
                  zIndex: 10,
                  position: 'relative',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--text-primary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border)';
                }}
              >
                <AnimatePresence mode="wait">
                  {!isExpanded ? (
                    <motion.span
                      key="reach-out"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      Reach Out
                    </motion.span>
                  ) : (
                    <motion.span
                      key="close"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}
                    >
                      <X size={18} />
                      Close
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>

              {/* Right side - Phone */}
              <AnimatePresence mode="wait">
                {isExpanded && (
                  <motion.div
                    key="phone-button"
                    layout
                    initial={{ opacity: 0, scale: 0.8, x: 30 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.8, x: 30 }}
                    transition={{
                      type: 'spring',
                      stiffness: 300,
                      damping: 25,
                      opacity: { duration: 0.2, delay: 0.1 },
                    }}
                    style={{
                      marginLeft: 'var(--space-sm)',
                      overflow: 'hidden',
                    }}
                  >
                    <motion.button
                      layout
                      onClick={(e) => handleOptionClick('phone', e)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      style={{
                        padding: 'var(--space-md) var(--space-lg)',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        backgroundColor: selectedOption === 'phone' ? 'var(--bg-primary)' : 'var(--bg-secondary)',
                        color: 'var(--text-primary)',
                        fontSize: 'var(--text-body)',
                        fontWeight: 'var(--weight-medium)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--space-sm)',
                        whiteSpace: 'nowrap',
                        transition: 'border-color 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = 'var(--text-primary)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'var(--border)';
                      }}
                    >
                      <Phone size={18} />
                      <AnimatePresence mode="wait">
                        {selectedOption === 'phone' ? (
                          <motion.span
                            key="phone-text"
                            initial={{ opacity: 0, width: 0 }}
                            animate={{ opacity: 1, width: 'auto' }}
                            exit={{ opacity: 0, width: 0 }}
                            transition={{ duration: 0.3 }}
                            style={{
                              fontSize: 'var(--text-small)',
                              overflow: 'hidden',
                              display: 'inline-block',
                            }}
                          >
                            {phone}
                          </motion.span>
                        ) : (
                          <motion.span
                            key="phone-label"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2, delay: 0.15 }}
                          >
                            Phone
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </LayoutGroup>
        </div>
      </Section>
    </Container>
  );
};

