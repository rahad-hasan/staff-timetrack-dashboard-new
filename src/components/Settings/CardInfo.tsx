import Image from "next/image";
import HeadingComponent from "../Common/HeadingComponent";
import cardImg from "@/assets/settings/card.png";
import EditIcon from "../Icons/FilterOptionIcon/EditIcon";
import InvoiceIcon from "@/components/Icons/PlanIcons/InvoiceIcon";
import { CreditCard, Lock, Zap } from "lucide-react";
import CheckFillIcon from "../Icons/PlanIcons/CheckFillIcon";

const CardInfo = () => {
  return (
    <div className="xl:w-[1000px]">
      <HeadingComponent
        heading="Payment Methods"
        subHeading="Add, remove, or manage your payment methods for subscriptions and invoices."
      />

      <div className="mt-6 space-y-6 lg:flex lg:items-stretch lg:gap-7 lg:space-y-0">
        <div className="w-full lg:w-[60%] shadow-[0_0_20px_8px_rgba(0,0,0,0.05)] rounded-xl border border-borderColor dark:border-darkBorder p-4 md:p-7 flex flex-col">
          <Image
            src={cardImg}
            className="w-full"
            alt=""
            width={400}
            height={400}
          />

          <div className="flex flex-col md:flex-row gap-5 md:gap-4 mt-5">
            <button className="w-full cursor-pointer flex justify-center items-center gap-3 bg-primary text-white rounded-lg py-3 md:text-lg font-semibold">
              <EditIcon size={20} />
              Change Card
            </button>

            <button className="w-full cursor-pointer flex justify-center items-center gap-3 bg-primary/5 outline outline-primary text-primary rounded-lg py-3 md:text-lg font-semibold">
              <InvoiceIcon size={20} />
              Change Card
            </button>
          </div>
        </div>

        <div className="w-full lg:w-[40%] shadow-[0_0_20px_8px_rgba(0,0,0,0.05)] rounded-xl border border-borderColor dark:border-darkBorder p-4 md:p-7 bg-white dark:bg-darkPrimaryBg flex flex-col">
          <h2 className="text-2xl font-semibold text-headingTextColor dark:text-darkTextPrimary mb-6">
            Why save a payment method?
          </h2>

          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="shrink-0 w-14 h-14 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center text-primary">
                <Zap size={24} />
              </div>

              <div className="min-w-0">
                <h3 className="text-lg font-semibold text-headingTextColor dark:text-darkTextPrimary">
                  Automatic payments
                </h3>

                <p className="text-base text-subTextColor dark:text-darkTextSecondary mt-1">
                  Keep your subscription active without interruption.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="shrink-0 w-14 h-14 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center text-primary">
                <Lock size={24} />
              </div>

              <div className="min-w-0">
                <h3 className="text-lg font-semibold text-headingTextColor dark:text-darkTextPrimary">
                  Secure & encrypted
                </h3>
                <p className="text-base text-subTextColor dark:text-darkTextSecondary mt-1">
                  Your payment details are safely protected.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="shrink-0 w-14 h-14 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center text-primary">
                <CreditCard size={24} />
              </div>

              <div className="min-w-0">
                <h3 className="text-lg font-semibold text-headingTextColor dark:text-darkTextPrimary">
                  Easy Management
                </h3>

                <p className="text-base text-subTextColor dark:text-darkTextSecondary mt-1">
                  Update or change your card anytime.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-7 w-full rounded-xl border border-[#1BA85533] bg-[#f4fbf7] px-4 py-3.5 md:px-5 md:py-5">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#d3efdf]">
            <CheckFillIcon size={30} />
          </div>

          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-headingTextColor dark:text-darkTextPrimary md:text-base">
              Your payments are secure
            </h3>

            <p className="mt-1 text-xs text-subTextColor dark:text-darkTextSecondary md:text-sm">
              We use industry-standard encryption to keep your payment
              information safe.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CardInfo;