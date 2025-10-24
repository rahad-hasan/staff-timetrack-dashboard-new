import {
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet"
import Image from "next/image";
import logo from '../../assets/logo.svg'

const MobileSidebar = () => {
    return (
        <SheetContent>
            <SheetHeader>
                <SheetTitle>
                    <div
                        className={`flex items-center mb-4`}
                    >
                        <Image
                            src={logo}
                            alt="Logo"
                            width={0}
                            height={0}
                            className={`w-10 h-10`}
                        />
                        <h2 className="text-xl font-bold">Tracker</h2>
                    </div>
                </SheetTitle>
                <SheetDescription>
                    This action cannot be undone. This will permanently delete your account
                    and remove your data from our servers.
                </SheetDescription>
            </SheetHeader>
        </SheetContent>
    );
};

export default MobileSidebar;