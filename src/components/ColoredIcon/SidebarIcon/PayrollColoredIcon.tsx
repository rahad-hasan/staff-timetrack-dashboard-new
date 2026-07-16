import { Wallet } from "lucide-react";

const PayrollColoredIcon = ({ size }: { size: number }) => {
  return (
    <div
      className="flex items-center justify-center rounded-lg"
      style={{
        width: size,
        height: size,
        backgroundColor: "#F59E0B",
      }}
    >
      <Wallet
        color="white"
        strokeWidth={1.75}
        style={{ width: size * 0.62, height: size * 0.62 }}
      />
    </div>
  );
};

export default PayrollColoredIcon;
