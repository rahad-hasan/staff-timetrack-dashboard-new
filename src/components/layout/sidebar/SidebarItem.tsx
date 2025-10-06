import {
  Minus,
  Plus,
} from 'lucide-react';
import Link from 'next/link';
import clsx from 'clsx';

const SidebarItem =({
  icon: Icon,
  label,
  href,
  collapsible = false,
  isOpen = false,
  onClick,
  children,
}: {
  icon: React.ElementType;
  label: string;
  href?: string;
  collapsible?: boolean;
  isOpen?: boolean;
  onClick?: () => void;
  children?: React.ReactNode;
}) => {
  const baseClasses =
    'flex items-center justify-between w-full text-md text-gray-700 hover:text-primary';
  const content = (
    <div
      onClick={onClick}
      className={clsx(baseClasses, 'py-2 cursor-pointer', isOpen && 'text-primary')}
    >
      <div className="flex items-center gap-2">
        <Icon size={20} />
        <span>{label}</span>
      </div>
      {collapsible &&
        (isOpen ? <Minus size={18} /> : <Plus size={18} />)}
    </div>
  );

  return (
    <div className="mb-2">
      {href ? <Link href={href}>{content}</Link> : content}
      {isOpen && children && <div className="mt-1">{children}</div>}
    </div>
  );
}

export default SidebarItem;