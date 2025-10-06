import Image from 'next/image';
import logo from '../../assets/logo.svg'
import fit from '../../assets/fit.svg'
const SideBar = () => {
    return (
        <div className=" w-[320px]  h-screen py-5">
            <div className=' flex items-center justify-between bg-white px-4 py-2  mx-3 rounded-2xl border-2'>
                <div className=' flex items-center gap-1.5 '>
                    <Image src={logo.src} alt="Logo" width={0} height={0} className="w-12 h-12 " />
                    <h2 className=' text-2xl font-bold'>Tracker</h2>
                </div>
                <Image src={fit.src} alt="Logo" width={0} height={0} className="w-8 h-8 " />
            </div>
        </div>
    );
};

export default SideBar;