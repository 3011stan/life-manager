import type { MouseEvent } from "react";

// 004 FR-004: a click on the backdrop closes a dialog without saving. The
// dialog has no padding of its own (globals.css), so a click that reaches the
// dialog element itself landed outside its content.
export function closeOnBackdrop(event: MouseEvent<HTMLDialogElement>): void {
  if (event.target === event.currentTarget) event.currentTarget.close();
}
