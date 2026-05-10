import type { Company, CompanyStatus, Priority } from '../types/company'

export interface ShareEntry {
  n: string
  r?: string
  l?: string
  s: CompanyStatus
  p: Priority
  d?: string
  f?: string
  ps?: string
  pu?: string
  pn?: string
}

export interface SharePayload {
  v: 1
  ts: string
  entries: ShareEntry[]
}

async function compress(str: string): Promise<string> {
  const bytes = new TextEncoder().encode(str)
  const cs = new CompressionStream('deflate-raw')
  const writer = cs.writable.getWriter()
  writer.write(bytes)
  writer.close()
  const buffer = await new Response(cs.readable).arrayBuffer()
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
}

async function decompress(encoded: string): Promise<string> {
  const binary = atob(encoded)
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0))
  const ds = new DecompressionStream('deflate-raw')
  const writer = ds.writable.getWriter()
  writer.write(bytes)
  writer.close()
  const buffer = await new Response(ds.readable).arrayBuffer()
  return new TextDecoder().decode(buffer)
}

export async function encodeSharePayload(companies: Company[]): Promise<string> {
  const payload: SharePayload = {
    v: 1,
    ts: new Date().toISOString(),
    entries: companies.map((c) => ({
      n: c.name,
      r: c.role || undefined,
      l: c.location || undefined,
      s: c.status,
      p: c.priority,
      d: c.applicationDeadline,
      f: c.nextFollowUpDate,
      ps: c.proofSentAt,
      pu: c.proofUrl || undefined,
      pn: c.proofNote || undefined,
    })),
  }
  return compress(JSON.stringify(payload))
}

export async function decodeSharePayload(encoded: string): Promise<SharePayload> {
  const json = await decompress(encoded)
  return JSON.parse(json) as SharePayload
}
