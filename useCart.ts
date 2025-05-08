import { type Product, type ProductsList } from 'models/Product'
import { useMemo, useState } from 'react'
import { ProductKind } from 'graphql/generated/operation-types'
import { ProductInterval } from '../@types/generated/graphql'

export interface CartProducts {
  cartItemsUUIDs: string[]
  cartItemsTotalPerAnnum: number
  cartItemsTotalPerMonth: number
  operatingPaymentFrequency: ProductInterval | undefined
  toggleCartItem: (itemUUID: string) => void
  isAddedToCart: (itemUUID: string) => boolean
}

export const useCart = (productsList: ProductsList): CartProducts => {
  const [cartItemsUUIDs, setCartItemsUUIDs] = useState<string[]>([])
  const [operatingPaymentFrequency, setOperatingPaymentFrequency] =
    useState<ProductInterval>()

  const cartItems = useMemo(() => {
    return productsList?.getProductsByUUIDs(cartItemsUUIDs)
  }, [cartItemsUUIDs, productsList])

  const toggleCartItem = (itemUUID: string): void => {
    setOperatingPaymentFrequency(undefined)

    const productItem = productsList?.getProductByUUID(itemUUID)
    if (productItem === undefined || !productItem.hasValidPrice()) return

    const productExistsInCart = cartItemsUUIDs?.includes(itemUUID)
    const hasAnActiveSubscription = productsList?.products.some(
      (p) => p.subscribed
    )
    const cartSupplementIDs = cartItems
      ?.filterByType(ProductKind.Supplement)
      .map((s) => s.uuid)

    if (
      hasAnActiveSubscription &&
      productItem.type === ProductKind.Plan &&
      cartSupplementIDs !== undefined &&
      cartSupplementIDs.some(
        (s) => productsList?.getParentProduct(s)?.uuid !== itemUUID
      )
    )
      setCartItemsUUIDs([])

    if (
      hasAnActiveSubscription &&
      productItem.type === ProductKind.Supplement &&
      cartSupplementIDs !== undefined
    )
      setCartItemsUUIDs(cartSupplementIDs)
    if (productExistsInCart) removeFromCart(productItem)
    else addToCart(productItem)

    if (productItem.type === ProductKind.Supplement)
      determinePaymentFrequencyForSupplement(itemUUID)
  }

  const addToCart = (item: Product): void => {
    setCartItemsUUIDs((prev) => [...prev, item.uuid])
  }

  const determinePaymentFrequencyForSupplement = (
    supplmentId: string
  ): void => {
    const parentPlan = productsList?.getParentProduct(supplmentId)
    if (parentPlan !== undefined)
      setOperatingPaymentFrequency(parentPlan.subscriptionFrequency)
  }

  const removeFromCart = (item: Product): void => {
    const itemsToRemove = [
      item.uuid,
      ...(item.supplements?.map((supplement) => supplement.uuid) ?? []),
    ]
    setCartItemsUUIDs((prev) =>
      prev.filter((id) => !itemsToRemove.includes(id))
    )
  }

  const isAddedToCart = (itemUUID: string): boolean => {
    return cartItemsUUIDs.includes(itemUUID)
  }

  return {
    cartItemsUUIDs,
    cartItemsTotalPerAnnum:
      cartItems?.calculateTotal(ProductInterval.Year) ?? 0,
    cartItemsTotalPerMonth:
      cartItems?.calculateTotal(ProductInterval.Month) ?? 0,
    operatingPaymentFrequency,
    toggleCartItem,
    isAddedToCart,
  }
}
