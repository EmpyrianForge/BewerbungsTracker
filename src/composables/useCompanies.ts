import { computed, ref, watch } from 'vue'
import {
  STATUSES,
  PRIORITIES,
  APPLICATION_TYPES,
  type Company,
  type CompanyInput,
  type CompanyRating,
  type CompanyStatus,
  type Priority,
  type ApplicationType,
  type DocumentChecklist,
  type ActivityEntry,
} from '../types/company'

const STORAGE_KEY = 'apply-tracker.companies.v1'

const makeId = (): string => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }

  return `cmp-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

const isObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null
}

const isStatus = (value: unknown): value is CompanyStatus => {
  return typeof value === 'string' && STATUSES.includes(value as CompanyStatus)
}

const isPriority = (value: unknown): value is Priority => {
  return typeof value === 'string' && PRIORITIES.includes(value as Priority)
}

const isApplicationType = (value: unknown): value is ApplicationType => {
  return typeof value === 'string' && APPLICATION_TYPES.includes(value as ApplicationType)
}

const normalizeString = (value: unknown): string => {
  return typeof value === 'string' ? value : ''
}

const normalizeDateField = (value: unknown): string | undefined => {
  return typeof value === 'string' && value.trim().length > 0 ? value : undefined
}

const normalizeDocuments = (value: unknown): DocumentChecklist => {
  const defaults: DocumentChecklist = { cv: false, coverLetter: false, certificates: false, portfolio: false }
  if (!isObject(value)) return defaults
  return {
    cv: typeof value['cv'] === 'boolean' ? value['cv'] : false,
    coverLetter: typeof value['coverLetter'] === 'boolean' ? value['coverLetter'] : false,
    certificates: typeof value['certificates'] === 'boolean' ? value['certificates'] : false,
    portfolio: typeof value['portfolio'] === 'boolean' ? value['portfolio'] : false,
  }
}

const normalizeRating = (value: unknown): CompanyRating | undefined => {
  if (!isObject(value)) return undefined
  const clamp = (v: unknown): number => {
    const n = typeof v === 'number' ? v : 0
    return Math.min(5, Math.max(0, Math.round(n)))
  }
  return {
    culture: clamp(value['culture']),
    salary: clamp(value['salary']),
    flexibility: clamp(value['flexibility']),
    overall: clamp(value['overall']),
    comment: normalizeString(value['comment']),
  }
}

const normalizeActivityLog = (value: unknown): ActivityEntry[] => {
  if (!Array.isArray(value)) return []
  const result: ActivityEntry[] = []
  for (const item of value) {
    if (!isObject(item)) continue
    const id = normalizeString(item['id'])
    const date = normalizeString(item['date'])
    const note = normalizeString(item['note'])
    if (!id || !date) continue
    result.push({ id, date, note })
  }
  return result
}

const toCompany = (item: unknown): Company | null => {
  if (!isObject(item)) {
    return null
  }

  const id = normalizeString(item['id'])
  const name = normalizeString(item['name'])
  if (!id || !name) {
    return null
  }

  const now = new Date().toISOString()
  const tags =
    Array.isArray(item['tags'])
      ? (item['tags'] as unknown[])
          .filter((tag): tag is string => typeof tag === 'string')
          .map((tag) => tag.trim())
          .filter(Boolean)
      : []

  return {
    id,
    name,
    role: normalizeString(item['role']),
    location: normalizeString(item['location']),
    url: normalizeString(item['url']),
    contact: normalizeString(item['contact']),
    salaryRange: normalizeString(item['salaryRange']),
    source: normalizeString(item['source']),
    status: isStatus(item['status']) ? item['status'] : 'Interested',
    createdAt: normalizeDateField(item['createdAt']) ?? now,
    updatedAt: normalizeDateField(item['updatedAt']) ?? now,
    notes: normalizeString(item['notes']),
    tags: [...new Set(tags)],
    nextFollowUpDate: normalizeDateField(item['nextFollowUpDate']),
    interviewAt: normalizeDateField(item['interviewAt']),
    lastActionAt: normalizeDateField(item['lastActionAt']),
    lastActionNote: normalizeString(item['lastActionNote']),
    applicationDeadline: normalizeDateField(item['applicationDeadline']),
    priority: isPriority(item['priority']) ? item['priority'] : 'Medium',
    applicationType: isApplicationType(item['applicationType']) ? item['applicationType'] : 'Stellenanzeige',
    documents: normalizeDocuments(item['documents']),
    activityLog: normalizeActivityLog(item['activityLog']),
    rating: normalizeRating(item['rating']),
  }
}

const extractCompanyArray = (parsed: unknown): unknown[] => {
  if (Array.isArray(parsed)) {
    return parsed
  }
  if (isObject(parsed) && Array.isArray(parsed['companies'])) {
    return parsed['companies'] as unknown[]
  }
  return []
}

const parseCompaniesFromJson = (raw: string | null): Company[] => {
  if (!raw) {
    return []
  }

  try {
    const parsed = JSON.parse(raw) as unknown
    return extractCompanyArray(parsed).map(toCompany).filter((company): company is Company => company !== null)
  } catch {
    return []
  }
}

export const useCompanies = () => {
  const companies = ref<Company[]>(parseCompaniesFromJson(localStorage.getItem(STORAGE_KEY)))

  watch(
    companies,
    (value) => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
    },
    { deep: true },
  )

  const sortedCompanies = computed(() => {
    return [...companies.value].sort((a, b) => {
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    })
  })

  const addCompany = (input: CompanyInput) => {
    const now = new Date().toISOString()

    companies.value.push({
      ...input,
      id: makeId(),
      createdAt: now,
      updatedAt: now,
      tags: [...new Set(input.tags)],
      nextFollowUpDate: input.nextFollowUpDate || undefined,
      interviewAt: input.interviewAt || undefined,
      lastActionAt: input.lastActionAt || undefined,
      applicationDeadline: input.applicationDeadline || undefined,
      activityLog: [],
    })
  }

  const updateCompany = (id: string, input: CompanyInput) => {
    companies.value = companies.value.map((company) => {
      if (company.id !== id) {
        return company
      }

      return {
        ...company,
        ...input,
        tags: [...new Set(input.tags)],
        nextFollowUpDate: input.nextFollowUpDate || undefined,
        interviewAt: input.interviewAt || undefined,
        lastActionAt: input.lastActionAt || undefined,
        applicationDeadline: input.applicationDeadline || undefined,
        activityLog: company.activityLog,
        updatedAt: new Date().toISOString(),
      }
    })
  }

  const updateCompanyStatus = (id: string, status: CompanyStatus) => {
    companies.value = companies.value.map((company) => {
      if (company.id !== id) {
        return company
      }

      return {
        ...company,
        status,
        updatedAt: new Date().toISOString(),
      }
    })
  }

  const deleteCompany = (id: string) => {
    companies.value = companies.value.filter((company) => company.id !== id)
  }

  const updateRating = (id: string, rating: CompanyRating) => {
    companies.value = companies.value.map((company) => {
      if (company.id !== id) return company
      return { ...company, rating, updatedAt: new Date().toISOString() }
    })
  }

  const addActivityEntry = (id: string, note: string) => {
    companies.value = companies.value.map((company) => {
      if (company.id !== id) return company
      const entry: ActivityEntry = {
        id: makeId(),
        date: new Date().toISOString(),
        note,
      }
      return {
        ...company,
        activityLog: [...company.activityLog, entry],
        updatedAt: new Date().toISOString(),
      }
    })
  }

  const importCompaniesFromJson = (raw: string): Company[] => {
    return parseCompaniesFromJson(raw)
  }

  const mergeImportedCompanies = (incoming: Company[]) => {
    const mergedById = new Map<string, Company>()
    for (const item of companies.value) {
      mergedById.set(item.id, item)
    }
    for (const item of incoming) {
      mergedById.set(item.id, item)
    }
    companies.value = [...mergedById.values()]
  }

  const exportCompaniesJson = (): string => {
    return JSON.stringify(companies.value, null, 2)
  }

  return {
    companies: sortedCompanies,
    addCompany,
    updateCompany,
    updateCompanyStatus,
    updateRating,
    deleteCompany,
    addActivityEntry,
    importCompaniesFromJson,
    mergeImportedCompanies,
    exportCompaniesJson,
  }
}
