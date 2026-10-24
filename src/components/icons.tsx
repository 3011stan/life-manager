import type { SVGProps } from "react";

// 005 FR-014: one small set of stroke icons; text glyphs are never icons.
// Decorative by default; pass aria-label (and role="img") when an icon speaks.

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function icon(paths: React.ReactNode, strokeWidth = 1.8) {
  return function Icon({ size = 18, ...props }: IconProps) {
    const labelled = props["aria-label"] !== undefined;
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden={labelled ? undefined : true}
        role={labelled ? "img" : undefined}
        {...props}
      >
        {paths}
      </svg>
    );
  };
}

export const ChevronLeft = icon(<path d="M15 5l-7 7 7 7" />, 2);
export const ChevronRight = icon(<path d="M9 5l7 7-7 7" />, 2);
export const ChevronDown = icon(<path d="M6 9l6 6 6-6" />, 2);
export const Check = icon(<path d="M5 12.5l4.5 4.5L19 7.5" />, 3);
export const Dash = icon(<path d="M7 12h10" />, 3);
export const Close = icon(<path d="M6 6l12 12M18 6L6 18" />, 2.4);
export const Plus = icon(<path d="M12 5v14M5 12h14" />, 2.2);
export const Grip = icon(
  <>
    <circle cx="9" cy="6" r="1" fill="currentColor" />
    <circle cx="15" cy="6" r="1" fill="currentColor" />
    <circle cx="9" cy="12" r="1" fill="currentColor" />
    <circle cx="15" cy="12" r="1" fill="currentColor" />
    <circle cx="9" cy="18" r="1" fill="currentColor" />
    <circle cx="15" cy="18" r="1" fill="currentColor" />
  </>,
);
export const Target = icon(
  <>
    <circle cx="12" cy="12" r="8" />
    <circle cx="12" cy="12" r="3.5" />
  </>,
);
export const LinkIcon = icon(
  <>
    <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" />
    <path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" />
  </>,
  2,
);
export const Trash = icon(<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />);
export const Bolt = icon(<path d="M13 3L5 14h6l-1 7 8-11h-6z" />, 2);
export const Sun = icon(
  <>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 3v2M12 19v2M3 12h2M19 12h2" />
  </>,
);
export const List = icon(<path d="M5 7h14M5 12h14M5 17h9" />);
export const Sliders = icon(
  <>
    <path d="M4 7h10M18 7h2M4 17h4M12 17h8" />
    <circle cx="16" cy="7" r="2" />
    <circle cx="10" cy="17" r="2" />
  </>,
);
export const User = icon(
  <>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20c1.5-4 4.5-6 8-6s6.5 2 8 6" />
  </>,
);
