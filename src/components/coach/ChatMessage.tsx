'use client';

import type { ReactNode } from 'react';
import { T } from '@/design/tokens';

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
}

function renderMarkdown(text: string): ReactNode {
  const lines = text.split('\n');
  return lines.map((line, li) => {
    const parts = line.split(/(\*\*[^*]+\*\*)/g);
    const rendered = parts.map((part, pi) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={pi} style={{ fontWeight: 600, color: T.t1 }}>{part.slice(2, -2)}</strong>;
      }
      return <span key={pi}>{part}</span>;
    });
    return (
      <span key={li}>
        {rendered}
        {li < lines.length - 1 && <br />}
      </span>
    );
  });
}

export default function ChatMessage({ role, content }: ChatMessageProps) {
  const isUser = role === 'user';

  if (isUser) {
    return (
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        <div style={{
          maxWidth: '80%',
          padding: '10px 16px',
          background: T.l3,
          color: T.t2,
          fontSize: '0.875rem',
          lineHeight: 1.6,
          borderRadius: '18px 18px 4px 18px',
        }}>
          {content}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 12 }}>
      <div style={{
        width: 28,
        height: 28,
        borderRadius: '50%',
        background: `${T.coach}20`,
        border: `1px solid ${T.coach}40`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        marginRight: 8,
        marginTop: 2,
      }}>
        <span style={{ color: T.coach, fontSize: '0.75rem' }}>✦</span>
      </div>
      <div style={{
        maxWidth: '82%',
        padding: '10px 16px',
        background: 'transparent',
        border: `1px solid ${T.border}`,
        color: T.t2,
        fontSize: '0.875rem',
        lineHeight: 1.6,
        borderRadius: '4px 18px 18px 18px',
      }}>
        {renderMarkdown(content)}
      </div>
    </div>
  );
}
