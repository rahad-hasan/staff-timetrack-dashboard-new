import { cookies } from "next/headers";
import { jwtDecode } from "jwt-decode";

interface DecodedUser {
    id?: number;
    email?: string;
    role?: string;
    iat?: number;
    exp?: number;
}

const normalizeRole = (value?: string) => value?.trim().toLowerCase();

export const getDecodedUser = async (): Promise<DecodedUser | null> => {
    const cookieStore = await cookies();
    const token = cookieStore.get("accessToken")?.value;

    const fallbackId = Number(cookieStore.get("userId")?.value);
    const fallbackEmail = cookieStore.get("userEmail")?.value;
    const fallbackRole = cookieStore.get("userRole")?.value;

    const fallbackUser =
        !Number.isNaN(fallbackId) || fallbackEmail || fallbackRole
            ? {
                id: Number.isNaN(fallbackId) ? undefined : fallbackId,
                email: fallbackEmail,
                role: normalizeRole(fallbackRole),
            }
            : null;

    if (!token) {
        return fallbackUser;
    }

    try {
        const decoded = jwtDecode<Record<string, unknown>>(token);
        const nestedUser =
            typeof decoded.user === "object" && decoded.user !== null
                ? (decoded.user as Record<string, unknown>)
                : null;
        const nestedData =
            typeof decoded.data === "object" && decoded.data !== null
                ? (decoded.data as Record<string, unknown>)
                : null;

        const possibleId =
            decoded.id ??
            decoded.user_id ??
            decoded.userId ??
            nestedUser?.id ??
            nestedUser?.user_id ??
            nestedData?.id ??
            nestedData?.user_id;

        const normalizedId =
            typeof possibleId === "number"
                ? possibleId
                : typeof possibleId === "string" && possibleId.trim()
                    ? Number(possibleId)
                    : fallbackUser?.id;

        const role = normalizeRole(
            (typeof decoded.role === "string" && decoded.role) ||
            (typeof decoded.user_role === "string" && decoded.user_role) ||
            (typeof decoded.userRole === "string" && decoded.userRole) ||
            (typeof nestedUser?.role === "string" && nestedUser.role) ||
            (typeof nestedData?.role === "string" && nestedData.role) ||
            fallbackUser?.role,
        );

        const email =
            (typeof decoded.email === "string" && decoded.email) ||
            (typeof nestedUser?.email === "string" && nestedUser.email) ||
            (typeof nestedData?.email === "string" && nestedData.email) ||
            fallbackUser?.email;

        return {
            id: Number.isNaN(normalizedId as number) ? fallbackUser?.id : normalizedId,
            email,
            role,
            iat: typeof decoded.iat === "number" ? decoded.iat : undefined,
            exp: typeof decoded.exp === "number" ? decoded.exp : undefined,
        };
    } catch (error) {
        console.error("Failed to decode token:", error);
        return fallbackUser;
    }
};
