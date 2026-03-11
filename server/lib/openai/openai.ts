import OpenAI from "openai";
import { logger } from "../monitoring/logger";
import { prisma } from "../prisma";
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function getApplicationInfo(
  applicationId: string,
  userId: string,
): Promise<string[] | null> {
  try {
    const application = await prisma.application.findUnique({
      where: {
        id: applicationId,
      },
      select: {
        company: true,
        role: true,
        status: true,
        appliedDate: true,
        notes: true,
        jobUrl: true,
      },
    });

    if (!application) {
      logger.error("Application not found", { userId });
      return null;
    }

    const parts: string[] = [
      `Company: ${application.company}`,
      `Role: ${application.role}`,
      `Status: ${application.status}`,
      `Applied Date: ${application.appliedDate}`,
    ];

    if (application.notes) {
      parts.push(`Notes: ${application.notes}`);
    }

    if (application.jobUrl) {
      parts.push(`Job Link: ${application.jobUrl}`);
    }

    return parts;
  } catch (error) {
    logger.error("Failed to get application details", { userId, error });
    return null;
  }
}

export async function getResumeText(userId: string): Promise<string | null> {
  try {
    const resume = await prisma.resume.findUnique({
      where: {
        userId: userId,
      },
      select: {
        text: true,
      },
    });

    if (!resume) {
      logger.error("Could not retreive resume text", { userId });
      return null;
    }

    return resume.text;
  } catch (error) {
    logger.error("Failed to get resume details", { userId, error });
    return null;
  }
}

export async function getTailoring(
  application: string[],
  resumeText: string,
): Promise<null | JSON> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4.1-nano",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `
Resume reviewer.

Compare resume to job requirements.

Return JSON:
{
  "miss": [],
  "improve": [],
  "add": [],
  "weak": []
}

Rules:
- Max 5 items each
- Concise
- JSON only
`,
        },
        {
          role: "user",
          content: `resume:\n${resumeText}\n\nrequirements:\n${application.join("\n")}`,
        },
      ],
    });

    const jsonText = response.choices[0]?.message?.content;
    if (!jsonText) return null;

    return JSON.parse(jsonText);
  } catch (error) {
    logger.error("Failed to generate tailoring feedback", { error });
    return null;
  }
}
