import type { ResumeSuggestions } from "@apply-wise/shared";
import { SuggestionEmptyState, SuggestionError } from "./SuggestionFeedback";
import useResumeSuggestionFlow from "../../hooks/useResumeSuggestionFlow";
import SuggestionHeaderStats from "./SuggestionsHeaderStats";
import SuggestionSectionList from "./SuggestionSectionList";

export type ResumeSuggestionsProps = {
  sessionId: string;
  suggestions: ResumeSuggestions;
  onTailoringLoadingChange?: (loading: boolean) => void;
};

export function TrackResumeSuggestions(props: ResumeSuggestionsProps) {
  const {
    hidden,
    resumeName,
    setResumeName,
    loading,
    error,
    loadingLabel,
    total,
    remaining,
    acceptedCount,
    dismissedCount,
    handleAcceptSuggestion,
    handleRejectSuggestion,
  } = useResumeSuggestionFlow(props);

  return (
    <section className="w-full flex flex-col gap-6">
      <SuggestionHeaderStats
        total={total}
        remaining={remaining}
        acceptedCount={acceptedCount}
        dismissedCount={dismissedCount}
        loading={loading}
        loadingLabel={loadingLabel}
        resumeName={resumeName}
        onResumeNameChange={setResumeName}
      />

      {error ? (
        <SuggestionError />
      ) : total === 0 ? (
        <SuggestionEmptyState />
      ) : (
        <SuggestionSectionList
          suggestions={props.suggestions}
          hidden={hidden}
          loading={loading}
          onAccept={handleAcceptSuggestion}
          onDismiss={handleRejectSuggestion}
        />
      )}
    </section>
  );
}
