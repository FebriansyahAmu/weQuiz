import { Fragment } from "react";

/** Negation words that flip a question's meaning and are easy to misread. */
const NEGATION = /\b(kecuali|tidak|dilarang|bukan)\b/gi;

export function HighlightedText({ text }: { text: string }) {
  const parts = text.split(NEGATION);
  return (
    <>
      {parts.map((part, index) =>
        // split() with a capture group puts the matches at odd indexes.
        index % 2 === 1 ? (
          <strong key={index} className="text-accent decoration-accent/50 font-semibold underline underline-offset-4">
            {part}
          </strong>
        ) : (
          <Fragment key={index}>{part}</Fragment>
        ),
      )}
    </>
  );
}
