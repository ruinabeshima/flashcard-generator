import OpenAI from "openai";
import { logger } from "../monitoring/logger";
import { prisma } from "../prisma";
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export type ResumeSuggestions = {
  miss: string[];
  improve: string[];
  add: string[];
  weak: string[];
};

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
      logger.error("Could not retrieve resume text", { userId });
      return null;
    }

    return resume.text;
  } catch (error) {
    logger.error("Failed to get resume details", { userId, error });
    return null;
  }
}

export async function getResumeSuggestions(
  applicationInfo: string[],
  resumeText: string,
  userId: string,
): Promise<ResumeSuggestions | null> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      max_tokens: 1000,
      messages: [
        {
          role: "system",
          content: `You are a resume reviewer. Compare the resume against job requirements.
Return ONLY this JSON structure:
{"miss":[],"improve":[],"add":[],"weak":[]}
- miss: job requirements absent from resume
- improve: existing bullets needing metrics/stronger verbs  
- add: relevant experience worth mentioning
- weak: content misaligned with the role to cut or reframe
- Max 5 items per category, be specific (e.g. "Quantify impact in Project X")`,
        },
        {
          role: "user",
          content: `Resume:\n${resumeText.trim()}\n\nJob Requirements:\n${applicationInfo.slice(0, 20).join("\n")}`,
        },
      ],
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      logger.error("Empty response from OpenAI", { userId });
      return null;
    }

    try {
      const parsed = JSON.parse(content);

      if (
        !Array.isArray(parsed.miss) ||
        !Array.isArray(parsed.improve) ||
        !Array.isArray(parsed.add) ||
        !Array.isArray(parsed.weak)
      ) {
        logger.error("Unexpected JSON shape from API", {
          userId,
          parsed,
        });
        return null;
      }

      return {
        miss: parsed.miss,
        improve: parsed.improve,
        add: parsed.add,
        weak: parsed.weak,
      };
    } catch (parseError) {
      logger.error("Failed to parse OpenAI JSON response", {
        userId,
        content,
        parseError,
      });
      return null;
    }
  } catch (error) {
    logger.error("Could not get resume suggestions", { userId, error });
    return null;
  }
}

export default async function generateTailoredResume(
  resumeText: string,
  resumeSuggestions: ResumeSuggestions,
  userId: string,
): Promise<null | string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 2500,
      messages: [
        {
          role: "system",
          content:
            "You are an expert resume writer. Rewrite the resume incorporating the provided suggestions. Keep the original structure and tone.",
        },
        {
          role: "user",
          content: `Resume:\n${resumeText}\n\nImprovements to make:\n- Skills to add: ${resumeSuggestions.miss.join(", ")}\n- Bullets to strengthen: ${resumeSuggestions.improve.join(", ")}\n- Experience to highlight: ${resumeSuggestions.add.join(", ")}\n- Content to remove or reframe: ${resumeSuggestions.weak.join(", ")}`,
        },
      ],
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      logger.error("Empty response from OpenAI", { userId });
      return null;
    }

    return content;
  } catch (error) {
    logger.error("Could not generated tailored resume", { error, userId });
    return null;
  }
}
