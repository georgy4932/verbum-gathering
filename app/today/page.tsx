import { todayDevotion } from "@/lib/verbum-data";

export default function TodayPage() {
  return (
    <main style={{ padding: "4rem 1.25rem" }}>
      <div style={{ maxWidth: 820, margin: "0 auto" }}>

        <p style={{ opacity: 0.6, marginBottom: 12, letterSpacing: "0.1em", textTransform: "uppercase", fontSize: 12 }}>
          Daily devotion
        </p>

        <h1 style={{ fontSize: "clamp(2.2rem, 5vw, 4rem)", marginBottom: 36, lineHeight: 1.05 }}>
          {todayDevotion.title}
        </h1>

        <div style={{ border: "1px solid rgba(255,255,255,0.08)", borderRadius: 28, overflow: "hidden", background: "rgba(255,255,255,0.02)" }}>

          <div style={{ padding: "28px 32px", borderBottom: "1px solid rgba(255,255,255,0.07)", background: "rgba(94,167,115,0.05)", borderLeft: "3px solid rgba(94,167,115,0.5)" }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "#5ea773", marginBottom: 14 }}>
              Scripture
            </p>
            <p style={{ fontSize: "1.25rem", lineHeight: 1.9, fontStyle: "italic", opacity: 0.92 }}>
              {todayDevotion.scripture}
            </p>
          </div>

          <div style={{ padding: "28px 32px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", opacity: 0.5, marginBottom: 14 }}>
              Reflection
            </p>
            <p style={{ opacity: 0.86, lineHeight: 1.85, fontSize: "1.05rem" }}>
              {todayDevotion.reflection}
            </p>
          </div>

          <div style={{ padding: "28px 32px" }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", opacity: 0.5, marginBottom: 14 }}>
              Prayer
            </p>
            <p style={{ opacity: 0.86, lineHeight: 1.85, fontSize: "1.05rem" }}>
              {todayDevotion.prayer}
            </p>
          </div>

        </div>
      </div>
    </main>
  );
}
