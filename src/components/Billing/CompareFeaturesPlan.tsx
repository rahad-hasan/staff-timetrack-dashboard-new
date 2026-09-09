import React from 'react';
import { Check, Minus } from 'lucide-react';

// Reusable component to render cell values cleanly
const RenderCell = ({ value }: { value: boolean | string | null }) => {
  if (value === true) {
    return <Check className="w-5 h-5 text-blue-500 mx-auto stroke-[2.5]" />;
  }
  if (value === false || value === null) {
    return <Minus className="w-4 h-4 text-gray-300 mx-auto" />;
  }
  return <span className="font-semibold text-gray-800 text-sm">{value}</span>;
};

const tableData = [
  { feature: 'Time Tracking', starter: true, pro: true, enterprise: true },
  { feature: 'Timesheets', starter: 'Up to 1 month history', pro: true, enterprise: true },
  { feature: 'Timesheet Approval', starter: true, pro: false, enterprise: false },
  { feature: 'Projects', starter: 'Up to 3 projects', pro: true, enterprise: true },
  { feature: 'Unlimited Tasks', starter: true, pro: true, enterprise: true },
  { feature: 'Screenshot Monitoring', starter: '1 Screenshot / hour', pro: '20 Screenshot / hour', enterprise: '60 Screenshot / hour' },
  { feature: 'App Usage Tracking', starter: 'Up to 5 apps / user / day', pro: true, enterprise: true },
  { feature: 'URLs Tracking', starter: 'Up to 5 URLs / user / day', pro: true, enterprise: true },
  { feature: 'Real-time Active View', starter: false, pro: true, enterprise: true },
  { feature: 'Attendance & Leaves', starter: false, pro: true, enterprise: true },
  { feature: 'Payroll & Members', starter: false, pro: true, enterprise: true },
  { feature: 'Team Manager & Admin', starter: true, pro: true, enterprise: true },
  { feature: 'Integrations', starter: false, pro: true, enterprise: true },
  { feature: 'Activity Analytics', starter: 'Up to 14 days history', pro: true, enterprise: true },
  { feature: 'Dashboard', starter: true, pro: true, enterprise: true },
  { feature: 'Ai Report Analysis (Coming Soon)', starter: false, pro: false, enterprise: true },
  { feature: 'Ai Chatbot (Coming Soon)', starter: false, pro: false, enterprise: true },
];

export default function CompareFeaturesPlan() {
  return (
    <div className=" mt-11">
      <div className="overflow-x-auto rounded-xl bg-white">
        <table className="w-full text-left border-collapse min-w-[700px]">
          {/* Table Header */}
          <thead>
            <tr className="text-sm font-semibold">
              <th className="p-4 w-1/4 bg-[#eef6ff] text-gray-700 rounded-tl-xl border-b border-gray-100">
                Feature
              </th>
              <th className="p-4 w-1/4 bg-[#eef6ff] text-center text-gray-900 font-bold border-b border-gray-100">
                Starter
              </th>
              <th className="p-4 w-1/4 bg-black text-center text-white border-b border-gray-100">
                Pro
              </th>
              <th className="p-4 w-1/4 bg-[#0070f3] text-center text-white rounded-tr-xl border-b border-gray-100">
                Enterprise
              </th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-gray-100 text-sm">
            {tableData.map((row, index) => (
              <tr key={index} className="hover:bg-gray-50/50 transition-colors">
                <td className="p-4 font-medium text-gray-600">
                  {row.feature}
                </td>
                <td className="p-4 text-center">
                  <RenderCell value={row.starter} />
                </td>
                <td className="p-4 text-center">
                  <RenderCell value={row.pro} />
                </td>
                <td className="p-4 text-center">
                  <RenderCell value={row.enterprise} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}