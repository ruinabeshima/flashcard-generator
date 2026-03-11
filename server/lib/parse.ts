import pdf from "pdf-parse";

export default async function parsePDF(buffer: Buffer): Promise<string> {
  const result = await pdf(buffer);
  return result.text;
}
