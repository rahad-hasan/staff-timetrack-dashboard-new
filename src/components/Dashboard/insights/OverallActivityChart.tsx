"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { IDashboardInsight } from "./Insights";

const COLORS = ["#5db0f1", "#f40139", "#ffcb49"];

const OverallActivityChart = ({ data }: { data: IDashboardInsight }) => {

    const value = [
        { name: "Productive", value: data?.data?.productive },
        { name: "Active", value: data?.data?.active },
        { name: "Idle", value: data?.data?.idle },
    ];

    return (
        <div className="w-full h-56">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={value}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={57}
                        outerRadius={85}
                        fill="#8884d8"
                        paddingAngle={5}
                        labelLine={false}
                        cornerRadius={5}
                    >
                        {value.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
};

export default OverallActivityChart;
