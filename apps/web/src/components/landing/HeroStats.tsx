import { motion } from "framer-motion";

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
  { value: "30%", label: "Average Cost Savings on Products" },
  { value: "30%", label: "Average Reduction in Shipping Costs" },
  { value: "29%", label: "Faster Delivery Times with Route Optimization" },
];

export default function HeroStats() {
  return (
    <motion.div
      variants={container}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.35 }}
      // overlay on right; hidden on small screens to avoid crowding
      className="hidden md:flex absolute right-8 lg:right-14 top-24 lg:top-32 z-10 flex-col gap-8 items-end pointer-events-none"
      aria-label="Platform impact statistics"
    >
      {STATS.map((s) => (
        <motion.div key={s.label} variants={item} className="flex flex-col items-center text-center">
          <div className="text-5xl lg:text-6xl font-semibold leading-none tracking-tight text-emerald-600">
            {s.value}
          </div>
          <div className="mt-2 text-sm lg:text-base text-gray-700/70 max-w-[26ch]">
            {s.label}
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}
