"use client";

import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";
import { updatePreferredVersion } from "@/app/actions/companion";
import { SUPPORTED_VERSIONS, VERSION_LABEL, type BibleVersion } from "@/lib/bible/api-bible";

interface Props {
  current: BibleVersion;
  isAuthenticated: boolean;
}

export default function TranslationSelector({ current, isAuthenticated }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [, startTransition] = useTransition();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const v = e.target.value as BibleVersion;

    // Navigate with ?v= so the server page re-fetches with the new version
    router.push(`${pathname}?v=${v}`);

    // Persist preference for authenticated users (fire-and-forget)
    if (isAuthenticated) {
      startTransition(async () => {
        await updatePreferredVersion(v);
      });
    }
  }

  return (
    <select
      value={current}
      onChange={handleChange}
      aria-label="Bible translation"
      style={{
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: "0.08em",
        color: "var(--stone)",
        background: "var(--bg1)",
        border: "1px solid var(--faint)",
        borderRadius: 7,
        padding: "5px 10px",
        cursor: "pointer",
        fontFamily: "inherit",
        appearance: "none",
        WebkitAppearance: "none",
        paddingRight: 22,
        backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' fill='none'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%237a7264' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "right 7px center",
      }}
    >
      {SUPPORTED_VERSIONS.map((v) => (
        <option key={v} value={v}>
          {v}
        </option>
      ))}
    </select>
  );
}
