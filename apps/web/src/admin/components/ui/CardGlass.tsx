import React from "react";
import { motion } from "framer-motion";

interface CardGlassProps {
  title?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

export default function CardGlass({ title, action, children, className = "", delay = 0 }: CardGlassProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className={`rounded-xl border border-border bg-card text-card-foreground backdrop-blur-xl shadow-[0_8px_32px_-8px_rgba(0,0,0,0.1)] dark:shadow-[0_8px_32px_-8px_rgba(0,0,0,0.3)] hover:shadow-[0_12px_40px_-8px_rgba(0,0,0,0.15)] dark:hover:shadow-[0_12px_40px_-8px_rgba(0,0,0,0.4)] transition-all duration-300 ${className}`}
    >
      {(title || action) && (
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          {action}
        </div>
      )}
      <div className="p-6">{children}</div>
    </motion.div>
  );
}