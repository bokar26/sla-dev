import React from "react";

export function ThemedImage({ lightSrc, darkSrc, alt, className }: { lightSrc: string; darkSrc: string; alt: string; className?: string; }) {
  return (
    <>
      <img src={lightSrc} alt={alt} className={`dark:hidden ${className || ""}`} />
      <img src={darkSrc} alt={alt} className={`hidden dark:block ${className || ""}`} />
    </>
  );
}

/* Icons from lucide inherit currentColor by default.
   Use this wrapper if we ever need to force contrast. */
export function ThemedIcon({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <span className={`text-foreground ${className}`}>{children}</span>;
}
