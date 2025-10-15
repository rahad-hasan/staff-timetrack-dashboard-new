/* eslint-disable @typescript-eslint/no-explicit-any */
import { Button } from "@/components/ui/button";


interface GeneralInfoStepProps {
    setStep: (step: number) => void;
    handleStepSubmit: (data: any) => void;
}
const AddTasksStep = ({ setStep, handleStepSubmit }: GeneralInfoStepProps) => {
    return (
        <div>
            AddTasksStep
            <Button onClick={() => setStep(1)}>Next</Button>
        </div>
    );
};

export default AddTasksStep;