import { prisma } from "../lib/prisma";
import { logger } from "./logger";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { r2 } from "./r2";

export default async function getResumeBuffer(
  userId: string,
): Promise<Buffer | null> {
  try {
    const resume = await prisma.resume.findUnique({
      where: {
        userId: userId,
      },
      select: {
        key: true,
      },
    });

    if (!resume) return null;

    const response = await r2.send(
      new GetObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME!,
        Key: resume.key,
      }),
    );

    const chunks: Uint8Array[] = [];
    for await (const chunk of response.Body as AsyncIterable<Uint8Array>) {
      chunks.push(chunk);
    }
    return Buffer.concat(chunks);
  } catch (error) {
    logger.error("Failed to get resume buffer from user", { userId, error });
    return null;
  }
}
