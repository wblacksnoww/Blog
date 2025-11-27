import React from 'react';

interface MarkdownRendererProps {
  content: string;
}

// A simplified Markdown renderer for standard blog formatting.
// In a production app, use 'react-markdown' or 'remark'.
export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  const lines = content.split('\n');
  
  return (
    <article className="prose prose-lg prose-slate max-w-none font-serif leading-relaxed text-slate-800">
      {lines.map((line, index) => {
        // Headers
        if (line.startsWith('### ')) return <h3 key={index} className="text-xl font-bold mt-6 mb-3 text-slate-900">{line.replace('### ', '')}</h3>;
        if (line.startsWith('## ')) return <h2 key={index} className="text-2xl font-bold mt-8 mb-4 text-slate-900">{line.replace('## ', '')}</h2>;
        if (line.startsWith('# ')) return <h1 key={index} className="text-3xl font-bold mt-10 mb-6 text-slate-900">{line.replace('# ', '')}</h1>;
        
        // List items
        if (line.trim().startsWith('- ')) return <li key={index} className="ml-6 list-disc mb-2 pl-2">{line.replace('- ', '')}</li>;
        if (line.trim().match(/^\d+\. /)) return <li key={index} className="ml-6 list-decimal mb-2 pl-2">{line.replace(/^\d+\. /, '')}</li>;

        // Blockquotes
        if (line.startsWith('> ')) return <blockquote key={index} className="border-l-4 border-blue-500 pl-4 italic my-4 text-slate-600 bg-slate-50 py-2">{line.replace('> ', '')}</blockquote>;

        // Horizontal Rules
        if (line.trim() === '---') return <hr key={index} className="my-8 border-slate-200" />;

        // Code blocks (simple detection)
        if (line.startsWith('```')) return null; // Skip code fence markers for this simple parser
        
        // Empty lines
        if (line.trim() === '') return <div key={index} className="h-4"></div>;

        // Paragraphs with simple bold/italic formatting
        const formattedLine = line.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`)/g).map((part, i) => {
           if (part.startsWith('**') && part.endsWith('**')) return <strong key={i} className="font-bold text-slate-900">{part.slice(2, -2)}</strong>;
           if (part.startsWith('*') && part.endsWith('*')) return <em key={i} className="italic">{part.slice(1, -1)}</em>;
           if (part.startsWith('`') && part.endsWith('`')) return <code key={i} className="bg-slate-100 text-pink-600 px-1 py-0.5 rounded text-sm font-mono">{part.slice(1, -1)}</code>;
           return part;
        });

        return <p key={index} className="mb-4 text-lg">{formattedLine}</p>;
      })}
    </article>
  );
};
