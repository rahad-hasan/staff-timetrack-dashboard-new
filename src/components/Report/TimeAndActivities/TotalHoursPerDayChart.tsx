import React from 'react';
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, CartesianGrid } from 'recharts';

const TotalHoursPerDayChart = () => {
    const data = [
        {
            name: 'Page A',
            uv: 4000,
            pv: 2400,
            amt: 2400,
        },
        {
            name: 'Page B',
            uv: 3000,
            pv: 1398,
            amt: 2210,
        },
        {
            name: 'Page C',
            uv: 2000,
            pv: 9800,
            amt: 2290,
        },
        {
            name: 'Page D',
            uv: 2780,
            pv: 3908,
            amt: 2000,
        },
        {
            name: 'Page E',
            uv: 1890,
            pv: 4800,
            amt: 2181,
        },
        {
            name: 'Page F',
            uv: 2390,
            pv: 3800,
            amt: 2500,
        },
        {
            name: 'Page G',
            uv: 3490,
            pv: 8300,
            amt: 2100,
        },
    ];
    return (
        <div className=' h-[400px] w-full border-2 border-borderColor px-4 pt-4 pb-12 rounded-xl mt-5'>
            <h2 className=' mb-4 text-textGray'>Total hours worked per day a week</h2>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart width={150} height={40} data={data} barSize={60}>
                    <CartesianGrid vertical={false} stroke="#d0d0d0" strokeDasharray="3 3" />
                    <XAxis tickLine={false} axisLine={false} dataKey="name" name="stature" />
                    <YAxis tickLine={false} axisLine={false} type="number" dataKey="pv" name="weight" />
                    <Bar width={10} dataKey="pv" fill="#5db0f1" />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default TotalHoursPerDayChart;