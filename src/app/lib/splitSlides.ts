// src/lib/splitSlides.ts
export function extractSlidesFromHtml(html: string): string[] {
    const preMatch = html.match(/<pre[^>]*>([\s\S]*?)<\/pre>/i);
    if (!preMatch) return [];

    const raw = preMatch[1].trim();
    const lines = raw.split(/\r?\n/);

    const slides: string[] = [];
    let buffer: string[] = [];

    const isSlideBreak = (line: string) =>
        /^\[.*\]$/.test(line.trim()) || line.trim() === "";

    for (let line of lines) {
        if (isSlideBreak(line) && buffer.length > 0) {
            slides.push("<pre>" + buffer.join("\n") + "</pre>");
            buffer = [];
            if (/^\[.*\]$/.test(line.trim())) buffer.push(line); // keep heading
        } else {
            buffer.push(line);
        }
    }

    if (buffer.length > 0) slides.push("<pre>" + buffer.join("\n") + "</pre>");
    return slides;
}
