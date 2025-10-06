"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

const data = [
    { name: "Group A", value: 4567 },
    { name: "Group B", value: 700 },
    { name: "Group C", value: 1800 },

];

const COLORS = ["#5db0f1", "#f40139", "#ffcb49"];

const OverallActivityChart = () => {
    return (
        <div className="w-full h-60">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={data}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={60}
                        outerRadius={85}
                        fill="#8884d8"
                        paddingAngle={5}
                        labelLine={false}
                        cornerRadius={5}
                    >
                        {data.map((entry, index) => (
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
