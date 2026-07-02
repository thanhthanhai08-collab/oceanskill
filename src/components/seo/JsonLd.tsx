import type {JsonLdValue} from "@/lib/seo/schema";

export interface JsonLdProps { readonly data: JsonLdValue; }

export default function JsonLd({data}: JsonLdProps) {
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return <script type="application/ld+json" dangerouslySetInnerHTML={{__html: json}} />;
}
