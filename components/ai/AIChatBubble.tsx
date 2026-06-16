"use client";

import ReactMarkdown from "react-markdown";
import {
  RiSparkling2Fill,
  RiUser3Line,
} from "@remixicon/react";
import type { Message } from "@/types/ai";
import EmailDraftCard from "./EmailDraftCard";
import EventCard from "./EventCard";

interface AIChatBubbleProps {
  message: Message;
}

export default function AIChatBubble({ message }: AIChatBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"} font-sans select-none w-full`}>
      {!isUser && (
        <div className="size-7 rounded-full bg-[#8b5cf6]/8 flex items-center justify-center border border-[#8b5cf6]/15 shrink-0 shadow-sm mt-1 animate-in fade-in duration-200">
          <RiSparkling2Fill className="size-3.5 text-[#8b5cf6]" />
        </div>
      )}
      
      <div className={`flex-1 min-w-0 flex flex-col ${isUser ? "items-end order-first" : "items-start"}`}>
        {(message.role === "user" || message.content || !message.artifacts?.length) && (
          <div
            className={`max-w-[80%] px-4 py-3 rounded-[14px] text-[13px] leading-[1.6] shadow-sm transition-colors duration-150 ${
              isUser
                ? "bg-primary text-primary-foreground font-medium rounded-tr-sm shadow-md"
                : "bg-secondary/40 text-foreground border border-border/20 rounded-tl-sm"
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
        )}

        {/* Structured artifacts — drafted/sent emails and created events */}
        {!isUser && message.artifacts && message.artifacts.length > 0 && (
          <div className="w-full flex flex-col mt-3 gap-3">
            {message.artifacts.map((artifact, i) =>
              artifact.kind === "email" ? (
                <EmailDraftCard key={i} email={artifact} />
              ) : (
                <EventCard key={i} event={artifact} />
              ),
            )}
          </div>
        )}
      </div>

      {isUser && (
        <div className="size-7 rounded-full bg-secondary flex items-center justify-center border border-border/30 shrink-0 shadow-sm mt-1 animate-in fade-in duration-200">
          <RiUser3Line className="size-3.5 text-foreground/70" />
        </div>
      )}
    </div>
  );
}

function MarkdownMessage({ content }: { content: string }) {
  return (
    <ReactMarkdown
      components={{
        p: ({ children }) => <p className="mb-2.5 last:mb-0 leading-[1.6] text-[13px]">{children}</p>,
        strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
        em: ({ children }) => <em className="italic text-foreground/70">{children}</em>,
        ul: ({ children }) => <ul className="mb-2.5 last:mb-0 pl-4 space-y-1.5 list-disc marker:text-foreground/25 text-[13px]">{children}</ul>,
        ol: ({ children }) => <ol className="mb-2.5 last:mb-0 pl-4 space-y-1.5 list-decimal marker:text-foreground/30 text-[13px]">{children}</ol>,
        li: ({ children }) => <li className="leading-[1.6] pl-0.5">{children}</li>,
        h1: ({ children }) => <h1 className="text-[13px] font-semibold mb-2 mt-3.5 first:mt-0 text-foreground font-heading uppercase tracking-wide">{children}</h1>,
        h2: ({ children }) => <h2 className="text-[12px] font-semibold mb-1.5 mt-3 first:mt-0 text-foreground font-heading uppercase tracking-wide">{children}</h2>,
        h3: ({ children }) => <h3 className="text-[11px] font-semibold mb-1 mt-2.5 first:mt-0 text-foreground font-heading uppercase tracking-wide">{children}</h3>,
        code: ({ children, className }) => {
          const isBlock = className?.includes("language-");
          if (isBlock) {
            return (
              <pre className="bg-secondary/80 border border-border/30 rounded-[10px] px-3.5 py-2.5 text-[11px] overflow-x-auto my-2.5 font-mono text-foreground">
                <code>{children}</code>
              </pre>
            );
          }
          return <code className="bg-secondary/60 border border-border/20 rounded-[5px] px-1.5 py-0.5 text-[11px] font-mono text-[#8b5cf6]">{children}</code>;
        },
        pre: ({ children }) => <>{children}</>,
        a: ({ href, children }) => (
          <a href={href} target="_blank" rel="noreferrer" className="text-[#8b5cf6] hover:text-[#8b5cf6]/80 underline underline-offset-2 font-medium transition-colors">
            {children}
          </a>
        ),
        blockquote: ({ children }) => (
          <blockquote className="border-l-2 border-[#8b5cf6]/20 pl-3.5 text-foreground/60 italic my-2.5">{children}</blockquote>
        ),
        hr: () => <hr className="border-border/15 my-3.5" />,
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

function TypingIndicator() {
  return (
    <span className="flex gap-1.5 items-center h-5 py-1.5 select-none">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="size-1.5 rounded-full bg-[#8b5cf6]/50 animate-bounce"
          style={{ animationDelay: `${i * 150}ms`, animationDuration: "800ms" }}
        />
      ))}
    </span>
  );
}
