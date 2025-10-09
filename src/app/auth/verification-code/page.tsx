"use client"
import { Button } from "@/components/ui/button";
import Image from "next/image";
import logo from '../../../assets/logo.svg'
import roundedEmail from '../../../assets/auth/roundedEmail.svg'
import OtpInput from "react-otp-input";
import { useEffect, useState } from "react";
import Link from "next/link";

const VerificationCode = () => {
    const [width, setWidth] = useState("50px");

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 640) {
                setWidth("50px");
            } else {
                setWidth("40px");
            }
        };

        window.addEventListener("resize", handleResize);
        handleResize();
        return () => window.removeEventListener("resize", handleResize);
    }, []);

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
                        <p className="">Enter your 5 digit code in your email.</p>
                    </div>
                    <div className="flex justify-center">
                        <div className="flex gap-2 mb-4">
                            <OtpInput
                                value={otp}
                                onChange={(value: string) => setOtp(value)}
                                numInputs={5}
                                renderSeparator={<span className="w-2 md:w-4" />}
                                renderInput={(props) => (
                                    <input
                                        {...props}
                                        style={{ width: width }}
                                        className="responsive-otp-input w-12 h-10 md:h-12 border-2 border-borderColor rounded-md text-center text-lg focus:border-primary focus:outline-none"
                                    />
                                )}
                            />
                        </div>
                    </div>
                    <Link href={`/auth/create-new-password`}>
                        <Button onClick={onSent} className=" w-full" type="button">Verify</Button>
                    </Link>
                    <h3 className=" text-center mt-3">Didn’t received code? <span className=" text-primary cursor-pointer">Resent</span></h3>
                </div>

            </div>
        </div>
    );
};

export default VerificationCode;