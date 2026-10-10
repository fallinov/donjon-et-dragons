import { readonly, ref, toValue, watch, type MaybeRefOrGetter } from 'vue'

interface Bytes {
  data: ArrayBuffer
  mime: string
}

/**
 * URL `blob:` affichable pour des octets (portrait). L'URL précédente est révoquée
 * à chaque changement et à la destruction du composant.
 */
export function useObjectUrl(source: MaybeRefOrGetter<Bytes | undefined>) {
  const url = ref<string>()
  watch(
    () => toValue(source),
    (bytes, _previous, onCleanup) => {
      if (!bytes) {
        url.value = undefined
        return
      }
      const current = URL.createObjectURL(new Blob([bytes.data], { type: bytes.mime }))
      url.value = current
      onCleanup(() => URL.revokeObjectURL(current))
    },
    { immediate: true },
  )
  return readonly(url)
}
