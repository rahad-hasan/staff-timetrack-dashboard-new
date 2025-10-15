/* eslint-disable @typescript-eslint/no-explicit-any */
import { Button } from "@/components/ui/button";

interface GeneralInfoStepProps {
    setStep: (step: number) => void;
    handleStepSubmit: (data: any) => void;
}
const AddBudgetAndHoursStep = ({ setStep, handleStepSubmit }: GeneralInfoStepProps) => {
    return (
        <div>
            AddBudgetAndHoursStep
            <Button onClick={() => setStep(4)}>Next</Button>
        </div>
    );
};

export default AddBudgetAndHoursStep;