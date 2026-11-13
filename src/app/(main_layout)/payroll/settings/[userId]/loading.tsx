import PayrollSkeleton from "@/skeleton/payroll/PayrollSkeleton";

/**
 * The page reads the employee's profile history before it can paint, so
 * opening it streams the skeleton at once instead of holding the settings
 * table on screen.
 */
const PayrollProfileHistoryLoading = () => <PayrollSkeleton />;

export default PayrollProfileHistoryLoading;
