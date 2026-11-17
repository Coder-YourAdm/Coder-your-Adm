import { defineStore } from 'pinia'
import { ref } from 'vue'

const STORAGE_KEY = 'shiyun-recitation-results'
const MAX_RESULTS = 100

function readResults() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const data = raw ? JSON.parse(raw) : []
    return Array.isArray(data) ? data.filter((item) => item && typeof item.poemId === 'string') : []
  } catch (error) {
    console.warn('无法读取朗诵打分记录', error)
    return []
  }
}

export const useRecitationStore = defineStore('recitation', () => {
  const results = ref(readResults())

  function add(result) {
    results.value = [{ ...result, at: Date.now() }, ...results.value].slice(0, MAX_RESULTS)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(results.value))
    } catch (error) {
      console.error('无法保存朗诵打分记录', error)
    }
  }

  return { results, add }
})
