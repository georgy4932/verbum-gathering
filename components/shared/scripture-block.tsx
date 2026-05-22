// Canonical Scripture display component used across all four movements.
// The reference and text are always visually distinct and primary.

interface ScriptureBlockProps {
  reference: string;
  text: string;
  size?: "sm" | "md" | "lg";
}

export default function ScriptureBlock({ reference, text, size = "md" }: ScriptureBlockProps) {
  const fontSize = size === "sm" ? "0.95rem" : size === "lg" ? "1.25rem" : "1.05rem";

  return (
    <div className="scripture-block">
      <span className="ref">{reference}</span>
      <p className="text" style={{ fontSize }}>
        {text}
      </p>
    </div>
  );
}
