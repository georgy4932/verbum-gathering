"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Props = { slug: string; isHost: boolean };

const tabs = [
  { label: "Home",       path: "" },
  { label: "Study",      path: "/study" },
  { label: "Discussion", path: "/discussion" },
  { label: "Prayer",     path: "/prayer" },
  { label: "Live",       path: "/live" },
];

export default function GatheringNav({ slug, isHost }: Props) {
  const pathname = usePathname();
  const base = `/gatherings/${slug}`;

  return (
    <nav style={{
      display: "flex",
      gap: 4,
      borderBottom: "1px solid var(--faint)",
      marginBottom: 32,
      paddingBottom: 0,
      overflowX: "auto",
    }}>
      {tabs.map(({ label, path }) => {
        const href = `${base}${path}`;
        const active =
          path === ""
            ? pathname === base
            : pathname.startsWith(href);
        return (
          <Link
            key={path}
            href={href}
            style={{
              fontSize: 13,
              padding: "10px 16px",
              borderBottom: active ? "2px solid var(--companion)" : "2px solid transparent",
              color: active ? "var(--cream)" : "var(--stone)",
              textDecoration: "none",
              whiteSpace: "nowrap",
              transition: "color 0.15s",
            }}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
