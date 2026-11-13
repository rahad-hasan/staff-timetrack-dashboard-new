import { cache } from "react";
import { cookies } from "next/headers";
import { jwtDecode } from "jwt-decode";
import { getSessionUser } from "@/lib/server/session";

interface DecodedUser {
    id?: number;
    email?: string;
    role?: string;
    iat?: number;
    exp?: number;
}

const normalizeRole = (value?: string | null) =>
    value?.trim().toLowerCase() || undefined;

/**
 * The token's claims, or null when the cookie holds something that is not a
 * JWT at all — Express writes a null token as "j:null". That can never
 * authenticate, so it means "no session"; it is not worth the stack trace
 * this used to log on every call (four per dashboard render).
 */
const decodeClaims = (token: string): Record<string, unknown> | null => {
    try {
        const claims = jwtDecode<Record<string, unknown>>(token);
        return typeof claims === "object" && claims !== null ? claims : null;
    } catch {
        return null;
    }
};

/**
 * Who the signed-in user is — every server-side role gate reads this.
 *
 * Identity comes from the LIVE session (`GET /auth/session`, one read per
 * request, shared with the layout through React `cache()`). It used to come
 * from the `userRole` cookie written at sign-in, so a promoted or demoted
 * user kept their old menus for up to 30 days. Only when the session cannot
 * be read (API unreachable) does it fall back to the token's claims and the
 * identity cookies written beside it — and those cookies only when they
 * belong to the token's own user, never a previous session's.
 */
export const getDecodedUser = cache(async (): Promise<DecodedUser | null> => {
    const cookieStore = await cookies();
    const token = cookieStore.get("accessToken")?.value;
    if (!token) return null;

    const decoded = decodeClaims(token);
    if (!decoded) return null;

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

    const parsedId =
        typeof possibleId === "number"
            ? possibleId
            : typeof possibleId === "string" && possibleId.trim()
                ? Number(possibleId)
                : undefined;
    const id = Number.isFinite(parsedId) ? parsedId : undefined;

    const iat = typeof decoded.iat === "number" ? decoded.iat : undefined;
    const exp = typeof decoded.exp === "number" ? decoded.exp : undefined;

    const session = await getSessionUser();
    if (session) {
        return {
            id: session.id,
            email: session.email,
            role: normalizeRole(session.role),
            iat,
            exp,
        };
    }

    // The identity cookies describe whoever signed in last on this browser.
    // Trust them only for the user this token was issued to.
    const cookieId = Number(cookieStore.get("userId")?.value);
    const cookiesMatchToken = id !== undefined && cookieId === id;

    const role = normalizeRole(
        (typeof decoded.role === "string" && decoded.role) ||
        (typeof decoded.user_role === "string" && decoded.user_role) ||
        (typeof decoded.userRole === "string" && decoded.userRole) ||
        (typeof nestedUser?.role === "string" && nestedUser.role) ||
        (typeof nestedData?.role === "string" && nestedData.role) ||
        (cookiesMatchToken ? cookieStore.get("userRole")?.value : undefined),
    );

    const email =
        (typeof decoded.email === "string" && decoded.email) ||
        (typeof nestedUser?.email === "string" && nestedUser.email) ||
        (typeof nestedData?.email === "string" && nestedData.email) ||
        (cookiesMatchToken ? cookieStore.get("userEmail")?.value : undefined);

    return { id, email, role, iat, exp };
});
