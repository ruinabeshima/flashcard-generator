import { ResumeSuggestions } from "../openai/openai";

/* 
Example structure: 
{
  "acceptedSuggestions": ["miss-0", "miss-1", "improve-0", "add-0"],
  "dismissedSuggestions": ["improve-1", "weak-0"]
}
*/

export function parseAcceptedSuggestions(
  acceptedIndices: string[],
  fullSuggestions: ResumeSuggestions,
): ResumeSuggestions {
  const result: ResumeSuggestions = {
    miss: [],
    improve: [],
    add: [],
    weak: [],
  };

  for (const item of acceptedIndices) {
    const [category, strIndex] = item.split("-");
    const intIndex = parseInt(strIndex);

    if (
      category in result &&
      !isNaN(intIndex) &&
      intIndex < fullSuggestions[category as keyof ResumeSuggestions].length
    ) {
      const suggestion =
        fullSuggestions[category as keyof ResumeSuggestions][intIndex];

      result[category as keyof ResumeSuggestions].push(suggestion);
    }
  }

  return result;
}
