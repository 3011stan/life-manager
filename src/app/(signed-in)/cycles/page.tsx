import { Suspense } from "react";
import { CyclesScreen } from "./CyclesScreen";

// Static shell; ?h= and ?date= pick the cycle (contracts/ui.md "Cycles").
export default function CyclesPage() {
  return (
    <Suspense>
      <CyclesScreen />
    </Suspense>
  );
}
