"use client"
import { Button } from "@/components/ui/button";
import Image from "next/image";
import logo from '../../../assets/logo.svg'
import roundedEmail from '../../../assets/auth/roundedEmail.svg'
import OtpInput from "react-otp-input";
import { useState } from "react";

const VerificationCode = () => {

    const [otp, setOtp] = useState<string>("");

    const onSent = () => {
        // handle OTP submission
        const data = {
            email: localStorage.getItem('email'),
            tokenCode: otp
        }
        console.log(data);
    };

    return (
        <div className=" w-full">
            <div className=" w-full flex items-center justify-center">

                <div
                    className={`flex items-center gap-1.5 px-8 py-5 `}
                >
                    <Image
                        src={logo}
                        alt="Logo"
                        width={0}
                        height={0}
                        className={`w-12 h-12`}
                    />
                    <h2 className="text-2xl font-bold">Tracker</h2>
                </div>
            </div>
            <div className=" h-[80vh] flex items-center justify-center">

                <div style={{ boxShadow: "0px 10px 180px rgba(18, 205, 105, 0.3)" }} className="space-y-4 bg-white py-8 px-6 md:px-10 rounded-lg border border-borderColor">
                    <div className=" flex flex-col items-center mb-5">
                        <Image src={roundedEmail} width={200} height={200} alt="icon" className=" w-16" />
                        <h2 className=" text-2xl font-semibold mt-4 mb-2">Enter your code</h2>
                        <p className="">Enter your 6 digit code in your email.</p>
                    </div>
                    <div className="flex justify-center">
                        <div className="flex gap-2 mb-4">
                            <OtpInput
                                value={otp}
                                onChange={(value: string) => setOtp(value)}
                                numInputs={6}
                                renderSeparator={<span className="w-4" />}
                                renderInput={(props) => (
                                    <input
                                        {...props}
                                        style={{ width: "50px" }}
                                        className="w-12 h-12 border-2 border-borderColor rounded-md text-center text-lg focus:border-primary focus:outline-none"
                                    />
                                )}
                            />
                        </div>
                    </div>
                    <Button onClick={onSent} className=" w-full" size={'sm'} type="button">Verify</Button>
                    <h3 className=" text-center">Didn’t received code? <span className=" text-primary cursor-pointer">Resent</span></h3>
                </div>

            </div>
        </div>
    );
};

export default VerificationCode;