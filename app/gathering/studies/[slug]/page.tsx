import { supabase } from "@/lib/supabase";
import Link from "next/link";
import StudyRoomRealtime from "@/components/study-room-realtime";

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export const dynamic = "force-dynamic";

export default async function StudyPage({ params }: PageProps) {
  const { slug } = await params;

  const [{ data: study }, { data: messages }] = await Promise.all([
    supabase
      .from("studies")
      .select("*")
      .eq("slug", slug)
      .single(),
    supabase
      .from("study_messages")
      .select("id, author_name, message, created_at")
      .eq("study_slug", slug)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  if (!study) {
    return (
      <main style={{ padding: "4rem 1.25rem" }}>
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          <p style={{ opacity: 0.7 }}>Study not found.</p>
          <Link href="/gathering/studies" style={{ color: "#c8a96a" }}>
            ← Back to studies
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main style={{ padding: "4rem 1.25rem 5rem" }}>
      <div style={{ maxWidth: 760, margin: "0 auto" }}>

        <Link href="/gathering/studies" style={{ opacity: 0.68, textDecoration: "none" }}>
          ← Back to studies
        </Link>

        <p style={{ opacity: 0.6, textTransform: "uppercase", fontSize: 12, letterSpacing: "0.1em", marginTop: 24 }}>
          Bible study
        </p>

        <h1 style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", margin: "12px 0", lineHeight: 1.05 }}>
          {study.title}
        </h1>

        <p style={{ opacity: 0.65, marginBottom: 24 }}>
          Led by {study.host_name}
        </p>

        <p style={{ opacity: 0.82, lineHeight: 1.85, marginBottom: 32 }}>
          {study.description}
        </p>

        <div style={{ marginBottom: 36, padding: "28px 24px", borderRadius: 24, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", textAlign: "center" }}>
          <p style={{ opacity: 0.5, marginBottom: 10, fontSize: "0.85rem", letterSpacing: "0.1em", textTransform: "uppercase" }}>
            Focus
          </p>
          <p style={{ fontSize: "1.1rem", lineHeight: 1.8, maxWidth: 520, margin: "0 auto" }}>
            "Let the word of Christ dwell in you richly."
          </p>
          <p style={{ opacity: 0.6, marginTop: 8 }}>Colossians 3:16</p>
        </div>

        <div style={{ marginTop: 40, paddingTop: 32, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <StudyRoomRealtime
            studySlug={slug}
            initialMessages={messages ?? []}
          />
        </div>

        <p style={{ textAlign: "center", opacity: 0.45, marginTop: 40, fontSize: "0.9rem" }}>
          Return regularly. Grow deeper in Scripture.
        </p>

      </div>
    </main>
  );
}
