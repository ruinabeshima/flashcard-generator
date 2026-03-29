import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export default async function convertTextToPDF(tailoredText: string) {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.TimesRoman);

  const fontSize = 12;
  const lineHeight = 17;
  const margin = 50;
  const color = rgb(0.1, 0.1, 0.1);

  const addPage = () => {
    const p = pdfDoc.addPage();
    const { width, height } = p.getSize();
    return { page: p, width, height, y: height - margin };
  };

  const splitLongWord = (word: string, maxWidth: number): string[] => {
    const parts: string[] = [];
    let current = "";

    for (const char of word) {
      const candidate = current + char;
      const candidateWidth = font.widthOfTextAtSize(candidate, fontSize);

      if (candidateWidth > maxWidth && current) {
        parts.push(current);
        current = char;
      } else {
        current = candidate;
      }
    }

    if (current) {
      parts.push(current);
    }

    return parts;
  };

  const wrapParagraph = (text: string, maxWidth: number): string[] => {
    const words = text.trim().split(/\s+/);
    const lines: string[] = [];
    let current = "";

    for (const word of words) {
      const wordWidth = font.widthOfTextAtSize(word, fontSize);
      if (wordWidth > maxWidth) {
        if (current) {
          lines.push(current);
          current = "";
        }

        const splitParts = splitLongWord(word, maxWidth);
        lines.push(...splitParts);
        continue;
      }

      const candidate = current ? `${current} ${word}` : word;
      const candidateWidth = font.widthOfTextAtSize(candidate, fontSize);

      if (candidateWidth > maxWidth && current) {
        lines.push(current);
        current = word;
      } else {
        current = candidate;
      }
    }

    if (current) {
      lines.push(current);
    }

    return lines;
  };

  let { page, width, y } = addPage();
  const maxWidth = width - margin * 2;
  const bottomMargin = margin;

  const paragraphs = tailoredText.split("\n");

  for (const paragraph of paragraphs) {
    const trimmed = paragraph.trim();
    if (!trimmed) {
      y -= lineHeight;
      continue;
    }

    const lines = wrapParagraph(trimmed, maxWidth);

    for (const line of lines) {
      if (y - lineHeight < bottomMargin) {
        ({ page, y } = addPage());
      }

      page.drawText(line, {
        x: margin,
        y,
        size: fontSize,
        font,
        color,
      });

      y -= lineHeight;
    }

    y -= lineHeight * 0.4;
  }

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}
