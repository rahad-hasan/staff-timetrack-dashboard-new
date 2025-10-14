import { DialogClose, DialogContent, DialogTitle } from "@/components/ui/dialog";
import BlockLogo from '../../../assets/activity/blockAppUrl.svg'
import Image from "next/image";
const BlockAppModal = () => {
    return (
        <DialogContent className="sm:max-w-[425px]">
            <DialogTitle></DialogTitle>
            <div className=" flex items-center justify-center">
                <Image src={BlockLogo} className=" w-16" alt="block logo" width={300} height={300} />
            </div>
            <div className=" text-center">
                <h2 className="text-lg font-semibold">Block URL</h2>
                <p>Are you sure you want to block this url? your team member won’t access this url until you unblock</p>
            </div>
            <div className=" flex items-center gap-2 justify-center">
                <button
                    className={` w-[100px] py-1.5 flex items-center justify-center gap-2 font-medium transition-all cursor-pointer rounded-lg m-0.5 border border-borderColor`}>
                    No Cancel
                </button>
                <DialogClose asChild>
                    <button
                        className={` w-[100px] py-1.5 flex items-center justify-center gap-2 font-medium transition-all cursor-pointer rounded-lg m-0.5 bg-[#f40139] text-white`}>
                        Yes, Block
                    </button>
                </DialogClose>
            </div>
        </DialogContent>
    );
};

export default BlockAppModal;