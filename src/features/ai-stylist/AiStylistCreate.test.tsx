import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { createDemoSeed } from '@/app/data/demoSeed'
import { AppProviders } from '@/app/providers/AppProviders'
import { appRoutes } from '@/app/router/AppRouter'
import type { DemoDatabase } from '@/app/store/types'
import { DEMO_STORAGE_KEY } from '@/shared/storage/demoStorage'

function databaseWithCustomer(overrides: Partial<DemoDatabase> = {}): DemoDatabase {
  return {
    ...createDemoSeed(),
    session: { userId: 'usr-customer-01', persistent: true },
    ...overrides,
  }
}

function persistDatabase(database: DemoDatabase) {
  window.localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(database))
}

function getDatabase() {
  const raw = window.localStorage.getItem(DEMO_STORAGE_KEY)
  if (!raw) throw new Error('Expected database in localStorage')
  return JSON.parse(raw) as DemoDatabase
}

function renderAiStylist(database = databaseWithCustomer()) {
  window.localStorage.clear()
  persistDatabase(database)
  const router = createMemoryRouter(appRoutes, { initialEntries: ['/wardrobes/new/ai'] })

  render(
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>,
  )

  return router
}

async function requestRecommendation(message: string) {
  const user = userEvent.setup()
  await user.type(await screen.findByLabelText('Tin nhắn cho AI Stylist'), message)
  await user.click(screen.getByRole('button', { name: 'Gửi yêu cầu' }))
  await screen.findByRole('region', { name: 'Gợi ý outfit từ AI' })
  return user
}

function latestCreateConversation(database: DemoDatabase) {
  return database.aiConversations.filter(conversation => conversation.mode === 'create').at(-1)
}

function expectRecommendationLinksUseActiveCatalog(region: HTMLElement, database: DemoDatabase) {
  const links = within(region).getAllByRole('link')
  expect(links.length).toBeGreaterThan(0)

  links.forEach(link => {
    const productId = link.getAttribute('href')?.replace('/products/', '')
    const product = database.products.find(candidate => candidate.id === productId)
    expect(product?.active).toBe(true)
    expect(product?.variants.some(variant => variant.active)).toBe(true)
  })
}

function expectRecommendationLinksIncludeCategory(region: HTMLElement, database: DemoDatabase, categoryId: string) {
  const links = within(region).getAllByRole('link')
  expect(
    links.some(link => {
      const productId = link.getAttribute('href')?.replace('/products/', '')
      const product = database.products.find(candidate => candidate.id === productId)
      return product?.categoryId === categoryId
    }),
  ).toBe(true)
}

describe('AI stylist create flow', () => {
  it('starts with an assistant first message', async () => {
    renderAiStylist()

    expect(
      await screen.findByText('Mình là AI Stylist của StyleMind. Hãy nói dịp mặc, phong cách hoặc món bạn muốn phối.'),
    ).toBeInTheDocument()
  })

  it('asks for height and weight when profile body info is missing', async () => {
    const user = userEvent.setup()
    const database = databaseWithCustomer({
      users: createDemoSeed().users.map(userRecord =>
        userRecord.id === 'usr-customer-01'
          ? { ...userRecord, heightCm: undefined, weightKg: undefined }
          : userRecord,
      ),
    })
    renderAiStylist(database)

    await user.type(await screen.findByLabelText('Chiều cao (cm)'), '165')
    await user.type(screen.getByLabelText('Cân nặng (kg)'), '54')
    await user.click(screen.getByRole('button', { name: 'Lưu số đo' }))

    await waitFor(() => {
      const currentUser = getDatabase().users.find(userRecord => userRecord.id === 'usr-customer-01')
      expect(currentUser).toMatchObject({ heightCm: 165, weightKg: 54 })
    })
  })

  it('generates recommendations from real active catalog variants only', async () => {
    renderAiStylist()

    await requestRecommendation('Tôi cần outfit đi làm tối giản có áo và chân váy')

    const region = await screen.findByRole('region', { name: 'Gợi ý outfit từ AI' })
    expectRecommendationLinksUseActiveCatalog(region, getDatabase())
    expect(latestCreateConversation(getDatabase())?.recommendation).toBeUndefined()
  })

  it('does not save a recommendation until the customer confirms and names it', async () => {
    const initialAiOutfitCount = createDemoSeed().outfits.filter(outfit => outfit.source === 'ai').length
    renderAiStylist()

    const user = await requestRecommendation('Tôi cần outfit cuối tuần nữ tính với áo và chân váy')

    await user.click(screen.getByRole('button', { name: 'Lưu outfit AI' }))
    expect(await screen.findByText('Vui lòng đặt tên outfit')).toBeInTheDocument()
    expect(getDatabase().outfits.filter(outfit => outfit.source === 'ai')).toHaveLength(initialAiOutfitCount)
    expect(latestCreateConversation(getDatabase())?.recommendation).toBeUndefined()

    await user.type(screen.getByLabelText('Tên outfit AI'), 'Outfit AI đi chơi')
    await user.click(screen.getByRole('button', { name: 'Lưu outfit AI' }))

    expect(await screen.findByRole('heading', { name: 'Outfit AI đi chơi' })).toBeInTheDocument()

    await waitFor(() => {
      const created = getDatabase().outfits.find(outfit => outfit.name === 'Outfit AI đi chơi')
      expect(created).toMatchObject({
        ownerId: 'usr-customer-01',
        source: 'ai',
        visibility: 'private',
      })
      expect(created?.items.every(item => item.addedBy === 'ai')).toBe(true)
      expect(latestCreateConversation(getDatabase())?.recommendation).toBeDefined()
    })
  })

  it('regenerates an outfit after customer feedback', async () => {
    renderAiStylist()

    const user = await requestRecommendation('Tôi cần outfit đi làm tối giản với áo và quần')

    expectRecommendationLinksIncludeCategory(
      await screen.findByRole('region', { name: 'Gợi ý outfit từ AI' }),
      getDatabase(),
      'pants',
    )

    await user.clear(screen.getByLabelText('Tin nhắn cho AI Stylist'))
    await user.type(screen.getByLabelText('Tin nhắn cho AI Stylist'), 'Đổi sang chân váy nhẹ hơn')
    await user.click(screen.getByRole('button', { name: 'Tạo lại gợi ý' }))

    expect(await screen.findByText('Mình đã tạo lại outfit theo phản hồi của bạn.')).toBeInTheDocument()
    expectRecommendationLinksIncludeCategory(
      await screen.findByRole('region', { name: 'Gợi ý outfit từ AI' }),
      getDatabase(),
      'skirts',
    )
  })
})
