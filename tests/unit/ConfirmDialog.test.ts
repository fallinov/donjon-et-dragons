import { afterEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import ConfirmDialog from '~/components/ConfirmDialog.vue'
import { useConfirm } from '~/composables/useConfirm'

const options = { title: 'Supprimer la fiche ?', message: 'Définitif.', confirmLabel: 'Supprimer', cancelLabel: 'Annuler' }

describe('ConfirmDialog + useConfirm', () => {
  afterEach(() => useConfirm().request.value?.resolve('cancel'))

  it('résout true sur confirmation et ferme la boîte', async () => {
    const wrapper = mount(ConfirmDialog, { attachTo: document.body })
    const answer = useConfirm().confirm(options)
    await nextTick(); await nextTick()
    expect(wrapper.text()).toContain('Supprimer la fiche ?')
    await wrapper.find('[data-confirm]').trigger('click')
    await expect(answer).resolves.toBe(true)
    expect(useConfirm().request.value).toBeNull()
    wrapper.unmount()
  })

  it('résout false sur Annuler et sur Échap', async () => {
    const wrapper = mount(ConfirmDialog, { attachTo: document.body })
    const first = useConfirm().confirm(options)
    await nextTick(); await nextTick()
    await wrapper.findAll('button')[0]!.trigger('click')
    await expect(first).resolves.toBe(false)

    const second = useConfirm().confirm(options)
    await nextTick(); await nextTick()
    await wrapper.find('dialog').trigger('cancel')
    await expect(second).resolves.toBe(false)
    wrapper.unmount()
  })

  it('annule une demande encore ouverte quand une nouvelle arrive', async () => {
    const first = useConfirm().confirm(options)
    const second = useConfirm().confirm({ ...options, title: 'Autre' })
    await expect(first).resolves.toBe(false)
    expect(useConfirm().request.value?.title).toBe('Autre')
    useConfirm().request.value?.resolve('confirm')
    await expect(second).resolves.toBe(true)
  })

  it('troisième choix : résout « extra »', async () => {
    const wrapper = mount(ConfirmDialog, { attachTo: document.body })
    const answer = useConfirm().choose({ ...options, extraLabel: 'Importer en copie' })
    await nextTick(); await nextTick()
    await wrapper.find('[data-confirm-extra]').trigger('click')
    await expect(answer).resolves.toBe('extra')
    wrapper.unmount()
  })
})

