import { Info } from "lucide-react";

const Utilization = () => {
    return (
        <div className=" border-2 border-borderColor dark:border-darkBorder py-3 px-5 rounded-[12px] w-full">
            <div className=" flex gap-3 items-center">
                <h2 className="text-md sm:text-lg dark:text-darkTextPrimary">Utilization</h2>
                <Info size={18} className=" cursor-pointer" />
            </div>
        </div>
    );
};

export default Utilization;