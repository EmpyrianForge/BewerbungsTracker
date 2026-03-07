<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import { STATUSES, type Company, type CompanyInput } from '../types/company'

const props = defineProps<{
  modelValue: boolean
  mode: 'create' | 'edit'
  company?: Company
}>()

const emit = defineEmits<{
  (event: 'update:modelValue', value: boolean): void
  (event: 'save', value: CompanyInput): void
}>()

const emptyForm = (): CompanyInput => ({
  name: '',
  role: '',
  location: '',
  url: '',
  contact: '',
  salaryRange: '',
  source: '',
  status: 'Interested',
  notes: '',
  tags: [],
  nextFollowUpDate: undefined,
  lastActionAt: undefined,
  lastActionNote: '',
})

const form = reactive<CompanyInput>(emptyForm())
const tagInput = computed({
  get: () => form.tags.join(', '),
  set: (value: string) => {
    form.tags = value
      .split(',')
      .map((item) => item.trim())
      .filter((item, index, arr) => item.length > 0 && arr.indexOf(item) === index)
  },
})

watch(
  () => props.modelValue,
  (isOpen) => {
    if (!isOpen) {
      return
    }

    const source = props.company
    if (!source) {
      Object.assign(form, emptyForm())
      return
    }

    Object.assign(form, {
      name: source.name,
      role: source.role,
      location: source.location,
      url: source.url,
      contact: source.contact,
      salaryRange: source.salaryRange,
      source: source.source,
      status: source.status,
      notes: source.notes,
      tags: [...source.tags],
      nextFollowUpDate: source.nextFollowUpDate,
      lastActionAt: source.lastActionAt,
      lastActionNote: source.lastActionNote,
    })
  },
)

const close = () => emit('update:modelValue', false)

const submit = () => {
  if (!form.name.trim()) {
    return
  }

  emit('save', {
    ...form,
    name: form.name.trim(),
    role: form.role.trim(),
    location: form.location.trim(),
    url: form.url.trim(),
    contact: form.contact.trim(),
    salaryRange: form.salaryRange.trim(),
    source: form.source.trim(),
    notes: form.notes.trim(),
    nextFollowUpDate: form.nextFollowUpDate || undefined,
    lastActionAt: form.lastActionAt || undefined,
    lastActionNote: form.lastActionNote.trim(),
  })
  close()
}
</script>

<template>
  <div v-if="modelValue" class="overlay" @click.self="close">
    <div class="modal">
      <header class="modal-header">
        <h2>{{ mode === 'create' ? 'Add Company' : 'Edit Company' }}</h2>
        <button type="button" class="ghost" @click="close">Close</button>
      </header>

      <form class="form" @submit.prevent="submit">
        <label>
          Company Name
          <input v-model="form.name" required maxlength="120" />
        </label>
        <label>
          Role
          <input v-model="form.role" maxlength="120" />
        </label>
        <label>
          Location
          <input v-model="form.location" maxlength="120" />
        </label>
        <label>
          URL
          <input v-model="form.url" type="url" placeholder="https://..." />
        </label>
        <label>
          Contact
          <input v-model="form.contact" maxlength="120" placeholder="Name, email, LinkedIn, etc." />
        </label>
        <label>
          Salary Range
          <input v-model="form.salaryRange" maxlength="120" placeholder="$120k-$150k" />
        </label>
        <label>
          Source
          <input v-model="form.source" maxlength="120" placeholder="LinkedIn, referral, careers page" />
        </label>
        <label>
          Status
          <select v-model="form.status">
            <option v-for="status in STATUSES" :key="status" :value="status">{{ status }}</option>
          </select>
        </label>
        <label>
          Next Follow-Up Date
          <input v-model="form.nextFollowUpDate" type="date" />
        </label>
        <label>
          Tags (comma-separated)
          <input v-model="tagInput" placeholder="remote, startup, referral" />
        </label>
        <label>
          Last Action Date
          <input v-model="form.lastActionAt" type="date" />
        </label>
        <label>
          Last Action Note
          <textarea v-model="form.lastActionNote" rows="2" />
        </label>
        <label>
          Notes
          <textarea v-model="form.notes" rows="4" />
        </label>
        <div class="actions">
          <button type="button" class="ghost" @click="close">Cancel</button>
          <button type="submit" class="primary">{{ mode === 'create' ? 'Create' : 'Save Changes' }}</button>
        </div>
      </form>
    </div>
  </div>
</template>
