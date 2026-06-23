import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const cMapPath = path.resolve(__dirname, "../../../node_modules/pdfjs-dist/cmaps");
const standardFontDataPath = path.resolve(__dirname, "../../../node_modules/pdfjs-dist/standard_fonts");

let cMapUrl = pathToFileURL(cMapPath).href;
if (!cMapUrl.endsWith("/")) {
  cMapUrl += "/";
}

let standardFontDataUrl = pathToFileURL(standardFontDataPath).href;
if (!standardFontDataUrl.endsWith("/")) {
  standardFontDataUrl += "/";
}

const cleanText = (text) => {
  return text
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{4,}/g, "\n\n\n")
    .trim();
};

export const parsePdf = async (buffer) => {
  const parser = new PDFParse({
    data: buffer,
    cMapUrl,
    cMapPacked: true,
    standardFontDataUrl,
  });

  try {
    const result = await parser.getText();
    return cleanText(result.text);
  } finally {
    await parser.destroy();
  }
};

export const parseDocx = async (buffer) => {
  const result = await mammoth.extractRawText({ buffer });
  return cleanText(result.value);
};


