import { Slider } from '@/components/ui/slider';
import { ITask } from '@/global/globalTypes';
import { Clock9, FileArchive, MessageSquareText } from 'lucide-react';
import Image from 'next/image';
import lowFlag from '../../../../assets/dashboard/lowFlag.svg'
import mediumFlag from '../../../../assets/dashboard/mediumFlag.svg'
import urgentFlag from '../../../../assets/dashboard/urgentFlag.svg'

const TaskCart = ({ task }: { task: ITask }) => {

    const selectedFlag = task?.priority === "Low" ? lowFlag : task?.priority === "Medium" ? mediumFlag : urgentFlag
    const sliderClass = task?.checklist < 5 ? "bg-red-500 border-white" : task?.checklist < 8 ? " bg-yellow-400 border-white" : ""

    return (
        <div className=" border p-6 rounded-lg bg-white dark:bg-darkSecondaryBg cursor-grab" >
            <h2 className=' text-lg font-semibold text-headingTextColor dark:text-darkTextPrimary'>{task?.taskName}</h2>
            <div className=' mt-3 flex items-center justify-between'>
                <Image src={task?.image} alt='image' width={200} height={200} className=' w-9 rounded-full' />
                <div className=' border-2 border-borderColor dark:border-darkBorder rounded-lg flex items-center gap-4 justify-between px-2 py-2'>
                    <h2 className=' flex items-center gap-1 text-headingTextColor dark:text-darkTextPrimary'>
                        <MessageSquareText size={18} /> 12
                    </h2>
                    <h2 className=' flex items-center gap-1 text-headingTextColor dark:text-darkTextPrimary'>
                        <FileArchive size={18} /> 18
                    </h2>
                </div>
            </div>
            <div className=' mt-3 '>
                <div className=' flex justify-between items-center mb-2 text-headingTextColor dark:text-darkTextPrimary'>
                    <p>Checklist</p>
                    <p>{task?.checklist}/10</p>
                </div>
                <Slider disabled className={sliderClass} defaultValue={[33]} max={100} step={1} />
                <div className=' mt-3 flex items-center justify-between'>
                    <div className=' flex items-center gap-1 text-headingTextColor dark:text-darkTextPrimary'>
                        <Clock9 size={18} />
                        <p>06:17:09</p>
                    </div>
                    <div className=' flex items-center gap-1 text-headingTextColor dark:text-darkTextPrimary'>
                        <Image src={selectedFlag} alt='flag' width={200} height={200} className='w-6' />
                        <p>{task?.priority}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TaskCart;