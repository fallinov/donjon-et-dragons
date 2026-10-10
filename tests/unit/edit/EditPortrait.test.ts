import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import type { Character } from '~~/shared/types/character'
import EditPortrait from '~/components/edit/EditPortrait.vue'
import EditSection from '~/components/edit/EditSection.vue'
import EditText from '~/components/edit/EditText.vue'
import { ImageError } from '~/utils/image'
import { darethBrumeval, settle } from '../../helpers/characters'

const resized = { data: new Uint8Array([9, 9]).buffer, mime: 'image/jpeg' }
const placeholder = { data: new Uint8Array([7]).buffer, mime: 'image/svg+xml' }
// Fonction interchangeable plutôt que vi.fn : un espion configuré pour échouer laisse un rejet non géré
let resizePortrait: (file: Blob) => Promise<{ data: ArrayBuffer, mime: string }> = async () => resized

vi.mock('~/utils/image', async (original) => {
  const actual = await original<typeof import('~/utils/image')>()
  return { ...actual, resizePortrait: (file: Blob) => resizePortrait(file) }
})
vi.mock('~/db/seed', async (original) => {
  const actual = await original<typeof import('~/db/seed')>()
  return { ...actual, fetchPortrait: vi.fn(async () => placeholder) }
})

function mountPortrait() {
  const character = ref<Character>(structuredClone(darethBrumeval))
  const wrapper = mount(EditPortrait, {
    props: { 'modelValue': character.value, 'onUpdate:modelValue': (v: Character) => { character.value = v } },
    global: { components: { EditSection, EditText } },
  })
  return { wrapper, character }
}

async function chooseFile(wrapper: ReturnType<typeof mountPortrait>['wrapper'], file: File): Promise<void> {
  const input = wrapper.find('[data-portrait-input]')
  Object.defineProperty(input.element, 'files', { value: [file], configurable: true })
  await input.trigger('change')
  await settle()
}

describe('EditPortrait', () => {
  beforeEach(() => { resizePortrait = async () => resized })

  it('remplace le portrait par la photo réduite et garde le texte alternatif', async () => {
    const { wrapper, character } = mountPortrait()
    const alt = character.value.portrait.alt
    await chooseFile(wrapper, new File(['x'], 'photo.jpg', { type: 'image/jpeg' }))
    expect([...new Uint8Array(character.value.portrait.data)]).toEqual([9, 9])
    expect(character.value.portrait.mime).toBe('image/jpeg')
    expect(character.value.portrait.alt).toBe(alt)
    expect(wrapper.find('[data-portrait-status]').text()).toBe('')
  })

  it('affiche l\'erreur et garde l\'ancien portrait si la photo est refusée', async () => {
    resizePortrait = async () => { throw new ImageError('too-large') }
    const { wrapper, character } = mountPortrait()
    const before = character.value.portrait.data
    await chooseFile(wrapper, new File(['x'], 'enorme.jpg', { type: 'image/jpeg' }))
    expect(wrapper.find('[data-portrait-status]').text()).toBe('Image trop lourde (25 Mo au maximum).')
    expect(character.value.portrait.data).toBe(before)
  })

  it('erreur inattendue : message « format non pris en charge »', async () => {
    resizePortrait = async () => { throw new Error('boom') }
    const { wrapper } = mountPortrait()
    await chooseFile(wrapper, new File(['x'], 'photo.heic', { type: 'image/heic' }))
    expect(wrapper.find('[data-portrait-status]').text()).toContain('non pris en charge')
  })

  it('« Portrait par défaut » remet la silhouette', async () => {
    const { wrapper, character } = mountPortrait()
    await wrapper.findAll('button').find(b => b.text() === 'Portrait par défaut')!.trigger('click')
    await settle()
    expect(character.value.portrait.mime).toBe('image/svg+xml')
  })
})
