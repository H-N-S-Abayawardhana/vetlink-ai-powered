/**
 * Normalize Hugging Face Space URLs for Gradio Client.connect().
 * Accepts https://user-space.hf.space or https://huggingface.co/spaces/user/name
 */
export function normalizeHuggingFaceSpaceUrl(url: string): string {
  const trimmed = url.trim();
  const match = trimmed.match(
    /^https?:\/\/huggingface\.co\/spaces\/([^/]+)\/([^/?#]+)/i,
  );
  if (match) {
    const user = match[1];
    const space = match[2];
    return `https://${user}-${space}.hf.space`;
  }
  return trimmed.replace(/\/$/, "");
}
