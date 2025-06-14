"use client";

import { useState, useEffect } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MarkdownRendererProps {
  content: string;
}

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [processedContent, setProcessedContent] = useState("");

  useEffect(() => {
    setIsClient(true);
  }, []);

  const copyToClipboard = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  // Process markdown content to add interactive features
  const processContent = (markdown: string, includeInteractive: boolean = false) => {
    // Convert code blocks to have copy buttons
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    let processedContent = markdown;
    let codeBlocks: { language: string; code: string }[] = [];
    let match;

    while ((match = codeBlockRegex.exec(markdown)) !== null) {
      const language = match[1] || "plaintext";
      const code = match[2].trim();
      codeBlocks.push({ language, code });
    }

    // Replace code blocks with placeholders
    processedContent = processedContent.replace(
      codeBlockRegex,
      (_, language) => `<CODE_BLOCK_${codeBlocks.length - 1} LANG="${language || 'plaintext'}">`
    );

    // Convert markdown to basic HTML (simplified version)
    processedContent = processedContent
      // Headers
      .replace(/^### (.*$)/gim, '<h3 class="text-xl font-bold mt-6 mb-2 text-neutral-900">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="text-2xl font-bold mt-8 mb-3 text-neutral-900">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="text-3xl font-bold mt-10 mb-4 text-neutral-900">$1</h1>')
      // Bold
      .replace(/\*\*(.*)\*\*/g, '<strong class="font-semibold text-neutral-900">$1</strong>')
      // Italic
      .replace(/\*(.*)\*/g, '<em class="italic text-neutral-900">$1</em>')
      // Links
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-primary hover:underline">$1</a>')
      // Lists
      .replace(/^\* (.+)/gim, '<li class="ml-4 list-disc text-neutral-900">$1</li>')
      .replace(/^- (.+)/gim, '<li class="ml-4 list-disc text-neutral-900">$1</li>')
      .replace(/^\d+\. (.+)/gim, '<li class="ml-4 list-decimal text-neutral-900">$1</li>')
      // Paragraphs
      .replace(/\n\n/g, '</p><p class="mb-4 text-neutral-900">')
      // Line breaks
      .replace(/\n/g, '<br />');

    // Wrap in paragraph tags
    processedContent = `<p class="mb-4 text-neutral-900">${processedContent}</p>`;

    // Restore code blocks
    codeBlocks.forEach((block, index) => {
      const copyButton = includeInteractive ? `
        <div class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            data-copy-code="${Buffer.from(block.code).toString('base64')}"
            class="p-2 rounded bg-neutral-200 hover:bg-neutral-300 transition-colors text-neutral-700"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
            </svg>
          </button>
        </div>
      ` : '';

      const codeHtml = `
        <div class="relative group my-6">
          ${copyButton}
          <pre class="bg-neutral-100 border border-neutral-200 rounded-lg p-4 overflow-x-auto">
            <code class="text-sm text-neutral-800 language-${block.language}">${escapeHtml(block.code)}</code>
          </pre>
        </div>
      `;
      processedContent = processedContent.replace(
        `<CODE_BLOCK_${index} LANG="${block.language}">`,
        codeHtml
      );
    });

    return processedContent;
  };

  const escapeHtml = (text: string) => {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
  };

  // Process content when component mounts or content changes
  useEffect(() => {
    setProcessedContent(processContent(content, isClient));
  }, [content, isClient]);

  // Handle copy button clicks after client-side hydration
  useEffect(() => {
    if (!isClient) return;

    const handleCopyClick = (event: Event) => {
      const target = event.target as HTMLElement;
      const button = target.closest('[data-copy-code]') as HTMLElement;
      if (button) {
        const encodedCode = button.getAttribute('data-copy-code');
        if (encodedCode) {
          const code = Buffer.from(encodedCode, 'base64').toString();
          copyToClipboard(code);
        }
      }
    };

    document.addEventListener('click', handleCopyClick);
    return () => document.removeEventListener('click', handleCopyClick);
  }, [isClient]);

  return (
    <div 
      className="markdown-content text-neutral-900"
      dangerouslySetInnerHTML={{ __html: processedContent }}
    />
  );
}