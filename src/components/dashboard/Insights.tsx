import { EllipsisVertical } from "lucide-react";
import { Button } from "../ui/button";

const Insights = () => {
    return (
        <div className=" border-2 border-borderColor p-3 rounded-[12px] w-full">
            <div className=" flex justify-between items-center">
                <h2 className=" text-lg">INSIGHTS</h2>
                <div className=" flex items-center gap-3">
                    <Button variant={'outline2'} size={'sm'}><EllipsisVertical /></Button>
                    <Button size={'sm'}>View Insights</Button>
                </div>
            </div>
        </div>
    );
};

export default Insights;