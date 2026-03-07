<script setup lang="ts">
import type { Company } from '../types/company'

defineProps<{
  modelValue: boolean
  company?: Company
}>()

const emit = defineEmits<{
  (event: 'update:modelValue', value: boolean): void
  (event: 'edit'): void
  (event: 'delete'): void
}>()

const close = () => emit('update:modelValue', false)
</script>

<template>
  <div v-if="modelValue && company" class="overlay" @click.self="close">
    <div class="modal detail">
      <header class="modal-header">
        <h2>{{ company.name }}</h2>
        <button type="button" class="ghost" @click="close">Close</button>
      </header>

      <div class="detail-grid">
        <p><strong>Role:</strong> {{ company.role || 'N/A' }}</p>
        <p><strong>Location:</strong> {{ company.location || 'N/A' }}</p>
        <p><strong>Status:</strong> <span class="badge">{{ company.status }}</span></p>
        <p><strong>Contact:</strong> {{ company.contact || 'N/A' }}</p>
        <p><strong>Salary Range:</strong> {{ company.salaryRange || 'N/A' }}</p>
        <p><strong>Source:</strong> {{ company.source || 'N/A' }}</p>
        <p>
          <strong>URL:</strong>
          <a v-if="company.url" :href="company.url" target="_blank" rel="noreferrer">{{ company.url }}</a>
          <span v-else>N/A</span>
        </p>
        <p><strong>Follow-Up:</strong> {{ company.nextFollowUpDate || 'N/A' }}</p>
        <p><strong>Last Action Date:</strong> {{ company.lastActionAt || 'N/A' }}</p>
        <p><strong>Last Action Note:</strong> {{ company.lastActionNote || 'N/A' }}</p>
        <p><strong>Created:</strong> {{ new Date(company.createdAt).toLocaleString() }}</p>
        <p><strong>Updated:</strong> {{ new Date(company.updatedAt).toLocaleString() }}</p>
      </div>

      <p class="notes"><strong>Notes:</strong> {{ company.notes || 'None' }}</p>

      <div v-if="company.tags.length" class="tag-list">
        <span v-for="tag in company.tags" :key="tag" class="tag">{{ tag }}</span>
      </div>

      <div class="actions">
        <button type="button" class="danger" @click="emit('delete')">Delete</button>
        <button type="button" class="primary" @click="emit('edit')">Edit</button>
      </div>
    </div>
  </div>
</template>
