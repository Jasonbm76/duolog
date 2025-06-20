// Universal PDF text extraction utility using pdfjs-dist (Edge Runtime compatible)

export class UniversalPdfExtractor {
  static async extractAllText(arrayBuffer: ArrayBuffer): Promise<string> {
    try {
      console.log('🔍 Starting PDF extraction process...');
      console.log('📊 PDF file size:', arrayBuffer.byteLength, 'bytes');
      
      // Dynamically import pdfjs-dist
      const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
      console.log('✅ pdfjs-dist loaded successfully');
      
      // Load the PDF document with detailed error handling
      let pdf;
      try {
        pdf = await pdfjsLib.getDocument({
          data: new Uint8Array(arrayBuffer),
          useSystemFonts: true,
          disableFontFace: false, // Allow custom fonts
          verbosity: 0, // Reduce console noise
          cMapUrl: undefined, // Let pdfjs handle this
          cMapPacked: true,
          standardFontDataUrl: undefined, // Let pdfjs handle this
          useWorkerFetch: false, // Edge runtime compatibility
          isEvalSupported: false, // Edge runtime security
          disableAutoFetch: false, // Allow auto-fetching resources
          disableStream: false, // Allow streaming
          disableRange: false, // Allow range requests
        }).promise;
        console.log('✅ PDF document loaded successfully');
        console.log('📄 PDF info:', {
          numPages: pdf.numPages,
          fingerprint: pdf.fingerprint
        });
      } catch (pdfLoadError) {
        console.error('❌ Failed to load PDF document:', pdfLoadError);
        throw new Error(`PDF loading failed: ${pdfLoadError instanceof Error ? pdfLoadError.message : 'Unknown PDF format error'}`);
      }
      
      let fullText = '';
      let successfulPages = 0;
      let failedPages = 0;
      
      // Extract ALL text from ALL pages
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        try {
          console.log(`📖 Processing page ${pageNum}/${pdf.numPages}...`);
          
          const page = await pdf.getPage(pageNum);
          const textContent = await page.getTextContent();
          
          console.log(`📝 Page ${pageNum} text items:`, textContent.items.length);
          
          // Preserve basic formatting and structure
          let pageText = '';
          let currentY: number | null = null;
          
          textContent.items.forEach((item: any, index) => {
            // Debug first few items to understand structure
            if (index < 3) {
              console.log(`📄 Page ${pageNum} item ${index}:`, {
                str: item.str?.substring(0, 50),
                transform: item.transform,
                hasStr: !!item.str
              });
            }
            
            // Add line breaks when Y position changes significantly
            if (currentY !== null && Math.abs(item.transform[5] - currentY) > 5) {
              pageText += '\n';
            }
            
            pageText += (item.str || '') + ' ';
            currentY = item.transform[5];
          });
          
          if (pageText.trim()) {
            fullText += `\n--- PAGE ${pageNum} ---\n${pageText.trim()}\n`;
            successfulPages++;
            console.log(`✅ Page ${pageNum} extracted: ${pageText.trim().length} characters`);
          } else {
            console.warn(`⚠️  Page ${pageNum} appears to be empty or image-only`);
            fullText += `\n--- PAGE ${pageNum} ---\n[This page appears to be empty or contains only images]\n`;
            failedPages++;
          }
          
        } catch (pageError) {
          console.error(`❌ Error extracting text from page ${pageNum}:`, pageError);
          fullText += `\n--- PAGE ${pageNum} ---\n[Error extracting text from this page: ${pageError instanceof Error ? pageError.message : 'Unknown error'}]\n`;
          failedPages++;
        }
      }
      
      console.log('📊 Extraction summary:', {
        totalPages: pdf.numPages,
        successfulPages,
        failedPages,
        totalCharacters: fullText.length
      });
      
      if (!fullText.trim()) {
        const errorMsg = `PDF extraction completed but no text found. This usually means:
1. The PDF contains only images or scanned content (needs OCR)
2. The PDF uses a non-standard text encoding
3. The PDF has security restrictions preventing text extraction

Despite having ${pdf.numPages} page(s), no readable text was detected.`;
        console.error('❌ No text extracted:', errorMsg);
        return `[${errorMsg}]`;
      }
      
      if (failedPages > 0 && successfulPages === 0) {
        const errorMsg = `PDF extraction failed on all ${pdf.numPages} page(s). This suggests:
1. The PDF may be corrupted or use an unsupported format
2. The PDF contains only images/scans (consider converting to OCR-readable format)
3. Security restrictions prevent text access
4. The PDF uses proprietary fonts or encoding that pdfjs-dist cannot handle

You might try:
- Converting the PDF to a newer format
- Using an OCR tool to extract text
- Copying and pasting the text directly into the chat`;
        console.error('❌ All pages failed:', errorMsg);
        return `[${errorMsg}]`;
      }
      
      console.log('✅ PDF text extraction completed successfully');
      return fullText.trim();
      
    } catch (error) {
      const errorMsg = `PDF text extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error('❌ PDF extraction error:', error);
      
      // Provide helpful error message based on error type
      if (error instanceof Error) {
        if (error.message.includes('Invalid PDF')) {
          return `[PDF Error: The uploaded file appears to be corrupted or not a valid PDF. Please try re-saving or re-exporting the PDF and upload again.]`;
        }
        if (error.message.includes('password') || error.message.includes('encrypted')) {
          return `[PDF Error: This PDF appears to be password-protected or encrypted. Please remove the password protection and try again.]`;
        }
        if (error.message.includes('loading')) {
          return `[PDF Error: Failed to load the PDF file. The file might be corrupted or use an unsupported PDF version. Try opening it in a PDF viewer and re-saving it.]`;
        }
      }
      
      return `[PDF Error: Could not extract text from this PDF file. Error: ${errorMsg}

You can try:
1. Copy and paste the text directly into this chat
2. Convert the PDF to a text file
3. Use a different PDF if available]`;
    }
  }

  static estimateTokens(text: string): number {
    // Rough estimate: ~4 characters per token
    return Math.ceil(text.length / 4);
  }

  static truncateIfNeeded(text: string, maxTokens: number = 180000): string {
    const estimatedTokens = this.estimateTokens(text);
    
    if (estimatedTokens <= maxTokens) {
      return text;
    }
    
    // If too long, take first 80% and last 10%, add notice
    const maxChars = maxTokens * 4;
    const firstPart = text.slice(0, Math.floor(maxChars * 0.8));
    const lastPart = text.slice(-Math.floor(maxChars * 0.1));
    
    return `${firstPart}\n\n[... MIDDLE SECTION TRUNCATED DUE TO LENGTH ...]\n\n${lastPart}`;
  }
}

// Legacy function for backward compatibility
export async function extractPDFText(arrayBuffer: ArrayBuffer): Promise<string> {
  try {
    console.log('📄 Extracting text from PDF...');
    const fullText = await UniversalPdfExtractor.extractAllText(arrayBuffer);
    
    console.log('📊 Original text stats:', {
      characters: fullText.length,
      estimatedTokens: UniversalPdfExtractor.estimateTokens(fullText),
      pages: (fullText.match(/--- PAGE \d+ ---/g) || []).length
    });
    
    // Truncate if needed to stay under token limits
    const processableText = UniversalPdfExtractor.truncateIfNeeded(fullText);
    
    console.log('📊 Processable text stats:', {
      characters: processableText.length,
      estimatedTokens: UniversalPdfExtractor.estimateTokens(processableText),
      wasTruncated: processableText !== fullText
    });
    
    // Add metadata
    const metadata = `PDF Information:
- Characters: ${processableText.length}
- Estimated tokens: ${UniversalPdfExtractor.estimateTokens(processableText)}
- Pages: ${(fullText.match(/--- PAGE \d+ ---/g) || []).length}
${processableText !== fullText ? '- Note: Content was truncated due to length\n' : ''}
Extracted text content:
${processableText}`;
    
    console.log('💰 Final token estimate:', UniversalPdfExtractor.estimateTokens(metadata));
    
    return metadata;
    
  } catch (error) {
    console.error('Universal PDF processing failed:', error);
    throw error;
  }
}