export type TypeResumeSuggestions = {
  miss: string[];
  improve: string[];
  add: string[];
  weak: string[];
};

export type ResumeSuggestionsProps = {
  sessionId: string;
  suggestions: TypeResumeSuggestions;
};

export function TrackResumeSuggestions(props: ResumeSuggestionsProps) {
  return (
    <div>
      <h1>Resume Suggestions</h1>
      <p>SessionId: {props.sessionId}</p>
      <p>Miss: {props.suggestions.miss}</p>
      <p>Improve: {props.suggestions.improve}</p>
      <p>Add: {props.suggestions.add}</p>
      <p>Weak: {props.suggestions.weak}</p>
    </div>
  );
}
