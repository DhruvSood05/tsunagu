"use client";

import ReactMarkdown from "react-markdown";
import {
  RiSparkling2Fill,
  RiUser3Line,
} from "@remixicon/react";
import type { Message } from "@/types/ai";

interface AIChatBubbleProps {
  message: Message;
}

export default function AIChatBubble({ message }: AIChatBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div className={`flex gap-3.5 ${isUser ? "justify-end" : "justify-start"} font-sans select-none`}>
      {!isUser && (
        <div className="size-8 rounded-full bg-[#8b5cf6]/10 flex items-center justify-center border border-[#8b5cf6]/25 shrink-0 shadow-sm mt-0.5 animate-in fade-in duration-200">
          <RiSparkling2Fill className="size-4.5 text-[#8b5cf6]" />
        </div>
      )}
      
      <div className={`max-w-[80%] ${isUser ? "order-first" : ""}`}>
        <div
          className={`px-4 py-3 rounded-lg text-xs/relaxed shadow-sm transition-colors duration-150 ${
            isUser
              ? "bg-primary text-primary-foreground font-semibold rounded-tr-none shadow-md"
              : "bg-secondary/50 text-foreground border border-border/25 rounded-tl-none"
          }`}
        >
          {message.role === "assistant" && !message.content ? (
            <TypingIndicator />
          ) : message.role === "assistant" ? (
            <MarkdownMessage content={message.content} />
          ) : (
            <div className="whitespace-pre-wrap">{message.content}</div>
          )}
        </div>
      </div>

      {isUser && (
        <div className="size-8 rounded-full bg-secondary flex items-center justify-center border border-border/40 shrink-0 shadow-sm mt-0.5 animate-in fade-in duration-200">
          <RiUser3Line className="size-4 text-foreground/80" />
        </div>
      )}
    </div>
  );
}

function MarkdownMessage({ content }: { content: string }) {
  return (
    <ReactMarkdown
      components={{
        p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed text-xs">{children}</p>,
        strong: ({ children }) => <strong className="font-bold text-foreground">{children}</strong>,
        em: ({ children }) => <em className="italic">{children}</em>,
        ul: ({ children }) => <ul className="mb-2 last:mb-0 pl-4 space-y-1 list-disc text-xs">{children}</ul>,
        ol: ({ children }) => <ol className="mb-2 last:mb-0 pl-4 space-y-1 list-decimal text-xs">{children}</ol>,
        li: ({ children }) => <li className="leading-relaxed">{children}</li>,
        h1: ({ children }) => <h1 className="text-xs font-bold mb-2 mt-3 first:mt-0 text-foreground font-heading uppercase tracking-wide">{children}</h1>,
        h2: ({ children }) => <h2 className="text-[11px] font-bold mb-1.5 mt-3 first:mt-0 text-foreground font-heading uppercase tracking-wide">{children}</h2>,
        h3: ({ children }) => <h3 className="text-[10px] font-semibold mb-1 mt-2.5 first:mt-0 text-foreground font-heading uppercase tracking-wide">{children}</h3>,
        code: ({ children, className }) => {
          const isBlock = className?.includes("language-");
          if (isBlock) {
            return (
              <pre className="bg-secondary border border-border/45 rounded-md px-3 py-2.5 text-[11px] overflow-x-auto my-2.5 font-mono text-foreground shadow-inner">
                <code>{children}</code>
              </pre>
            );
          }
          return <code className="bg-secondary border border-border/30 rounded px-1.5 py-0.5 text-[10px] font-mono text-[#8b5cf6]">{children}</code>;
        },
        pre: ({ children }) => <>{children}</>,
        a: ({ href, children }) => (
          <a href={href} target="_blank" rel="noreferrer" className="text-[#8b5cf6] hover:text-[#8b5cf6]/80 underline underline-offset-2 font-semibold transition-colors">
            {children}
          </a>
        ),
        blockquote: ({ children }) => (
          <blockquote className="border-l-2 border-border/60 pl-3.5 text-muted-foreground italic my-2">{children}</blockquote>
        ),
        hr: () => <hr className="border-border/20 my-3" />,
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

function TypingIndicator() {
  return (
    <span className="flex gap-1.2 items-center h-4 py-1.5 select-none">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="size-1.5 rounded-full bg-[#8b5cf6]/60 animate-bounce"
          style={{ animationDelay: `${i * 150}ms`, animationDuration: "800ms" }}
        />
      ))}
    </span>
  );
}

