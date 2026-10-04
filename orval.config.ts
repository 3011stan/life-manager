import { defineConfig } from "orval";

// ADR 0007: the client is generated from the pinned backend contract and never
// edited by hand. Every call goes through the custom mutator.
export default defineConfig({
  lifeManager: {
    input: { target: "./openapi/openapi.json" },
    output: {
      mode: "tags-split",
      target: "./src/lib/api/generated",
      client: "react-query",
      httpClient: "fetch",
      clean: true,
      override: {
        mutator: { path: "./src/lib/api/mutator.ts", name: "apiFetch" },
        query: { useQuery: true, useMutation: true },
      },
    },
  },
});
