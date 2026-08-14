import { ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  eyebrow?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  align?: "left" | "center";
  className?: string;
}

/**
 * Typographic section header — no decorative iconography.
 * Uses a hairline rule + tracked uppercase eyebrow for a crafted, editorial feel.
 */
const SectionHeading = ({
  eyebrow,
  title,
  subtitle,
  align = "center",
  className,
}: SectionHeadingProps) => {
  const centered = align === "center";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={cn(centered ? "text-center" : "text-left", className)}
    >
      {eyebrow && (
        <div
          className={cn(
            "mb-5 flex items-center gap-3",
            centered && "justify-center"
          )}
        >
          <span className="h-px w-8 bg-primary/50" aria-hidden="true" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">
            {eyebrow}
          </span>
          {centered && (
            <span className="h-px w-8 bg-primary/50" aria-hidden="true" />
          )}
        </div>
      )}

      <h2 className="text-balance text-[1.75rem] font-semibold leading-[1.15] tracking-tight sm:text-4xl md:text-[2.75rem]">
        {title}
      </h2>

      {subtitle && (
        <p
          className={cn(
            "mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg",
            centered ? "mx-auto max-w-2xl" : "max-w-2xl"
          )}
        >
          {subtitle}
        </p>
      )}
    </motion.div>
  );
};

export default SectionHeading;
