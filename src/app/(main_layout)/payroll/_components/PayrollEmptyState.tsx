import Image from "next/image";
import EmptyTableLogo from "@/assets/empty_table.svg";

interface PayrollEmptyStateProps {
  text: string;
  size?: "sm" | "md";
}

const PayrollEmptyState = ({ text, size = "md" }: PayrollEmptyStateProps) => {
  const dimension = size === "sm" ? 88 : 120;
  return (
    <div className="flex flex-col items-center justify-center gap-2.5 py-10 text-center">
      <Image
        src={EmptyTableLogo}
        alt="empty state"
        width={dimension}
        height={dimension}
      />
      <p className="text-sm text-subTextColor sm:text-base dark:text-darkTextSecondary">
        {text}
      </p>
    </div>
  );
};

export default PayrollEmptyState;
