"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { CyclesScreen } from "./CyclesScreen";
import { GoalsTree } from "./GoalsTree";

// Static shell. Without ?h= it shows the goals tree (005 D6); ?h= and ?date=
// pick one cycle, for its close and its proposals (contracts/ui.md "Cycles").
function Goals() {
  const params = useSearchParams();
  return params.get("h") ? <CyclesScreen /> : <GoalsTree />;
}

export default function CyclesPage() {
  return (
    <Suspense>
      <Goals />
    </Suspense>
  );
}
