'use client';

import type { ReactNode } from 'react';

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Convertit le markdown basique en JSX :
 * **gras** → <strong>, sauts de ligne → <br>
 */
function renderMarkdown(text: string): ReactNode {
  const lines = text.split('\n');
  return lines.map((line, li) => {
    const parts = line.split(/(\*\*[^*]+\*\*)/g);
    const rendered = parts.map((part, pi) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={pi} className="font-semibold text-white">{part.slice(2, -2)}</strong>;
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
      <div className="flex justify-end mb-3">
        <div
          className="max-w-[80%] px-4 py-2.5 bg-slate-700 text-slate-100 text-sm leading-relaxed"
          style={{
            borderRadius: '18px 18px 4px 18px',
          }}
        >
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start mb-3">
      {/* Avatar */}
      <div className="w-7 h-7 rounded-full bg-violet-500/20 border border-violet-500/40 flex items-center justify-center flex-shrink-0 mr-2 mt-0.5">
        <span className="text-violet-400 text-xs">✦</span>
      </div>
      <div
        className="max-w-[82%] px-4 py-2.5 bg-transparent border border-slate-700/70 text-slate-200 text-sm leading-relaxed"
        style={{
          borderRadius: '4px 18px 18px 18px',
        }}
      >
        {renderMarkdown(content)}
      </div>
    </div>
  );
}
