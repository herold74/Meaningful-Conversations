import React from 'react';
import ReactMarkdown from 'react-markdown';

const inlineComponents = {
  p: ({ children }: { children?: React.ReactNode }) => <span>{children}</span>,
  strong: ({ children }: { children?: React.ReactNode }) => (
    <strong className="font-semibold text-content-primary">{children}</strong>
  ),
  em: ({ children }: { children?: React.ReactNode }) => <em>{children}</em>,
};

/** Renders LLM connector copy (often includes **bold** markdown) in UI text. */
export const ConnectorEvaluationMarkdown: React.FC<{
  text: string;
  className?: string;
}> = ({ text, className = 'text-sm text-content-secondary leading-relaxed' }) => (
  <div className={`${className} [&_p]:inline`}>
    <ReactMarkdown components={inlineComponents}>{text}</ReactMarkdown>
  </div>
);

export default ConnectorEvaluationMarkdown;
