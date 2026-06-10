export type ParsedResource = {
  position: number;
  input_text: string;
  url: string | null;
  normalized_url: string | null;
  title: string | null;
  source_type: "url" | "title_only";
  evidence_level: "title_only";
};

export function parseResources(resources: string[]): ParsedResource[] {
  return resources.map((resource, index) => {
    const inputText = resource.trim();
    const parsedUrl = parseHttpUrl(inputText);

    if (parsedUrl) {
      return {
        position: index + 1,
        input_text: inputText,
        url: inputText,
        normalized_url: normalizeUrl(parsedUrl),
        title: null,
        source_type: "url",
        evidence_level: "title_only"
      };
    }

    return {
      position: index + 1,
      input_text: inputText,
      url: null,
      normalized_url: null,
      title: inputText,
      source_type: "title_only",
      evidence_level: "title_only"
    };
  });
}

function parseHttpUrl(value: string) {
  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return null;
    }
    return url;
  } catch {
    return null;
  }
}

function normalizeUrl(url: URL) {
  return `${url.origin}${url.pathname}`;
}
