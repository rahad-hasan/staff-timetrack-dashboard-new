import { Minus, Plus } from "lucide-react";
import Link from "next/link";
import clsx from "clsx";
import { SheetClose } from "@/components/ui/sheet";
import { motion, AnimatePresence } from "framer-motion";

const MobileSidebarItem = ({
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
      className={clsx('flex items-center justify-between w-full text-base text-gray-700 dark:text-darkTextPrimary dark:hover:text-primary hover:text-primary transition-all',
        isCollapsed ? "justify-center" : "", 'py-2 cursor-pointer', isOpen && 'text-primary dark:text-primary')}
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

  if (!collapsible && href) {
    return (
      <SheetClose asChild>
        <Link href={href} className="block mb-2">
          {content}
        </Link>
      </SheetClose>
    );
  }

  if (!collapsible && !href) {
    return (
      <SheetClose asChild>
        <div className="mb-2">{content}</div>
      </SheetClose>
    );
  }

  return (
    <div className="mb-2">
      {href ? <Link href={href}>{content}</Link> : content}
      <AnimatePresence initial={false}>
        {isOpen && children && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{
              duration: 0.25,
              ease: [0.4, 0, 0.2, 1],
            }}
            className="overflow-hidden"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MobileSidebarItem;
