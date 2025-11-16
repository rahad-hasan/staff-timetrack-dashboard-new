"use client";
import { Minus, Plus } from "lucide-react";
import Link from "next/link";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";

const containerVariants = {
  collapsed: {
    height: 0,
    opacity: 0,
    transition: {
      height: { duration: 0.2 },
      opacity: { duration: 0.15 },
    },
  },
  open: {
    height: "auto",
    opacity: 1,
    transition: {
      height: { duration: 0.25 },
      opacity: { duration: 0.2 },
      staggerChildren: 0.06,
      delayChildren: 0.03,
    },
  },
};

const SidebarItem = ({
  icon: Icon,
  label,
  href,
  collapsible = false,
  isCollapsed,
  isOpen = false,
  onClick,
  children,
}: {
  icon: React.ElementType;
  label: string;
  href?: string;
  collapsible?: boolean;
  isCollapsed?: boolean;
  isOpen?: boolean;
  onClick?: () => void;
  children?: React.ReactNode;
}) => {
  const content = (
    <div
      onClick={onClick}
      className={clsx(
        "flex items-center justify-between w-full text-base text-headingTextColor dark:text-darkTextPrimary dark:hover:text-primary hover:text-primary transition-all duration-200 ease-in-out",
        isCollapsed ? "justify-center" : "",
        "py-2 cursor-pointer",
        isOpen && "text-primary dark:text-primary"
      )}
    >
      <div className="flex items-center gap-2">
        <Icon size={20} />
        {!isCollapsed && <span>{label}</span>}
      </div>
      {!isCollapsed && collapsible && (
        <div>{isOpen ? <Minus size={18} /> : <Plus size={18} />}</div>
      )}
    </div>
  );

  return (
    <div className="mb-2">
      {href ? <Link href={href}>{content}</Link> : content}

      <AnimatePresence initial={false}>
        {isOpen && children && (
          <motion.div
            key="content"
            variants={containerVariants}
            initial="collapsed"
            animate="open"
            exit="collapsed"
            className="overflow-hidden"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SidebarItem;
