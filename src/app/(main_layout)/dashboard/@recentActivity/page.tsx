// import { EllipsisVertical } from "lucide-react";
import Image from "next/image";
import screenshort1 from "../../../../assets/dashboard/screenshort1.png";
import screenshort2 from "../../../../assets/dashboard/screenshort2.png";
import screenshort3 from "../../../../assets/dashboard/screenshort3.png";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import FilterButton from "@/components/Common/FilterButton";

const RecentActivity = async () => {
    await new Promise((resolve) => setTimeout(resolve, 3000));
    const screenshorts = [
        { id: 1, img: screenshort1, progress: "5%", color: "bg-red-600" },
        { id: 2, img: screenshort2, progress: "100%", color: "bg-blue-600" },
        { id: 3, img: screenshort3, progress: null, color: "" },
    ];

    return (
        <div className="w-full lg:w-[50%] border border-borderColor dark:border-darkBorder dark:bg-darkPrimaryBg p-4 2xl:p-5 rounded-[12px]">
            <div className=" flex justify-between items-center">
                <h2 className="text-base text-headingTextColor sm:text-lg dark:text-darkTextPrimary ">RECENT ACTIVITY</h2>
                <div className=" flex items-center gap-3">
                    <FilterButton />
                    <Button className="py-[14px] px-[16px] sm:py-[18px] sm:px-[20px] rounded-[8px]" size={'sm'}>View Activity</Button>
                </div>
            </div>

            <div className="mt-6 grid grid-cols-1 overflow-y-auto lg:h-[660px] thin-scrollbar pr-2">
                {Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="mb-5">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-1.5 sm:gap-3">
                                <Avatar className="w-8 sm:w-10 h-8 sm:h-10">
                                    <AvatarImage src="https://github.com/shadcn.png" />
                                    <AvatarFallback>CN</AvatarFallback>
                                </Avatar>
                                <h2 className="text-base text-headingTextColor dark:text-darkTextPrimary sm:text-lg font-medium">Danial Donald</h2>
                            </div>
                            <Link href={`/activity/screenshorts`}>
                                <Button className="text-sm py-[14px] px-[14px] sm:py-[16px] sm:px-[18px] rounded-[8px] font-medium dark:text-darkTextPrimary" variant={'outline2'} size={'sm'}>View All</Button>
                            </Link>
                        </div>
                        <div className="overflow-x-scroll sm:overflow-auto mt-2">
                            <div className="flex justify-between gap-2.5 min-w-[300px] sm:min-w-[500px]">
                                {screenshorts.map((p) => (
                                    <div key={p.id} className="relative aspect-video">
                                        <Image src={p.img} width={200} height={200} className="rounded-lg w-full object-cover" alt="screenshot" />
                                        {p.progress && (
                                            <span
                                                className={`absolute top-1 right-2 text-xs font-medium text-white px-2 py-0.5 rounded-full ${p.color}`}
                                            >
                                                {p.progress}
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default RecentActivity;
