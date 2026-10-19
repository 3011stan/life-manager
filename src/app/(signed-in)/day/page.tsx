import { Suspense } from "react";
import { DayScreen } from "./DayScreen";

// Static shell; the date comes from ?date= and data loads in the browser, so
// one cached page serves every day offline.
export default function DayPage() {
  return (
    <Suspense>
      <DayScreen />
    </Suspense>
  );
}
