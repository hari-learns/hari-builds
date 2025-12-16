import React from 'react';
import { Container } from './Container';

export const Footer: React.FC = () => {
  return (
    <Container>
      <footer
        style={{
          paddingTop: 'var(--space-3xl)',
          paddingBottom: 'var(--space-lg)',
          borderTop: '1px solid var(--border)',
          marginTop: 'var(--space-3xl)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: 'var(--text-small)',
            color: 'var(--text-muted)',
            flexWrap: 'wrap',
            gap: 'var(--space-sm)',
          }}
        >
          <p style={{ margin: 0 }}>&copy; {new Date().getFullYear()} Hariharan</p>
          <p style={{ margin: 0 }}>Have a great day!</p>
        </div>
      </footer>
    </Container>
  );
};

