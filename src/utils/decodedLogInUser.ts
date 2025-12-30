import { cookies } from "next/headers";
import { jwtDecode } from "jwt-decode";

interface DecodedUser {
    id: number;
    email: string;
    role: string;
    iat: number;
    exp: number;
}

export const getDecodedUser = async (): Promise<DecodedUser | null> => {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("accessToken")?.value;

        if (!token) return null;

        const decoded = jwtDecode<DecodedUser>(token);
        return decoded;
    } catch (error) {
        console.error("Failed to decode token:", error);
        return null;
    }
};