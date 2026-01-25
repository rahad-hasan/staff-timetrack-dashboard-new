// app/client-layout.tsx
"use client";

import { useClearOnNewSession } from "@/hooks/useClearOnNewSession";

export default function ClearNavbarStorageOnWindowClose() {
    useClearOnNewSession("sidebar-storage");

    return null;
}
