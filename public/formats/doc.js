import { createWarning, withWarnings } from "../core/warnings.js";
import { extractReadableTextFromBinary } from "../core/binary-text-extraction.js";
import { readText } from "./plain-text.js";

export function readDoc({ content, title = "document", fileName = "", format = "doc" }) {
  const extracted = extractReadableTextFromBinary(content, {
    fileName,
    mime: "application/msword",
    format,
  });
  const model = readText({ content: extracted.text, title, format });
  const warnings = [
    createWarning(
      "lossy",
      "DOC_TEXT_EXTRACTED",
      "Legacy DOC is converted through best-effort plain-text extraction; layout, tables, images, and revisions are approximated."
    ),
  ];

  return {
    ...model,
    metadata: withWarnings(
      {
        ...model.metadata,
        legacyBinary: {
          format,
          fileName,
          byteLength: extracted.byteLength,
          extraction: extracted.source,
          candidateCount: extracted.candidateCount,
        },
      },
      warnings
    ),
  };
}
