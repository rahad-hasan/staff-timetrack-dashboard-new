import { Metadata } from "next";

import HeadingComponent from "@/components/Common/HeadingComponent";
import PayrollAccessDenied from "@/components/Payroll/PayrollAccessDenied";
import PayrollGenerateForm from "@/components/Payroll/PayrollGenerateForm";
import PayrollSubNav from "@/components/Payroll/PayrollSubNav";
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
