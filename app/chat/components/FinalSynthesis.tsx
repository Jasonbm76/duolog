"use client";

import { Message } from '@/lib/types/chat';
import { Copy, CheckCircle, Sparkles, ChevronDown, FileText, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface FinalSynthesisProps {
  message: Message;
}

export default function FinalSynthesis({ message }: FinalSynthesisProps) {
  const [copied, setCopied] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      toast.success('Final answer copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
      setIsDropdownOpen(false);
    } catch (err) {
      toast.error('Failed to copy text');
    }
  };

  const exportToPDF = async () => {
    console.log('PDF export started');
    if (!contentRef.current) {
      console.error('Content ref not available');
      return;
    }
    
    try {
      setIsExporting(true);
      setIsDropdownOpen(false);
      console.log('Creating PDF...');
      
      
      // Use jsPDF's text method instead of html2canvas for better page break handling
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      // Set up PDF styling
      pdf.setFont('helvetica');
      
      // Add header
      pdf.setFontSize(20);
      pdf.setTextColor(40, 40, 40);
      pdf.text('DuoLog.ai - Final Synthesis', 20, 25);
      
      pdf.setFontSize(10);
      pdf.setTextColor(100, 100, 100);
      pdf.text(`Generated on ${new Date().toLocaleDateString()}`, 20, 35);
      
      // Add horizontal line
      pdf.setDrawColor(200, 200, 200);
      pdf.line(20, 40, 190, 40);
      
      // Process content with proper line breaks
      const content = message.content;
      let yPosition = 55;
      const pageHeight = 280; // Leave margin at bottom
      const lineHeight = 6;
      const margin = 20;
      const maxWidth = 170;
      
      // Split content into paragraphs and process each
      const paragraphs = content.split('\n\n');
      
      for (const paragraph of paragraphs) {
        if (!paragraph.trim()) continue;
        
        // Check if we need a new page
        if (yPosition > pageHeight - 20) {
          pdf.addPage();
          yPosition = 25;
        }
        
        // Handle different text formatting
        if (paragraph.startsWith('#')) {
          // Heading
          pdf.setFontSize(14);
          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(40, 40, 40);
          const heading = paragraph.replace(/^#+\s*/, '');
          const headingLines = pdf.splitTextToSize(heading, maxWidth);
          
          for (const line of headingLines) {
            if (yPosition > pageHeight - 10) {
              pdf.addPage();
              yPosition = 25;
            }
            pdf.text(line, margin, yPosition);
            yPosition += lineHeight + 2;
          }
          yPosition += 4; // Extra space after heading
          
        } else if (paragraph.startsWith('*') || paragraph.startsWith('-')) {
          // List item
          pdf.setFontSize(11);
          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(60, 60, 60);
          const listItem = paragraph.replace(/^[\*\-]\s*/, '• ');
          const listLines = pdf.splitTextToSize(listItem, maxWidth - 5);
          
          for (const line of listLines) {
            if (yPosition > pageHeight - 10) {
              pdf.addPage();
              yPosition = 25;
            }
            pdf.text(line, margin + 5, yPosition);
            yPosition += lineHeight;
          }
          yPosition += 2; // Small space after list item
          
        } else if (paragraph.includes('```')) {
          // Code block
          pdf.setFontSize(9);
          pdf.setFont('courier', 'normal');
          pdf.setTextColor(80, 80, 80);
          
          const codeContent = paragraph.replace(/```[\w]*\n?/g, '').replace(/\n```/g, '');
          const codeLines = codeContent.split('\n');
          
          // Add background for code block
          const blockHeight = codeLines.length * (lineHeight - 1) + 6;
          if (yPosition + blockHeight > pageHeight - 10) {
            pdf.addPage();
            yPosition = 25;
          }
          
          pdf.setFillColor(245, 245, 245);
          pdf.rect(margin - 2, yPosition - 3, maxWidth + 4, blockHeight, 'F');
          
          for (const codeLine of codeLines) {
            if (yPosition > pageHeight - 10) {
              pdf.addPage();
              yPosition = 25;
            }
            pdf.text(codeLine, margin, yPosition);
            yPosition += lineHeight - 1;
          }
          yPosition += 6; // Extra space after code block
          
        } else {
          // Regular paragraph
          pdf.setFontSize(11);
          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(60, 60, 60);
          
          // Handle bold and italic text (basic)
          let processedText = paragraph
            .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold markers for now
            .replace(/\*(.*?)\*/g, '$1'); // Remove italic markers for now
          
          const lines = pdf.splitTextToSize(processedText, maxWidth);
          
          for (const line of lines) {
            if (yPosition > pageHeight - 10) {
              pdf.addPage();
              yPosition = 25;
            }
            pdf.text(line, margin, yPosition);
            yPosition += lineHeight;
          }
          yPosition += 4; // Space between paragraphs
        }
      }
      
      pdf.save(`duolog-synthesis-${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('PDF exported successfully!');
    } catch (error) {
      console.error('PDF export error:', error);
      toast.error('Failed to export PDF');
    } finally {
      setIsExporting(false);
    }
  };

  const exportToMarkdown = async () => {
    console.log('Markdown export started');
    try {
      setIsExporting(true);
      setIsDropdownOpen(false);
      console.log('Creating markdown file...');
      
      const markdownContent = `# DuoLog.ai - Final Synthesis

**Generated on:** ${new Date().toLocaleDateString()}

---

## Collaborative Answer

${message.content}

---

*This synthesis was generated through collaboration between Claude and GPT-4 on DuoLog.ai*
`;
      
      const blob = new Blob([markdownContent], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `duolog-synthesis-${new Date().toISOString().split('T')[0]}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success('Markdown file downloaded!');
    } catch (error) {
      console.error('Markdown export error:', error);
      toast.error('Failed to export markdown');
    } finally {
      setIsExporting(false);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  return (
    <div className="w-full max-w-4xl mx-auto px-4 lg:px-0">
      <div className="glass-card p-4 lg:p-6 bg-gradient-to-r from-primary/10 to-care/10 border-primary/20">
        {/* Header - Stack on mobile */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div className="flex items-center gap-2 lg:gap-3">
            <div className="flex items-center justify-center w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-primary/20 flex-shrink-0">
              <Sparkles className="w-4 h-4 lg:w-5 lg:h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-base lg:text-lg font-semibold text-on-dark">Final Answer</h3>
              <p className="text-xs lg:text-sm text-on-dark-muted hidden sm:block">Synthesized from Claude & GPT-4's collaboration</p>
            </div>
          </div>
          
          {/* Export Actions - Professional dropdown system */}
          <div ref={dropdownRef} className="relative w-full sm:w-auto">
            {/* Main Copy Button */}
            <div className="flex rounded-lg border border-primary/30 overflow-hidden">
              <button
                onClick={handleCopy}
                disabled={isExporting}
                className={cn(
                  "flex items-center justify-center gap-2 px-3 py-2 lg:px-4 transition-all duration-200 text-sm flex-1 sm:flex-none",
                  copied
                    ? "bg-success/20 text-success"
                    : "bg-primary/20 text-primary hover:bg-primary/30",
                  isExporting && "opacity-50 cursor-not-allowed"
                )}
              >
                {copied ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy</span>
                  </>
                )}
              </button>
              
              {/* Dropdown Toggle */}
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                disabled={isExporting}
                className={cn(
                  "flex items-center justify-center px-2 lg:px-3 border-l border-primary/30 transition-all duration-200",
                  "bg-primary/20 text-primary hover:bg-primary/30",
                  isExporting && "opacity-50 cursor-not-allowed"
                )}
              >
                <ChevronDown className={cn(
                  "w-4 h-4 transition-transform duration-200",
                  isDropdownOpen && "rotate-180"
                )} />
              </button>
            </div>
            
            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute top-full right-0 mt-2 w-56 bg-white/95 backdrop-blur-md rounded-lg border border-white/20 shadow-xl z-50">
                <div className="py-2">
                  <button
                    onClick={exportToPDF}
                    disabled={isExporting}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-primary/10 transition-colors disabled:opacity-50 text-left"
                  >
                    <FileText className="w-4 h-4 flex-shrink-0" />
                    <span>Export as PDF</span>
                  </button>
                  <button
                    onClick={exportToMarkdown}
                    disabled={isExporting}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-primary/10 transition-colors disabled:opacity-50 text-left"
                  >
                    <Download className="w-4 h-4 flex-shrink-0" />
                    <span>Export as Markdown</span>
                  </button>
                </div>
              </div>
            )}
            
            {/* Loading overlay */}
            {isExporting && (
              <div className="absolute inset-0 bg-black/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                <div className="flex items-center gap-2 text-white text-sm">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Exporting...
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Content - Responsive text sizing with markdown rendering */}
        <div ref={contentRef} className="max-w-none">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              // Custom renderers for glass theme styling (similar to MessageBubble)
              h1: ({ children }: any) => (
                <h1 className="text-lg lg:text-xl font-bold text-white mb-4 border-b border-white/20 pb-2">{children}</h1>
              ),
              h2: ({ children }: any) => (
                <h2 className="text-base lg:text-lg font-semibold text-white mb-3 border-b border-white/10 pb-1">{children}</h2>
              ),
              h3: ({ children }: any) => (
                <h3 className="text-sm lg:text-base font-semibold text-white mb-2">{children}</h3>
              ),
              p: ({ children }: any) => (
                <p className="text-white/90 mb-3 leading-relaxed text-xs sm:text-sm">{children}</p>
              ),
              ul: ({ children }: any) => (
                <ul className="list-disc list-inside text-white/90 mb-3 space-y-1 ml-2 text-xs sm:text-sm">{children}</ul>
              ),
              ol: ({ children }: any) => (
                <ol className="list-decimal list-inside text-white/90 mb-3 space-y-1 ml-2 text-xs sm:text-sm">{children}</ol>
              ),
              li: ({ children }: any) => (
                <li className="text-white/90">{children}</li>
              ),
              strong: ({ children }: any) => (
                <strong className="font-semibold text-white">{children}</strong>
              ),
              em: ({ children }: any) => (
                <em className="italic text-white/95">{children}</em>
              ),
              code: ({ children, className }: any) => {
                const isBlock = className?.includes('language-');
                if (isBlock) {
                  return (
                    <pre className="bg-black/30 text-white p-3 rounded-lg overflow-x-auto my-3 text-xs sm:text-sm">
                      <code>{children}</code>
                    </pre>
                  );
                }
                return (
                  <code className="bg-white/10 text-white px-2 py-1 rounded text-xs sm:text-sm font-mono border border-white/20">
                    {children}
                  </code>
                );
              },
              blockquote: ({ children }: any) => (
                <blockquote className="border-l-4 border-white/30 pl-4 my-4 bg-white/5 py-2 rounded-r-lg text-white/80 italic text-xs sm:text-sm">
                  {children}
                </blockquote>
              ),
              a: ({ children, href }: any) => (
                <a 
                  href={href} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-300 hover:text-blue-200 underline underline-offset-2 transition-colors"
                >
                  {children}
                </a>
              ),
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>

        {/* Footer note - Smaller on mobile */}
        <div className="mt-3 lg:mt-4 pt-3 lg:pt-4 border-t border-on-dark/10">
          <p className="text-[10px] sm:text-xs text-on-dark-muted">
            💡 This is the agreed-upon answer from both AIs. You can copy it, ask follow-up questions, or start a new conversation.
          </p>
        </div>
      </div>
    </div>
  );
}