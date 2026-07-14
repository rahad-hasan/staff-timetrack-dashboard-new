import { Handshake } from "lucide-react";

const SupportColoredIcon = ({ size }: { size: number }) => {
  return (
    <div
      className="flex items-center justify-center rounded-lg"
      style={{
        width: size,
        height: size,
        backgroundColor: "#14B8A6",
      }}
    >
      <Handshake
        color="white"
        strokeWidth={1.75}
        style={{ width: size * 0.62, height: size * 0.62 }}
      />
    </div>
  );
};

export default SupportColoredIcon;
