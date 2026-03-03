import { z } from "zod";

const askSchema = z.object({
  question: z.string().min(3, "Question must be at least 3 characters"),
  context: z.string().optional()
});

export async function ask(req, res) {
  const parsed = askSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      ok: false,
      error: parsed.error.issues
    });
  }

  const { question } = parsed.data;

  // Demo response (replace later with real AI + campus retrieval)
  return res.json({
    ok: true,
    answer:
      `🤖 (demo) I understood: "${question}". ` +
      "Next, we’ll connect this endpoint to an LLM + college knowledge base (RAG)."
  });
}