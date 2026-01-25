import { useEffect } from "react";

export function useClearOnNewSession(key: string) {
    useEffect(() => {
        const sessionFlag = "__session_active__";

        if (!sessionStorage.getItem(sessionFlag)) {
            localStorage.removeItem(key);
            sessionStorage.setItem(sessionFlag, "true");
        }
    }, [key]);
}
