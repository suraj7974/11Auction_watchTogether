// Parse a YouTube video ID from the common URL shapes, or accept a raw 11-char ID.
const ID_RE = /^[A-Za-z0-9_-]{11}$/;

export function parseYouTubeId(input: string): string | null {
  const value = input.trim();
  if (!value) return null;

  // Raw video id.
  if (ID_RE.test(value)) return value;

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }

  const host = url.hostname.replace(/^www\./, "");

  // youtu.be/<id>
  if (host === "youtu.be") {
    const id = url.pathname.slice(1).split("/")[0];
    return ID_RE.test(id) ? id : null;
  }

  if (host === "youtube.com" || host === "m.youtube.com" || host === "music.youtube.com") {
    // watch?v=<id>
    const v = url.searchParams.get("v");
    if (v && ID_RE.test(v)) return v;

    // /embed/<id>, /shorts/<id>, /live/<id>, /v/<id>
    const parts = url.pathname.split("/").filter(Boolean);
    if (parts.length >= 2 && ["embed", "shorts", "live", "v"].includes(parts[0])) {
      return ID_RE.test(parts[1]) ? parts[1] : null;
    }
  }

  return null;
}

export function youTubeWatchUrl(id: string): string {
  return `https://www.youtube.com/watch?v=${id}`;
}

export function youTubeThumbnail(id: string): string {
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
}
