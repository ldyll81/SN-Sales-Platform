import { ref } from 'vue'

const tianqiVisible = ref(false)

export function useTianqi() {
  function openTianqi() {
    tianqiVisible.value = true
  }

  function closeTianqi() {
    tianqiVisible.value = false
  }

  return {
    tianqiVisible,
    openTianqi,
    closeTianqi
  }
}
