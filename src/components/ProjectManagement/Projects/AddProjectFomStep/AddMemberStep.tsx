/* eslint-disable @typescript-eslint/no-explicit-any */
import { Button } from "@/components/ui/button";

interface GeneralInfoStepProps {
    setStep: (step: number) => void;
    handleStepSubmit: (data: any) => void;
}
const AddMemberStep = ({ setStep, handleStepSubmit }: GeneralInfoStepProps) => {

    return (
        <div>
            AddMemberStep
            <Button onClick={() => setStep(3)}>Next</Button>
        </div>
    );
};

export default AddMemberStep;