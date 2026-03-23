export interface JobLocation {
  plz?: number
  ort?: string
  region?: string
  land?: string
}

export interface JobListing {
  hashId: string
  refnr: string
  beruf: string
  arbeitgeber: string
  aktuelleVeroeffentlichungsdatum: string
  eintrittsdatum?: string
  arbeitsort: JobLocation
}

export interface JobSearchResponse {
  maxErgebnisse: number | string
  page: number | string
  size: number | string
  stellenangebote: JobListing[] | null
}
