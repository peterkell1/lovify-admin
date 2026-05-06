import { type ReactNode } from 'react'

// Tiny markdown → React renderer. Supports: # / ## / ### headers,
// **bold**, `code`, bullet/numbered lists, paragraphs.
// Intentionally minimal so we don't need a full markdown parser dependency.

function renderInline(text: string): ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g)
  return parts.map((p, i) => {
    if (p.startsWith('**') && p.endsWith('**')) {
      return (
        <strong key={i} className="font-semibold text-foreground">
          {p.slice(2, -2)}
        </strong>
      )
    }
    if (p.startsWith('`') && p.endsWith('`')) {
      return (
        <code
          key={i}
          className="px-1 py-0.5 rounded bg-muted text-[12px] font-mono text-foreground"
        >
          {p.slice(1, -1)}
        </code>
      )
    }
    return <span key={i}>{p}</span>
  })
}

export function renderMarkdown(md: string): ReactNode[] {
  const lines = md.split('\n')
  const blocks: ReactNode[] = []
  let listBuffer: { ordered: boolean; items: string[] } | null = null

  function flushList() {
    if (!listBuffer) return
    const Tag = listBuffer.ordered ? 'ol' : 'ul'
    const cls = listBuffer.ordered
      ? 'list-decimal pl-5 space-y-1.5 text-sm text-foreground'
      : 'list-disc pl-5 space-y-1.5 text-sm text-foreground'
    blocks.push(
      <Tag key={`l-${blocks.length}`} className={cls}>
        {listBuffer.items.map((it, i) => (
          <li key={i}>{renderInline(it)}</li>
        ))}
      </Tag>
    )
    listBuffer = null
  }

  for (const rawLine of lines) {
    const line = rawLine.trimEnd()
    if (!line.trim()) {
      flushList()
      continue
    }
    if (line.startsWith('### ')) {
      flushList()
      blocks.push(
        <h4
          key={`h-${blocks.length}`}
          className="text-xs font-bold text-foreground uppercase tracking-wider mt-4 mb-1"
        >
          {renderInline(line.slice(4))}
        </h4>
      )
      continue
    }
    if (line.startsWith('## ')) {
      flushList()
      blocks.push(
        <h3
          key={`h-${blocks.length}`}
          className="text-sm font-bold text-foreground mt-5 mb-2"
        >
          {renderInline(line.slice(3))}
        </h3>
      )
      continue
    }
    if (line.startsWith('# ')) {
      flushList()
      blocks.push(
        <h2
          key={`h-${blocks.length}`}
          className="text-base font-bold text-foreground mt-6 mb-3"
        >
          {renderInline(line.slice(2))}
        </h2>
      )
      continue
    }
    const olMatch = line.match(/^(\d+)\.\s+(.*)$/)
    if (olMatch) {
      if (!listBuffer || !listBuffer.ordered) {
        flushList()
        listBuffer = { ordered: true, items: [] }
      }
      listBuffer.items.push(olMatch[2])
      continue
    }
    if (line.startsWith('- ') || line.startsWith('* ')) {
      if (!listBuffer || listBuffer.ordered) {
        flushList()
        listBuffer = { ordered: false, items: [] }
      }
      listBuffer.items.push(line.slice(2))
      continue
    }
    flushList()
    blocks.push(
      <p
        key={`p-${blocks.length}`}
        className="text-sm text-foreground leading-relaxed"
      >
        {renderInline(line)}
      </p>
    )
  }
  flushList()
  return blocks
}
