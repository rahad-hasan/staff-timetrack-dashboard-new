/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"
import {
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { useState } from "react";
import GeneralInfoStep from "./AddProjectFomStep/GeneralInfoStep";
import AddMemberStep from "./AddProjectFomStep/AddMemberStep";
import AddBudgetAndHoursStep from "./AddProjectFomStep/AddBudgetAndHoursStep";
// import AddTasksStep from "./AddProjectFomStep/AddTasksStep";

const AddProjectModal = () => {
    const [step, setStep] = useState<number>(1);
    const [formData, setFormData] = useState<any>({});
    const handleStepSubmit = (data: any) => {
        setFormData((prevData: any) => ({ ...prevData, ...data }));
    };
    console.log(formData);
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
                <GeneralInfoStep setStep={setStep} handleStepSubmit={handleStepSubmit}></GeneralInfoStep>
            }
            {
                step === 2 &&
                <AddMemberStep setStep={setStep} handleStepSubmit={handleStepSubmit}></AddMemberStep>
            }
            {
                step === 3 &&
                <AddBudgetAndHoursStep setStep={setStep} handleStepSubmit={handleStepSubmit}></AddBudgetAndHoursStep>
            }
            {/* {
                step === 4 &&
                <AddTasksStep handleStepSubmit={handleStepSubmit}></AddTasksStep>
            } */}

        </DialogContent>
    );
};

export default AddProjectModal;