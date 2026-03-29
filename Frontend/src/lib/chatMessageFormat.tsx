import type { ReactNode } from "react";

/** ₹ amounts, Indian-style grouped numbers with %, simple decimals with %, and small fractions like 9/9 */
const TOKEN =
  /(₹[\d,.]+(?:\.\d+)?(?:\s*(?:L|Cr|k|lac|lakh))?|\d{1,3}(?:,\d{2,3})+(?:\.\d+)?%|\d+\.\d{1,4}%|\d+%|\d+\s*\/\s*\d+)/gi;

function splitNumericTokens(line: string): string[] {
  const out: string[] = [];
  let last = 0;
  const re = new RegExp(TOKEN.source, "gi");
  let m: RegExpExecArray | null;
  while ((m = re.exec(line)) !== null) {
    if (m.index > last) out.push(line.slice(last, m.index));
    out.push(m[0]);
    last = m.index + m[0].length;
  }
  if (last < line.length) out.push(line.slice(last));
  return out.length ? out : [line];
}

const FULL_NUMERIC =
  /^(₹[\d,.]+(?:\.\d+)?(?:\s*(?:L|Cr|k|lac|lakh))?|\d{1,3}(?:,\d{2,3})+(?:\.\d+)?%|\d+\.\d{1,4}%|\d+%|\d+\s*\/\s*\d+)$/i;

function isNumericToken(s: string): boolean {
  return FULL_NUMERIC.test(s);
}

/**
 * Renders chat text with ₹ / % / fraction spans in DM Mono + tabular-nums (P13B).
 */
export function renderChatMessageContent(text: string): ReactNode {
  const lines = text.split("\n");
  return (
    <>
      {lines.map((line, li) => (
        <span key={li}>
          {li > 0 ? <br /> : null}
          {splitNumericTokens(line).map((chunk, ci) => {
            const numeric = isNumericToken(chunk);
            return numeric ? (
              <span key={ci} className="font-mono-dm tabular-nums">
                {chunk}
              </span>
            ) : (
              <span key={ci}>{chunk}</span>
            );
          })}
        </span>
      ))}
    </>
  );
}
