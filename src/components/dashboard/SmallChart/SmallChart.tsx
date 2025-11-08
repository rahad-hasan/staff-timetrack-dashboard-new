"use client"
import { useColorStore } from "@/store/globalColorStore";
import {
    Bar,
    BarChart,
    ResponsiveContainer,
    XAxis,
    YAxis,
} from "recharts";

const SmallChart = () => {
    const trainerData = [
        { month: "Jan", trainer: 50 },
        { month: "Feb", trainer: 100 },
        { month: "Mar", trainer: 40 },
        { month: "Apr", trainer: 95 },
        { month: "May", trainer: 120 },
        { month: "Jun", trainer: 50 },
    ];
    const { color } = useColorStore();

    return (
        <ResponsiveContainer width={105} height={50}>
            <BarChart
                data={trainerData}
                margin={{
                    top: 10,
                    right: 30,
                    left: 20,
                    bottom: 5,
                }}
            >
                <XAxis tickLine={false} axisLine={false} dataKey="month" hide />
                <YAxis tickLine={false} axisLine={false} hide />
                <Bar
                    barSize={5}
                    // radius={[5, 5, 0, 0]}
                    dataKey="trainer"
                    fill={color}
                />
            </BarChart>
        </ResponsiveContainer>
    );
};

export default SmallChart;