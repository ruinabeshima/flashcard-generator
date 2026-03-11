import { PDFParse } from "pdf-parse";

export default async function parsePDF(url: string) {
  const parser = new PDFParse({ url });
  const result = await parser.getText();
  return result;
}
