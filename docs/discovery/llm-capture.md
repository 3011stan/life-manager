# Discovery: LLM-Drafted Capture (deferred)

**Status**: Deferred by the owner on 2026-10-21 (004 D3). Capture stays
rule-based.

Need: the rule-based parser (003 research R8) leaves too much editing per
suggestion.

Options studied:

| Option | Cost | Drawback |
|---|---|---|
| Claude Haiku through the API, with a prepaid spend cap | cents per month at one user | needs an API key and billing |
| Gemini free tier | free | needs a (free) key; free-tier terms may allow the provider to use the content to improve its products; verify before choosing |
| In-browser model (WebLLM, Chrome built-in AI) | free, nothing leaves the device | hundreds of MB download; unstable on iPhone; Chrome's API is experimental and desktop-only |
| Better rules | free | still rudimentary |

If resumed: the model only drafts suggestions (constitution II); only the
capture text and activity names leave the system; the rule parser stays as the
fallback; an ADR records the provider and the data sent; a sample text from
the owner becomes the quality test.
