export const STATUSES = [
  'Interested',
  'Applied',
  'Interviewing',
  'Offer',
  'Rejected',
  'Archived',
] as const

export type CompanyStatus = (typeof STATUSES)[number]

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
  lastActionAt?: string
  lastActionNote: string
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
  lastActionAt?: string
  lastActionNote: string
}
