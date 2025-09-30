import React from "react";

/**
 * Centers dashboard pages, applies consistent max-width, padding, and vertical spacing.
 * Keeps the content area independently scrollable under any sticky headers.
 */
export default function ContentContainer({ className = "", children }) {
  return (
    <div
      className={[
        // center and constrain
        "mx-auto w-full max-w-[1200px]",
        // horizontal padding per breakpoint
        "px-4 sm:px-6 lg:px-8",
        // vertical rhythm
        "py-6 sm:py-8",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}
