import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import { createCanvas } from '@napi-rs/canvas';
import { createWorker } from 'tesseract.js';
import mammoth from 'mammoth';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from '../../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const cMapPath = path.resolve(__dirname, '../../../node_modules/pdfjs-dist/cmaps') + '/';
const standardFontDataPath = path.resolve(__dirname, '../../../node_modules/pdfjs-dist/standard_fonts') + '/';

const cleanText = (text) => {
  return text
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{4,}/g, '\n\n\n')
    .trim();
};

const getTextDirect = async (pdf) => {
  let text = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    text += content.items.map((item) => item.str).join(' ') + '\n';
  }
  return cleanText(text);
};

export const parsePdf = async (buffer) => {
  const data = new Uint8Array(buffer);

  const loadingTask = pdfjsLib.getDocument({
    data,
    cMapUrl: cMapPath,
    cMapPacked: true,
    standardFontDataUrl: standardFontDataPath,
  });

  const pdf = await loadingTask.promise;

  try {
    const directText = await getTextDirect(pdf);
    if (directText.length >= 150) {
      return directText;
    }

    logger.info(`PDF text extraction returned only ${directText.length} chars. Falling back to OCR...`);
    const ocrText = await ocrPdf(pdf);
    return ocrText.length > directText.length ? ocrText : directText;
  } catch (err) {
    logger.error(`pdfjs-dist text extraction failed: ${err.message}`);
    logger.info('Falling back to OCR...');
    const ocrText = await ocrPdf(pdf);
    return ocrText;
  } finally {
    await pdf.cleanup();
  }
};

const ocrPdf = async (pdf) => {
  const worker = await createWorker('eng');
  try {
    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 2.0 });

      const canvas = createCanvas(viewport.width, viewport.height);
      const ctx = canvas.getContext('2d');

      await page.render({ canvasContext: ctx, viewport }).promise;

      const imageBuffer = canvas.toBuffer('image/png');
      const { data: { text } } = await worker.recognize(imageBuffer);
      fullText += text + '\n';
    }
    return cleanText(fullText);
  } finally {
    await worker.terminate();
  }
};

export const parseDocx = async (buffer) => {
  const result = await mammoth.extractRawText({ buffer });
  return cleanText(result.value);
};
