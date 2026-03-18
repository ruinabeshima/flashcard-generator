import { ResumeSuggestions } from "../openai/openai";

export function parseAcceptedSuggestions(
  dbSuggestion: string[],
): ResumeSuggestions {
  const result: ResumeSuggestions = {
    miss: [],
    improve: [],
    add: [],
    weak: [],
  };

  for (const item of dbSuggestion) {
    const [category, ...rest] = item.split(":");
    const text = rest.join(":");
    if (category in result) {
      result[category as keyof ResumeSuggestions].push(text);
    }
  }

  return result;
}
