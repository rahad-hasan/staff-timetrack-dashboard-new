/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"
import { Button } from "@/components/ui/button";
import Image from "next/image";
import logo from '../../../assets/logo.svg'
import roundedEmail from '../../../assets/auth/roundedEmail.svg'
import OtpInput from "react-otp-input";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import { resetOtp, verifyOtp } from "@/actions/auth/action";

const VerificationCode = () => {
    const [loading, setLoading] = useState(false);
    const [loadingResent, setLoadingResent] = useState(false);
    const router = useRouter();
    const [width, setWidth] = useState("50px");
    const searchParams = useSearchParams();
    const email = searchParams.get('email');

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

    async function handleVerifyOtp() {
        setLoading(true);
        try {
            const res = await verifyOtp({
                data: {
                    email: email!,
                    code: otp
                }
            });
            if (res?.success) {
                toast.success(res?.message || "OTP sent to your email");
                router.push(`/auth/${res?.data?.redirect}?reset_token=${res?.data?.reset_token}`);
            } else {
                toast.error(res?.message || "Invalid credentials");
            }
        } catch (error: any) {
            toast.error(error.message || "Server is not active");
        } finally {
            setLoading(false);
        }
    }

    async function onResentOtp() {
        setLoadingResent(true);
        try {
            const res = await resetOtp({
                data: {
                    email: email!,
                }
            });
            if (res?.success) {
                toast.success(res?.message || "OTP Resent to your email");
            } else {
                toast.error(res?.message || "Invalid credentials");
            }
        } catch (error: any) {
            toast.error(error.message || "Server is not active");
        } finally {
            setLoadingResent(false);
        }
    }

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

                <div style={{ boxShadow: "0px 10px 180px rgba(18, 205, 105, 0.3)" }} className=" space-y-2 md:space-y-4 bg-white dark:bg-darkPrimaryBg py-8 px-6 md:px-10 rounded-lg border border-borderColor dark:border-darkBorder">
                    <div className=" flex flex-col items-center mb-5">
                        <Image src={roundedEmail} width={200} height={200} alt="icon" className=" w-16" />
                        <h2 className=" text-2xl font-medium mt-4 mb-2">Enter your code</h2>
                        <p className="">Enter your 5 digit code in your email.</p>
                    </div>
                    <div className="flex justify-center">
                        <div className="flex gap-2 mb-2 md:mb-4">
                            <OtpInput
                                value={otp}
                                onChange={(value: string) => setOtp(value)}
                                numInputs={6}
                                renderSeparator={<span className="w-2 md:w-4" />}
                                renderInput={(props) => (
                                    <input
                                        {...props}
                                        style={{ width: width }}
                                        className="responsive-otp-input w-12 h-10 md:h-12 border border-borderColor dark:border-darkBorder rounded-md text-center text-lg focus:border-primary focus:outline-none"
                                    />
                                )}
                            />
                        </div>
                    </div>
                    <Button onClick={handleVerifyOtp} disabled={loading} className=" w-full" type="button">{loading ? "Loading..." : "Verify"}</Button>
                    <h3 className=" text-center mt-3">Didn’t received code? <button onClick={onResentOtp} disabled={loadingResent} className=" text-primary cursor-pointer">{loadingResent ? "Loading..." : "Resent"}</button></h3>
                </div>

            </div>
        </div>
    );
};

export default VerificationCode;