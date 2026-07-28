"use client"
import {
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { useState } from "react";
import EditGeneralInfoStep from "./EditProjectFormStep/EditGeneralInfoStep";
import EditMemberStep from "./EditProjectFormStep/EditMemberStep";
import EditBudgetAndHoursStep from "./EditProjectFormStep/EditBudgetAndHoursStep";
import { IProject } from "@/types/type";
// import AddTasksStep from "./AddProjectFomStep/AddTasksStep";

const EditProjectModal = ({ onClose, selectedProject }: { onClose: () => void; selectedProject: IProject }) => {

    const [step, setStep] = useState<number>(1);

    return (
        <DialogContent
            onInteractOutside={(event) => event.preventDefault()}
            className=" w-full sm:max-w-[525px] max-h-[95vh] overflow-y-auto">
            <DialogHeader>
                <DialogTitle>
                    <div className=" flex gap-3 items-center mt-5">
                        <span className=" h-1.5 rounded-full bg-primary w-full"></span>
                        <span className={` h-1.5 rounded-full ${step >= 2 ? "bg-primary" : "bg-[#dce3e3]"}  w-full `}></span>
                        <span className={` h-1.5 rounded-full ${step >= 3 ? "bg-primary" : "bg-[#dce3e3]"}  w-full `}></span>
                        {/* <span className={` h-1.5 rounded-full ${step >= 4 ? "bg-primary" : "bg-[#dce3e3]"}  w-full `}></span> */}
                    </div>
                </DialogTitle>
            </DialogHeader>
            {
                step === 1 &&
                <EditGeneralInfoStep setStep={setStep} selectedProject={selectedProject}></EditGeneralInfoStep>
            }
            {
                step === 2 &&
                <EditMemberStep setStep={setStep} selectedProject={selectedProject}></EditMemberStep>
            }
            {
                step === 3 &&
                <EditBudgetAndHoursStep setStep={setStep} onClose={onClose} selectedProject={selectedProject}></EditBudgetAndHoursStep>
            }
            {/* {
                step === 4 &&
                <AddTasksStep handleStepSubmit={handleStepSubmit}></AddTasksStep>
            } */}

        </DialogContent>
    );
};

export default EditProjectModal;