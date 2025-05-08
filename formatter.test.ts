import { createMockProduct } from 'fixtures/factory/createProduct'
import {
  getIntervalPriceLabel,
  getFormattedPaidUptoDate,
} from 'utils/StringFormatter'

const product = createMockProduct()

describe('String formatting util', () => {
  test('Should format label for monthly price', () => {
    const monthlyPriceLabel = getIntervalPriceLabel('MONTH', product)
    expect(monthlyPriceLabel).toEqual('$32.95/mo')
  })

  test('Should format label for annually price', () => {
    const monthlyPriceLabel = getIntervalPriceLabel('YEAR', product)
    expect(monthlyPriceLabel).toEqual('$395.4/yr')
  })
})

describe('Date formatting util', () => {
  test('Should format paid up to date correctly', () => {
    const date = '2024-07-24T10:00:00Z'
    const formattedDate = getFormattedPaidUptoDate(date)
    expect(formattedDate).toEqual('Paid up to July 24, 2024')
  })

  test('Should return undefined for invalid date', () => {
    const invalidDate = 'invalid-date'
    const formattedDate = getFormattedPaidUptoDate(invalidDate)
    expect(formattedDate).toBeUndefined()
  })
})
