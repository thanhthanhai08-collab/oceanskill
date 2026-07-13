const EXACT_ORDER_CODE = /^(?:NSK|SEVQR)[A-F0-9]{18}$/i;
const EMBEDDED_ORDER_CODE = /(?:^|[^A-Z0-9])((?:NSK|SEVQR)[A-F0-9]{18})(?=$|[^A-Z0-9])/gi;

type SepayOrderCodeSource = Readonly<{
  code?: string | null;
  content?: string;
  description?: string;
}>;

export function extractSepayOrderCode(payload: SepayOrderCodeSource) {
  const structuredCode = payload.code?.trim();
  if (structuredCode && EXACT_ORDER_CODE.test(structuredCode)) return structuredCode.toUpperCase();

  const matches = new Set<string>();
  for (const value of [payload.content, payload.description]) {
    if (!value) continue;
    for (const match of value.matchAll(EMBEDDED_ORDER_CODE)) matches.add(match[1].toUpperCase());
  }

  return matches.size === 1 ? [...matches][0] : null;
}
