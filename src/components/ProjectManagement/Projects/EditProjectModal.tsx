"use client"
import {
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { useEffect, useState } from "react";
import EditGeneralInfoStep from "./EditProjectFormStep/EditGeneralInfoStep";
import EditMemberStep from "./EditProjectFormStep/EditMemberStep";
import EditBudgetAndHoursStep from "./EditProjectFormStep/EditBudgetAndHoursStep";
import { IProject } from "@/types/type";
import { useProjectFormStore } from "@/store/ProjectFormStore";
import { useDashboardMembers } from "@/hooks/useDashboardMembers";
// import AddTasksStep from "./AddProjectFomStep/AddTasksStep";

const EditProjectModal = ({ onClose, selectedProject }: { onClose: () => void; selectedProject: IProject }) => {

    const [step, setStep] = useState<number>(1);
    const resetData = useProjectFormStore(state => state.resetData);
    // the store must outlive step navigation but not the wizard itself — clean it
    // on unmount so route changes can't leak values into the next wizard
    useEffect(() => resetData, [resetData]);
    // Loaded once per wizard (it remounts per open) and shared by the member and
    // manager steps, which mount and unmount on every Back/Next.
    const { members } = useDashboardMembers();

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
                <EditGeneralInfoStep setStep={setStep} selectedProject={selectedProject} members={members}></EditGeneralInfoStep>
            }
            {
                step === 2 &&
                <EditMemberStep setStep={setStep} selectedProject={selectedProject} members={members}></EditMemberStep>
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