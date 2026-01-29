import windows from '../../../assets/download/download-windows-remove.png'
import linux from '../../../assets/download/download-linux-remove-bg.png'
import apple from '../../../assets/download/download-apple-remove.png'
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Download as DownloadIcon } from 'lucide-react';

const DownloadPage = () => {
    const LINUX_DOWNLOAD_URL = "/apps/linux/StaffTimeTracker-Setup-4.0.0.exe";
    const MACOS_DOWNLOAD_URL = "/apps/macos/StaffTimeTracker-Setup-4.0.0.exe";
    const WINDOWS_DOWNLOAD_URL = "/apps/windows/StaffTimeTracker-Setup-4.0.0.exe";

    return (
        <div className='container mx-auto py-4 sm:py-8 lg:py-12'>
            <div className='mb-8'>
                <h1 className="text-center text-xl sm:text-2xl lg:text-3xl font-medium text-gray-900 dark:text-darkTextPrimary">
                    Download Staff Time Tracker
                </h1>
                <p className="text-center mt-2 text-sm sm:text-md text-gray-600 dark:text-darkTextSecondary">
                    Staff Time Tracker is available for Windows, macOS, and Linux
                </p>
                <p className="text-center mt-1 text-sm text-gray-500 dark:text-darkTextSecondary">
                    Current Version: 1.2.5
                </p>
            </div>

            <div className='flex flex-col sm:flex-row justify-center sm:items-end gap-12 lg:gap-20 xl:gap-32'>

                <div className='flex flex-col items-center gap-3'>
                    <Image
                        src={windows}
                        width={120}
                        height={120}
                        alt='Windows OS icon'
                    />
                    <div className='text-lg font-medium'>Windows</div>
                    <a href={LINUX_DOWNLOAD_URL} download="StaffTimeTracker-App.exe" target="_self" rel="noopener">
                        <Button size={'sm'} variant={'download'} className='text-sm'>
                            <DownloadIcon className='w-4 h-4 mr-1' /> Download
                        </Button>
                    </a>
                </div>

                <div className='flex flex-col items-center gap-3'>
                    <Image
                        src={linux}
                        width={140}
                        height={140}
                        alt='Linux OS icon'
                        className=' -mb-4'
                    />
                    <div className='text-lg font-medium'>Linux</div>
                    <a href={WINDOWS_DOWNLOAD_URL} download="StaffTimeTracker-App.exe" target="_self" rel="noopener">
                        <Button size={'sm'} variant={'download'} className='text-sm'>
                            <DownloadIcon className='w-4 h-4 mr-1' /> Download
                        </Button>
                    </a>
                </div>

                <div className='flex flex-col items-center gap-3'>
                    <Image
                        src={apple}
                        width={120}
                        height={120}
                        alt='macOS OS icon'
                        className="dark:invert"
                    />
                    <div className='text-lg font-medium'>macOS</div>
                    <a href={MACOS_DOWNLOAD_URL} download="StaffTimeTracker-App.exe" target="_self" rel="noopener">
                        <Button size={'sm'} variant={'download'} className='text-sm'>
                            <DownloadIcon className='w-4 h-4 mr-1' /> Download
                        </Button>
                    </a>
                </div>
            </div>
        </div>
    );
};

export default DownloadPage;