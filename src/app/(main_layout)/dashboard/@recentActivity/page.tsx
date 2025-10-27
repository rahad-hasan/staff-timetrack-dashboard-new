import { EllipsisVertical } from "lucide-react";
import Image from "next/image";
import screenshort1 from "../../../../assets/dashboard/screenshort1.png";
import screenshort2 from "../../../../assets/dashboard/screenshort2.png";
import screenshort3 from "../../../../assets/dashboard/screenshort3.png";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";


const RecentActivity = () => {
    const screenshorts = [
        { id: 1, img: screenshort1, progress: "5%", color: "bg-red-600" },
        { id: 2, img: screenshort2, progress: "100%", color: "bg-blue-600" },
        { id: 3, img: screenshort3, progress: null, color: "" },
    ];
    return (
        <div className=" border-2 border-borderColor dark:border-darkBorder p-3 rounded-[12px] w-full">
            <div className=" flex justify-between items-center">
                <h2 className="text-md sm:text-lg dark:text-darkTextPrimary ">RECENT ACTIVITY</h2>
                <div className=" flex items-center gap-3">
                    <Button className="text-sm md:text-base dark:text-darkTextPrimary" variant={'outline2'} size={'sm'}><EllipsisVertical /></Button>
                    <Link href={`/activity/screenshorts`}>
                        <Button className="text-sm md:text-base" size={'sm'}>View Activity</Button>
                    </Link>
                </div>
            </div>
            {/* screenshorts per person */}
            <div className=" mt-6">
                <div className=" flex justify-between items-center">
                    <div className=" flex items-center gap-1.5 sm:gap-3">
                        <Avatar className=" w-8 sm:w-10 h-8 sm:h-10">
                            <AvatarImage src="https://github.com/shadcn.png" />
                            <AvatarFallback>CN</AvatarFallback>
                        </Avatar>
                        <h2 className="text-md sm:text-lg font-semibold">Danial Donald</h2>
                    </div>
                    <Button className="text-sm md:text-base dark:text-darkTextPrimary" variant={'outline2'} size={'sm'}>View All</Button>
                </div>
                <div className=" overflow-x-scroll sm:overflow-auto">
                    <div className=" flex justify-between gap-2.5 mt-5 min-w-[500px]">
                        {screenshorts.map((p) => (
                            <div
                                key={p.id}
                                className="relative"
                            >
                                <Image src={p.img} width={200} height={200} className=" rounded-lg w-full" alt="screenshort" />
                                {p.progress && (
                                    <span
                                        className={`absolute top-1 right-2 text-xs font-semibold text-white px-2 py-0.5 rounded-full ${p.color}`}
                                    >
                                        {p.progress}
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            <div className=" mt-6">
                <div className=" flex justify-between items-center">
                    <div className=" flex items-center gap-1.5 sm:gap-3">
                        <Avatar className=" w-8 sm:w-10 h-8 sm:h-10">
                            <AvatarImage src="https://github.com/shadcn.png" />
                            <AvatarFallback>CN</AvatarFallback>
                        </Avatar>
                        <h2 className="text-md sm:text-lg font-semibold">Danial Donald</h2>
                    </div>
                    <Button className="text-sm md:text-base dark:text-darkTextPrimary" variant={'outline2'} size={'sm'}>View All</Button>
                </div>
                <div className=" overflow-x-scroll sm:overflow-auto">
                    <div className=" flex justify-between gap-2.5 mt-5 min-w-[500px]">
                        {screenshorts.map((p) => (
                            <div
                                key={p.id}
                                className="relative"
                            >
                                <Image src={p.img} width={200} height={200} className=" rounded-lg w-full" alt="screenshort" />
                                {p.progress && (
                                    <span
                                        className={`absolute top-1 right-2 text-xs font-semibold text-white px-2 py-0.5 rounded-full ${p.color}`}
                                    >
                                        {p.progress}
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            <div className=" mt-6">
                <div className=" flex justify-between items-center">
                    <div className=" flex items-center gap-1.5 sm:gap-3">
                        <Avatar className=" w-8 sm:w-10 h-8 sm:h-10">
                            <AvatarImage src="https://github.com/shadcn.png" />
                            <AvatarFallback>CN</AvatarFallback>
                        </Avatar>
                        <h2 className="text-md sm:text-lg font-semibold">Danial Donald</h2>
                    </div>
                    <Button className="text-sm md:text-base dark:text-darkTextPrimary" variant={'outline2'} size={'sm'}>View All</Button>
                </div>
                <div className=" overflow-x-scroll sm:overflow-auto">
                    <div className=" flex justify-between gap-2.5 mt-5 min-w-[500px]">
                        {screenshorts.map((p) => (
                            <div
                                key={p.id}
                                className="relative"
                            >
                                <Image src={p.img} width={200} height={200} className=" rounded-lg w-full" alt="screenshort" />
                                {p.progress && (
                                    <span
                                        className={`absolute top-1 right-2 text-xs font-semibold text-white px-2 py-0.5 rounded-full ${p.color}`}
                                    >
                                        {p.progress}
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RecentActivity;