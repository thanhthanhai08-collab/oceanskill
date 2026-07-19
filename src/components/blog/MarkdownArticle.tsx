import {Fragment, type ReactNode} from "react";

function inline(text: string): ReactNode[] {
  const parts: ReactNode[] = [];
  const pattern = /\[([^\]]+)]\((https?:\/\/[^\s)]+)\)|\*\*([^*]+)\*\*|`([^`]+)`/g;
  let cursor = 0;
  for (const match of text.matchAll(pattern)) {
    const index = match.index ?? 0;
    if (index > cursor) parts.push(text.slice(cursor, index));
    if (match[1] && match[2]) parts.push(<a key={index} href={match[2]} target="_blank" rel="noreferrer">{match[1]}</a>);
    else if (match[3]) parts.push(<strong key={index}>{match[3]}</strong>);
    else parts.push(<code key={index}>{match[4]}</code>);
    cursor = index + match[0].length;
  }
  if (cursor < text.length) parts.push(text.slice(cursor));
  return parts;
}

function renderTable(lines: string[], key: number) {
  const cells = (line: string) => line.trim().replace(/^\||\|$/g, "").split("|").map((cell) => cell.trim());
  const headers = cells(lines[0]);
  const rows = lines.slice(2).map(cells);
  return <div className="blog-table-wrap" key={key}><table><thead><tr>{headers.map((cell, i) => <th key={i}>{inline(cell)}</th>)}</tr></thead><tbody>{rows.map((row, i) => <tr key={i}>{row.map((cell, j) => <td key={j}>{inline(cell)}</td>)}</tr>)}</tbody></table></div>;
}

export default function MarkdownArticle({content}: {readonly content: string}) {
  const lines = content.replace(/\r\n/g, "\n").split("\n");
  const blocks: ReactNode[] = [];
  for (let i = 0; i < lines.length;) {
    const line = lines[i].trim();
    if (!line) { i += 1; continue; }
    if (/^\|.+\|$/.test(line) && i + 1 < lines.length && /^\|?\s*:?-+/.test(lines[i + 1])) {
      const start = i; const tableLines = [lines[i], lines[i + 1]]; i += 2;
      while (i < lines.length && /^\|.+\|$/.test(lines[i].trim())) tableLines.push(lines[i++]);
      blocks.push(renderTable(tableLines, start)); continue;
    }
    const heading = /^(#{2,4})\s+(.+)$/.exec(line);
    if (heading) {
      const Tag = `h${heading[1].length}` as "h2" | "h3" | "h4";
      blocks.push(<Tag key={i}>{inline(heading[2])}</Tag>); i += 1; continue;
    }
    if (/^[-*]\s+/.test(line)) {
      const start = i; const items: string[] = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i].trim())) items.push(lines[i++].trim().replace(/^[-*]\s+/, ""));
      blocks.push(<ul key={start}>{items.map((item, n) => <li key={n}>{inline(item)}</li>)}</ul>); continue;
    }
    const start = i; const paragraph: string[] = [];
    while (i < lines.length && lines[i].trim() && !/^(#{2,4})\s+/.test(lines[i].trim()) && !/^[-*]\s+/.test(lines[i].trim()) && !(/^\|.+\|$/.test(lines[i].trim()) && i + 1 < lines.length && /^\|?\s*:?-+/.test(lines[i + 1]))) paragraph.push(lines[i++].trim());
    blocks.push(<p key={start}>{paragraph.map((part, n) => <Fragment key={n}>{n > 0 && <br/>}{inline(part)}</Fragment>)}</p>);
  }
  return <div className="blog-prose">{blocks}</div>;
}
