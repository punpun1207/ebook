import * as pdfjsLib from 'pdfjs-dist';
import { Book, Chapter } from '../types';
import { parseContentToParagraphs } from './textProcessor';

// Initialize PDF.js worker
try {
  if (typeof window !== 'undefined') {
    // Use jsdelivr matching the installed version, or fallback
    const version = pdfjsLib.version || '4.10.38';
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${version}/build/pdf.worker.min.mjs`;
  }
} catch (err) {
  console.warn('Could not set pdf workerSrc', err);
}

interface TextItemWithPos {
  str: string;
  x: number;
  y: number;
  height: number;
  width: number;
}

export async function parsePdfFile(
  file: File | ArrayBuffer,
  fileName: string,
  onProgress?: (progress: number, total: number) => void
): Promise<Book> {
  const arrayBuffer = file instanceof File ? await file.arrayBuffer() : file;
  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(arrayBuffer),
    useSystemFonts: true,
  });

  const pdfDoc = await loadingTask.promise;
  const totalPages = pdfDoc.numPages;

  let docTitle = fileName.replace(/\.pdf$/i, '');
  let docAuthor = 'Tác giả chưa xác định';

  try {
    const metadata = await pdfDoc.getMetadata();
    const info = metadata?.info as Record<string, unknown> | undefined;
    if (info) {
      if (typeof info.Title === 'string' && info.Title.trim()) {
        docTitle = info.Title.trim();
      }
      if (typeof info.Author === 'string' && info.Author.trim()) {
        docAuthor = info.Author.trim();
      }
    }
  } catch {
    // Fall back to filename
  }

  const rawPagesText: { pageNum: number; text: string }[] = [];

  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    if (onProgress) {
      onProgress(pageNum, totalPages);
    }
    const page = await pdfDoc.getPage(pageNum);
    const textContent = await page.getTextContent();

    // Reconstruct lines using item coordinates for natural sentence continuity
    const items: TextItemWithPos[] = [];
    for (const item of textContent.items) {
      if ('str' in item && typeof item.str === 'string' && item.str.trim()) {
        const tx = item.transform; // [scaleX, skewY, skewX, scaleY, transX, transY]
        items.push({
          str: item.str,
          x: tx[4],
          y: tx[5],
          height: item.height || Math.abs(tx[3]) || 12,
          width: item.width || 0,
        });
      }
    }

    if (items.length === 0) {
      continue;
    }

    // Sort by Y descending (top of page first), then X ascending (left to right)
    items.sort((a, b) => {
      const yDelta = Math.abs(a.y - b.y);
      if (yDelta < 4) {
        return a.x - b.x;
      }
      return b.y - a.y;
    });

    // Group items on roughly the same line (y difference < 4px)
    const lines: { y: number; height: number; text: string }[] = [];
    let currentLine: { y: number; height: number; text: string } | null = null;

    for (const item of items) {
      if (!currentLine || Math.abs(currentLine.y - item.y) >= 4) {
        if (currentLine) {
          lines.push(currentLine);
        }
        currentLine = { y: item.y, height: item.height, text: item.str };
      } else {
        // Same line: check if we need space
        const needsSpace = !currentLine.text.endsWith(' ') && !item.str.startsWith(' ');
        currentLine.text += (needsSpace ? ' ' : '') + item.str;
        currentLine.height = Math.max(currentLine.height, item.height);
      }
    }
    if (currentLine) {
      lines.push(currentLine);
    }

    // Reconstruct paragraphs based on vertical spacing between lines
    const pageParagraphs: string[] = [];
    let currentPara = '';
    let prevLine: { y: number; height: number; text: string } | null = null;

    for (const line of lines) {
      const lineText = line.text.trim();
      if (!lineText) continue;

      // Ignore pure standalone page numbers (e.g., "Page 3" or "3")
      if (/^(?:trang\s+|page\s+)?\d{1,4}$/i.test(lineText)) {
        continue;
      }

      if (!prevLine) {
        currentPara = lineText;
      } else {
        const lineDistance = Math.abs(prevLine.y - line.y);
        const isBigGap = lineDistance > prevLine.height * 1.7;
        const prevEndsTerminal = /[.?!…:;"']$/.test(prevLine.text.trim());
        const isHyphenated = /[-–]$/.test(prevLine.text.trim());

        if (isBigGap || (prevEndsTerminal && lineDistance > prevLine.height * 1.35)) {
          // Paragraph boundary
          if (currentPara.trim()) {
            pageParagraphs.push(currentPara.trim());
          }
          currentPara = lineText;
        } else {
          // Continuation of current sentence or paragraph
          if (isHyphenated) {
            // Remove trailing hyphen and merge
            currentPara = currentPara.replace(/[-–]$/, '') + lineText;
          } else {
            currentPara += ' ' + lineText;
          }
        }
      }
      prevLine = line;
    }

    if (currentPara.trim()) {
      pageParagraphs.push(currentPara.trim());
    }

    rawPagesText.push({
      pageNum,
      text: pageParagraphs.join('\n\n'),
    });
  }

  if (rawPagesText.length === 0) {
    throw new Error('Không trích xuất được nội dung văn bản từ tệp PDF này. (Có thể tệp chỉ chứa hình ảnh quét scan).');
  }

  // Group pages into readable chapters / sections
  // If page contains explicit "Chương" or "Chapter" or if total pages <= 30, keep each page or groups of 3-5 pages
  const chapters: Chapter[] = [];
  let chapterIndex = 0;

  // Let's create sensible chapters: each chapter covers 1-3 pages or breaks at Chapter markers
  let currentChapterTitle = `Trang 1`;
  let currentChapterText: string[] = [];
  let startPage = 1;

  for (let i = 0; i < rawPagesText.length; i++) {
    const { pageNum, text } = rawPagesText[i];
    const firstLine = text.split('\n')[0]?.trim() || '';
    const isChapterHeading =
      /^(chương|hồi|tiết|phần|bài|chapter|part)\s+[0-9IVXLCDM]+/i.test(firstLine) ||
      (firstLine.length < 60 && /^(chương|chapter)\s+/i.test(firstLine));

    if (isChapterHeading && currentChapterText.length > 0) {
      // Flush previous chapter
      const chapterContent = currentChapterText.join('\n\n');
      const paragraphs = parseContentToParagraphs(chapterContent, chapterIndex);
      if (paragraphs.length > 0) {
        const wordCount = paragraphs.reduce((s, p) => s + p.rawText.split(/\s+/).length, 0);
        chapters.push({
          id: `pdf-chap-${chapterIndex}`,
          index: chapterIndex,
          title: currentChapterTitle,
          paragraphs,
          wordCount,
        });
        chapterIndex++;
      }
      currentChapterTitle = firstLine;
      currentChapterText = [text];
      startPage = pageNum;
    } else {
      currentChapterText.push(text);
      // If we don't have explicit chapter markers, group every 3-5 pages or keep individual pages if short
      const maxPagesPerGroup = totalPages > 20 ? 3 : 1;
      if (pageNum - startPage + 1 >= maxPagesPerGroup || i === rawPagesText.length - 1) {
        const chapterContent = currentChapterText.join('\n\n');
        const paragraphs = parseContentToParagraphs(chapterContent, chapterIndex);
        if (paragraphs.length > 0) {
          const wordCount = paragraphs.reduce((s, p) => s + p.rawText.split(/\s+/).length, 0);
          const title =
            startPage === pageNum
              ? `Trang ${startPage}`
              : `Trang ${startPage} - ${pageNum}`;
          chapters.push({
            id: `pdf-chap-${chapterIndex}`,
            index: chapterIndex,
            title: currentChapterTitle.startsWith('Chương') || currentChapterTitle.startsWith('Chapter') ? currentChapterTitle : title,
            paragraphs,
            wordCount,
          });
          chapterIndex++;
        }
        currentChapterText = [];
        startPage = pageNum + 1;
        currentChapterTitle = `Trang ${startPage}`;
      }
    }
  }

  const totalWords = chapters.reduce((acc, c) => acc + c.wordCount, 0);

  return {
    id: `pdf-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    title: docTitle,
    author: docAuthor,
    format: 'pdf',
    language: 'vi',
    totalChapters: chapters.length,
    totalWords,
    chapters,
    dateAdded: Date.now(),
    lastReadChapter: 0,
    lastReadParagraph: 0,
    lastReadSentence: 0,
  };
}
