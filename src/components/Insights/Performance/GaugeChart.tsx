"use client";
import React from "react";

interface GaugeChartProps {
  percentage?: number; // 0–100
  value?: string;
  label?: string;
}

const GaugeChart: React.FC<GaugeChartProps> = ({
  percentage = 0,
  value,
  label,
}) => {
  // Calculate rotation for needle (-90° to +90°)
  const rotation = (percentage / 100) * 180 - 90;

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-[180px] h-[90px]">
        <svg
          viewBox="0 0 100 60"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          {/* Background arc */}
          <path
            d="M10,50 A40,40 0 0,1 90,50"
            fill="none"
            stroke="#dce3e3"
            strokeWidth="8"
            strokeLinecap="round"
          />
          {/* Foreground arc */}
          <path
            d="M10,50 A40,40 0 0,1 90,50"
            fill="none"
            stroke="#FACC15"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${(percentage / 100) * 125},125`}
          />
        </svg>

        {/* Needle */}
        <div
          className="absolute left-1/2 bottom-[6px] origin-bottom w-[2px] h-[50px] bg-headingTextColor dark:bg-darkTextPrimary"
          style={{
            transform: `translateX(-50%) rotate(${rotation}deg)`,
          }}
        >
          {/* pivot dot */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[8px] h-[8px] bg-headingTextColor dark:bg-darkTextPrimary rounded-full"></div>
        </div>
      </div>

      {/* Text Section */}
      <p className="text-xl font-medium text-subTextColor mt-1 dark:text-darkTextPrimary">{value}</p>
      <p className="text-base text-subTextColor dark:text-darkTextSecondary">{label}</p>
    </div>
  );
};

export default GaugeChart;
