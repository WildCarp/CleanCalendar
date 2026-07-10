import { motion } from 'framer-motion';

export default function App() {
  return (
    <div className="flex h-full items-center justify-center bg-surface">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="text-center"
      >
        <h1 className="text-2xl font-semibold tracking-tight text-text-primary">
          CleanCalendar
        </h1>
        <p className="mt-2 text-sm text-text-secondary">
          P0 阶段 — 项目骨架已就绪
        </p>
      </motion.div>
    </div>
  );
}
