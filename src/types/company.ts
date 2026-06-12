export const STATUSES = [
  'Interested',
  'Applied',
  'Interviewing',
  'Offer',
  'Rejected',
  'Archived',
] as const

export type CompanyStatus = (typeof STATUSES)[number]

export const PRIORITIES = ['High', 'Medium', 'Low'] as const
export type Priority = (typeof PRIORITIES)[number]

export const APPLICATION_TYPES = ['Stellenanzeige', 'Initiativbewerbung', 'Empfehlung', 'Sonstiges'] as const
export type ApplicationType = (typeof APPLICATION_TYPES)[number]

export interface DocumentChecklist {
  cv: boolean
  coverLetter: boolean
  motivationLetter: boolean
  certificates: boolean
  portfolio: boolean
  github: boolean
}

export interface ActivityEntry {
  id: string
  date: string
  note: string
}

export interface CompanyRating {
  culture: number
  salary: number
  flexibility: number
  overall: number
  comment: string
}

export type OutreachStatus = 'green' | 'yellow' | 'red'
export type RedReason = 'kein-ausbilder' | 'absage-generell' | 'absage-kapazitaet'

export const RED_REASON_LABELS: Record<RedReason, { short: string; description: string }> = {
  'kein-ausbilder': { short: 'Kein Ausbilder', description: 'Firma bietet keine Ausbildungsplätze an' },
  'absage-generell': { short: 'Absage generell', description: 'Firma nimmt grundsätzlich keine Bewerber an' },
  'absage-kapazitaet': { short: 'Absage Kapazität', description: 'Nur dieses Mal abgesagt — andere TN können schreiben' },
}

export interface Company {
  id: string
  name: string
  role: string
  location: string
  url: string
  contact: string
  salaryRange: string
  source: string
  status: CompanyStatus
  createdAt: string
  updatedAt: string
  notes: string
  tags: string[]
  nextFollowUpDate?: string
  interviewAt?: string
  lastActionAt?: string
  lastActionNote: string
  applicationDeadline?: string
  priority: Priority
  applicationType: ApplicationType
  documents: DocumentChecklist
  activityLog: ActivityEntry[]
  rating?: CompanyRating
  proofSentAt?: string
  proofUrl?: string
  proofNote?: string
  outreachStatus: OutreachStatus
  redReason?: RedReason
}

export interface CompanyInput {
  name: string
  role: string
  location: string
  url: string
  contact: string
  salaryRange: string
  source: string
  status: CompanyStatus
  notes: string
  tags: string[]
  nextFollowUpDate?: string
  interviewAt?: string
  lastActionAt?: string
  lastActionNote: string
  applicationDeadline?: string
  priority: Priority
  applicationType: ApplicationType
  documents: DocumentChecklist
  proofSentAt?: string
  proofUrl?: string
  proofNote?: string
  outreachStatus: OutreachStatus
  redReason?: RedReason
}
