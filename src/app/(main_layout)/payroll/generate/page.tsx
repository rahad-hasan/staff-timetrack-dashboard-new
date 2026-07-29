import { Metadata } from "next";

import HeadingComponent from "@/components/Common/HeadingComponent";
import PayrollAccessDenied from "@/app/(main_layout)/payroll/_components/PayrollAccessDenied";
import PayrollGenerateForm from "@/app/(main_layout)/payroll/generate/_components/PayrollGenerateForm";
import PayrollSubNav from "@/app/(main_layout)/payroll/_components/PayrollSubNav";
import { canManagePayroll } from "@/lib/payroll";
import { getDecodedUser } from "@/utils/decodedLogInUser";

export const metadata: Metadata = {
  title: "Generate Payroll",
  description: "Run monthly payroll calculation for the entire workspace.",
};

const GeneratePayrollPage = async () => {
  const currentUser = await getDecodedUser();
  const isAllowed = canManagePayroll(currentUser?.role);

  return (
    <div>
      <div className="mb-5">
        <HeadingComponent
          heading="Generate Payroll"
          subHeading="Trigger the payroll calculation for a specific month. Any existing draft or generated run for the same period can be replaced."
        />
        <PayrollSubNav canManage={isAllowed} />
      </div>

      {isAllowed ? <PayrollGenerateForm /> : <PayrollAccessDenied />}
    </div>
  );
};

export default GeneratePayrollPage;
