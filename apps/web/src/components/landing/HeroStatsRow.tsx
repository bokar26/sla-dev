import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { useCountUp } from "@/hooks/useCountUp";

const container = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1, y: 0,
    transition: { duration: 0.5, ease: "easeOut", staggerChildren: 0.12 }
  }
};

const item = {
  hidden: { opacity: 0, y: 6 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } }
};

const STATS = [
  { value: 30, label: "Average Cost Savings on Products" },
  { value: 30, label: "Average Reduction in Shipping Costs" },
  { value: 29, label: "Faster Delivery Times with Route Optimization" },
];

export default function HeroStatsRow() {
  return (
    <section aria-label="Platform impact statistics" className="w-full border-b border-gray-200">
      <motion.div
        variants={container}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.35 }}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12"
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 items-start text-center">
          {STATS.map((s, idx) => (
            <StatItem key={s.label} value={s.value} label={s.label} delayMs={idx * 120} />
          ))}
        </div>
      </motion.div>
    </section>
  );
}

function StatItem({ value, label, delayMs = 0 }: { value: number; label: string; delayMs?: number }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const started = inView; // start as soon as item is in view

  // slight extra delay per-item to align with stagger
  const show = useCountUp({ from: 0, to: value, duration: 1200 + delayMs, start: started, decimals: 0 });

  return (
    <motion.div ref={ref} variants={item} className="flex flex-col items-center">
      <div
        className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-semibold leading-none tracking-tight text-emerald-600"
        aria-label={`${value}%`}
      >
        {Math.round(show)}%
      </div>
      <div className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-700/70 max-w-[30ch]">
        {label}
      </div>
    </motion.div>
  );
}
