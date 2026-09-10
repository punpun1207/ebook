import JSZip from 'jszip';
import { Book, Chapter } from '../types';
import { parseContentToParagraphs } from './textProcessor';

export async function parseEpubFile(file: File | ArrayBuffer, fileName: string): Promise<Book> {
  const zip = new JSZip();
  const loadedZip = await zip.loadAsync(file);

  // 1. Read META-INF/container.xml to find the root OPF file path
  const containerFile = loadedZip.file('META-INF/container.xml');
  if (!containerFile) {
    throw new Error('Tệp EPUB không hợp lệ (thiếu META-INF/container.xml)');
  }

  const containerXml = await containerFile.async('text');
  const domParser = new DOMParser();
  const containerDoc = domParser.parseFromString(containerXml, 'application/xml');
  const rootfileElem = containerDoc.querySelector('rootfile');
  const opfPath = rootfileElem?.getAttribute('full-path');

  if (!opfPath) {
    throw new Error('Không tìm thấy đường dẫn OPF trong tệp EPUB');
  }

  // Determine base path for relative URLs in OPF
  const opfDir = opfPath.includes('/') ? opfPath.substring(0, opfPath.lastIndexOf('/') + 1) : '';

  const opfFile = loadedZip.file(opfPath);
  if (!opfFile) {
    throw new Error(`Không tìm thấy tệp OPF tại: ${opfPath}`);
  }

  const opfXml = await opfFile.async('text');
  const opfDoc = domParser.parseFromString(opfXml, 'application/xml');

  // 2. Extract Metadata
  const title = opfDoc.querySelector('title')?.textContent?.trim() || fileName.replace(/\.epub$/i, '');
  const author = opfDoc.querySelector('creator')?.textContent?.trim() || 'Tác giả chưa xác định';
  const language = opfDoc.querySelector('language')?.textContent?.trim() || 'vi';

  // 3. Extract Manifest (maps id to href)
  const manifestItems = new Map<string, { href: string; mediaType: string }>();
  opfDoc.querySelectorAll('manifest > item').forEach((item) => {
    const id = item.getAttribute('id');
    const href = item.getAttribute('href');
    const mediaType = item.getAttribute('media-type') || '';
    if (id && href) {
      manifestItems.set(id, { href, mediaType });
    }
  });

  // Extract cover image if available
  let coverUrl: string | undefined;
  const coverItem =
    manifestItems.get('cover') ||
    manifestItems.get('cover-image') ||
    Array.from(manifestItems.values()).find((i) => i.href.toLowerCase().includes('cover') && i.mediaType.startsWith('image/'));

  if (coverItem) {
    const fullCoverPath = opfDir + coverItem.href;
    const coverZipFile = loadedZip.file(fullCoverPath) || loadedZip.file(coverItem.href);
    if (coverZipFile) {
      const coverBlob = await coverZipFile.async('blob');
      coverUrl = URL.createObjectURL(coverBlob);
    }
  }

  // 4. Extract Spine (ordered chapter itemrefs)
  const spineItemrefs = Array.from(opfDoc.querySelectorAll('spine > itemref'));
  const chapters: Chapter[] = [];
  let chapterIndex = 0;

  for (const itemref of spineItemrefs) {
    const idref = itemref.getAttribute('idref');
    if (!idref) continue;

    const manifestItem = manifestItems.get(idref);
    if (!manifestItem) continue;

    // Only process HTML / XHTML content
    if (
      !manifestItem.mediaType.includes('html') &&
      !manifestItem.href.endsWith('.html') &&
      !manifestItem.href.endsWith('.xhtml') &&
      !manifestItem.href.endsWith('.htm')
    ) {
      continue;
    }

    // Resolve path relative to OPF dir
    let fullChapterPath = opfDir + manifestItem.href;
    // Handle path relative normalization like "OEBPS/../text/ch1.xhtml"
    let fileInZip = loadedZip.file(fullChapterPath);
    if (!fileInZip) {
      // Try direct href
      fileInZip = loadedZip.file(manifestItem.href);
    }
    if (!fileInZip) {
      // Search matching filename in zip
      const targetName = manifestItem.href.split('/').pop();
      const foundPath = Object.keys(loadedZip.files).find((k) => k.endsWith('/' + targetName) || k === targetName);
      if (foundPath) {
        fileInZip = loadedZip.file(foundPath);
      }
    }

    if (!fileInZip) continue;

    const htmlContent = await fileInZip.async('text');
    const doc = domParser.parseFromString(htmlContent, 'text/html');

    // Extract title
    let chapterTitle =
      doc.querySelector('h1')?.textContent?.trim() ||
      doc.querySelector('h2')?.textContent?.trim() ||
      doc.querySelector('title')?.textContent?.trim() ||
      `Chương ${chapterIndex + 1}`;

    // Clean title from extra spaces
    chapterTitle = chapterTitle.replace(/\s+/g, ' ');

    // Extract body text while preserving semantic block elements
    const body = doc.body;
    if (!body) continue;

    // Remove script, style, nav tags
    body.querySelectorAll('script, style, nav, svg').forEach((el) => el.remove());

    // Extract paragraphs or block elements
    const blockSelectors = 'p, h1, h2, h3, h4, h5, h6, li, blockquote, dt, dd';
    const blockElements = Array.from(body.querySelectorAll(blockSelectors));

    let rawText = '';
    if (blockElements.length > 0) {
      rawText = blockElements
        .map((el) => el.textContent?.trim() || '')
        .filter((t) => t.length > 0)
        .join('\n\n');
    } else {
      rawText = body.textContent || '';
    }

    if (!rawText.trim()) continue;

    const paragraphs = parseContentToParagraphs(rawText, chapterIndex);
    if (paragraphs.length === 0) continue;

    // If first paragraph was a heading matching chapter title, use it
    if (paragraphs[0].isHeading && paragraphs[0].rawText.length < 60) {
      chapterTitle = paragraphs[0].rawText;
    }

    const wordCount = paragraphs.reduce((sum, p) => sum + p.rawText.split(/\s+/).length, 0);

    chapters.push({
      id: `chap-${chapterIndex}`,
      index: chapterIndex,
      title: chapterTitle,
      paragraphs,
      wordCount,
    });

    chapterIndex++;
  }

  if (chapters.length === 0) {
    throw new Error('Không trích xuất được nội dung chương nào từ tệp EPUB này.');
  }

  const totalWords = chapters.reduce((acc, c) => acc + c.wordCount, 0);

  return {
    id: `book-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    title,
    author,
    format: 'epub',
    language,
    totalChapters: chapters.length,
    totalWords,
    chapters,
    coverUrl,
    dateAdded: Date.now(),
    lastReadChapter: 0,
    lastReadParagraph: 0,
    lastReadSentence: 0,
  };
}
