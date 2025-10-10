import {
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const AddManualTimeModal = () => {
    return (
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Add time</DialogTitle>
                <DialogDescription className="flex flex-col gap-3">

                    <Label htmlFor="time-picker" className="px-1">
                        Time
                    </Label>
                    <Input
                        type="time"
                        id="time-picker"
                        step="1"
                        defaultValue="10:30:00"
                        className="bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                    />

                </DialogDescription>
            </DialogHeader>
        </DialogContent>
    );
};

export default AddManualTimeModal;
