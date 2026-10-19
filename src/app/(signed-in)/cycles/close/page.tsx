import { Suspense } from "react";
import { CycleCloseScreen } from "./CycleCloseScreen";

export default function CycleClosePage() {
  return (
    <Suspense>
      <CycleCloseScreen />
    </Suspense>
  );
}
