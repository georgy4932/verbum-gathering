import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const client = new Anthropic();

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export async function POST(req: NextRequest) {
  // Auth check — companion chat is members-only
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const body = await req.json();
  const { threadId, passageRef, passageText, messages } = body as {
    threadId: string;
    passageRef: string;
    passageText: string;
    messages: ChatMessage[];
  };

  if (!threadId || !passageRef || !messages?.length) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  // Verify the thread belongs to this user (RLS would catch this in DB, but validate early)
  const { data: thread } = await supabase
    .from("companion_threads")
    .select("id")
    .eq("id", threadId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!thread) {
    return NextResponse.json({ error: "Thread not found." }, { status: 404 });
  }

  const lastUserMessage = messages[messages.length - 1];
  if (lastUserMessage.role !== "user") {
    return NextResponse.json({ error: "Last message must be from user." }, { status: 400 });
  }

  try {
    // Persist the user message
    await supabase.from("companion_messages").insert({
      thread_id: threadId,
      role: "user",
      content: lastUserMessage.content,
    });

    // Build conversation history (exclude the last user message since we include it separately)
    const history = messages.slice(0, -1).map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 400,
      system: `You are a quiet, reverent study companion for someone reading ${passageRef}.

Your purpose is to help them draw closer to the text — not to replace it, summarize it away, or turn it into a self-help message.

The passage they are reading:
"""
${passageText.slice(0, 3000)}
"""

Guidelines:
- Keep responses concise: 2–4 sentences unless the question genuinely needs more
- Always reference specific language from the passage when possible
- Use plain, careful language — not academic jargon, not devotional clichés
- If a question is theologically complex, be honest about that and point them back to the text
- If unsure, say so — and redirect them to read again more slowly
- Do not reduce Scripture to personal application alone; honor its full weight
- This is a quiet, contemplative space — respond accordingly`,
      messages: [
        ...history,
        { role: "user", content: lastUserMessage.content },
      ],
    });

    const assistantContent =
      response.content[0].type === "text" ? response.content[0].text : "";

    // Persist the assistant response
    await supabase.from("companion_messages").insert({
      thread_id: threadId,
      role: "assistant",
      content: assistantContent,
    });

    return NextResponse.json({ content: assistantContent });
  } catch (err) {
    console.error("companion-chat error:", err);
    return NextResponse.json(
      { error: "The companion is unavailable. Please try again." },
      { status: 500 }
    );
  }
}
