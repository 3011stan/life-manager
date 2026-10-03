import type { FreeformSuggestion } from "@/types/life-manager";

type FreeformCaptureProps = {
  text: string;
  suggestions: FreeformSuggestion[];
  onTextChange: (text: string) => void;
  onStructure: () => void;
  onSuggestionChange: (suggestion: FreeformSuggestion) => void;
  onAccept: (suggestion: FreeformSuggestion) => void;
  onDismiss: (suggestionId: string) => void;
};

export function FreeformCapture({
  text,
  suggestions,
  onTextChange,
  onStructure,
  onSuggestionChange,
  onAccept,
  onDismiss,
}: FreeformCaptureProps) {
  return (
    <section className="freeform-panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Low-energy mode</p>
          <h2>Freeform capture</h2>
        </div>
        <button type="button" className="primary-button" onClick={onStructure}>
          Suggest structure
        </button>
      </div>

      <textarea
        value={text}
        onChange={(event) => onTextChange(event.target.value)}
        rows={5}
        placeholder={"fiz standup\ntrabalhei no projeto X umas 2h\nnao fiz leitura"}
      />

      {suggestions.length > 0 ? (
        <div className="suggestions">
          <h3>Suggested items</h3>
          {suggestions.map((suggestion) => (
            <div className="suggestion-card" key={suggestion.id}>
              <p>{suggestion.sourceText}</p>
              <input
                value={suggestion.title}
                onChange={(event) => onSuggestionChange({ ...suggestion, title: event.target.value })}
                aria-label="Suggestion title"
              />
              <div className="suggestion-card__grid">
                <input
                  type="time"
                  value={suggestion.plannedStart ?? ""}
                  onChange={(event) =>
                    onSuggestionChange({
                      ...suggestion,
                      plannedStart: event.target.value || undefined,
                    })
                  }
                  aria-label="Suggestion start time"
                />
                <input
                  type="number"
                  min="0"
                  value={suggestion.actualMinutes ?? ""}
                  placeholder="Actual min"
                  onChange={(event) =>
                    onSuggestionChange({
                      ...suggestion,
                      actualMinutes: event.target.value === "" ? undefined : Number(event.target.value),
                      plannedMinutes: event.target.value === "" ? suggestion.plannedMinutes : Number(event.target.value),
                    })
                  }
                  aria-label="Suggestion actual minutes"
                />
                <select
                  value={suggestion.status}
                  onChange={(event) =>
                    onSuggestionChange({
                      ...suggestion,
                      status: event.target.value as FreeformSuggestion["status"],
                    })
                  }
                  aria-label="Suggestion status"
                >
                  <option value="planned">planned</option>
                  <option value="completed">completed</option>
                  <option value="partial">partial</option>
                  <option value="skipped">skipped</option>
                  <option value="cancelled">cancelled</option>
                </select>
              </div>
              <div className="suggestion-card__actions">
                <button type="button" className="ghost-button" onClick={() => onDismiss(suggestion.id)}>
                  Dismiss
                </button>
                <button type="button" className="primary-button primary-button--subtle" onClick={() => onAccept(suggestion)}>
                  Accept
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}
