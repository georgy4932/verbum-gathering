"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Props = { slug: string; isHost: boolean; isMember: boolean };

export default function GatheringNav({ slug, isHost, isMember }: Props) {
  const pathname = usePathname();
  const base = `/gatherings/${slug}`;

  const tabs = [
    { label: "Home",       path: "",           show: true },
    { label: "Study",      path: "/study",      show: true },
    { label: "Discussion", path: "/discussion", show: true },
    { label: "Prayer",     path: "/prayer",     show: true },
    { label: "Live",       path: "/live",       show: true },
    { label: "Members",    path: "/members",    show: isMember },
    { label: "Settings",   path: "/settings",   show: isHost },
  ];

  return (
    <nav style={{
      display: "flex",
      gap: 4,
      borderBottom: "1px solid var(--faint)",
      marginBottom: 32,
      paddingBottom: 0,
      overflowX: "auto",
    }}>
      {tabs.filter((t) => t.show).map(({ label, path }) => {
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
