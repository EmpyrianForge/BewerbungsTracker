import { computed, ref, watch } from 'vue'
import { STATUSES, type Company, type CompanyInput, type CompanyStatus } from '../types/company'

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

const normalizeString = (value: unknown): string => {
  return typeof value === 'string' ? value : ''
}

const normalizeDateField = (value: unknown): string | undefined => {
  return typeof value === 'string' && value.trim().length > 0 ? value : undefined
}

const toCompany = (item: unknown): Company | null => {
  if (!isObject(item)) {
    return null
  }

  const id = normalizeString(item.id)
  const name = normalizeString(item.name)
  if (!id || !name) {
    return null
  }

  const now = new Date().toISOString()
  const tags =
    Array.isArray(item.tags)
      ? item.tags
          .filter((tag): tag is string => typeof tag === 'string')
          .map((tag) => tag.trim())
          .filter(Boolean)
      : []

  return {
    id,
    name,
    role: normalizeString(item.role),
    location: normalizeString(item.location),
    url: normalizeString(item.url),
    contact: normalizeString(item.contact),
    salaryRange: normalizeString(item.salaryRange),
    source: normalizeString(item.source),
    status: isStatus(item.status) ? item.status : 'Interested',
    createdAt: normalizeDateField(item.createdAt) ?? now,
    updatedAt: normalizeDateField(item.updatedAt) ?? now,
    notes: normalizeString(item.notes),
    tags: [...new Set(tags)],
    nextFollowUpDate: normalizeDateField(item.nextFollowUpDate),
    lastActionAt: normalizeDateField(item.lastActionAt),
    lastActionNote: normalizeString(item.lastActionNote),
  }
}

const extractCompanyArray = (parsed: unknown): unknown[] => {
  if (Array.isArray(parsed)) {
    return parsed
  }
  if (isObject(parsed) && Array.isArray(parsed.companies)) {
    return parsed.companies
  }
  return []
}

const parseCompaniesFromJson = (raw: string | null): Company[] => {
  if (!raw) {
    return []
  }

  try {
    const parsed = JSON.parse(raw)
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
      lastActionAt: input.lastActionAt || undefined,
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
        lastActionAt: input.lastActionAt || undefined,
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
    deleteCompany,
    importCompaniesFromJson,
    mergeImportedCompanies,
    exportCompaniesJson,
  }
}
