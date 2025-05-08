import { find, includes, matchesProperty, memoize } from 'lodash'
import {
  ProductInterval,
  type ProductItem,
  type ProductItems,
  type ProductDetail,
  ProductKind,
} from '../@types/generated/graphql'

export interface ProductContent {
  summary: any
  contract: any
  highlights: string[]
}

export class Product {
  private readonly _uuid: string
  readonly name: string
  readonly priceInfo: {
    Monthly: { price: number; paymentProcessorPriceId: string }
    Annually: { price: number; paymentProcessorPriceId: string }
  }

  readonly content: ProductContent
  readonly type: ProductKind
  subscribed: boolean
  subscriptionFrequency?: ProductInterval
  addedToCart: boolean
  supplements?: Product[]

  constructor(product: ProductItem, type: ProductKind) {
    if (product?.content?.name == null || product.uuid == null) {
      throw new Error('Invalid ProductItem')
    }
    this._uuid = product.uuid
    this.name = product.content.name
    this.content = {
      highlights: product.content.highlights?.trim().split(/\n+/) ?? [],
      contract: product.content.full_document,
      summary: product.content.summary,
    }
    this.priceInfo = {
      Monthly: {
        price: parseFloat(product.content.monthly_price ?? '0'),
        paymentProcessorPriceId: product.content.stripe_monthly_price_id ?? '',
      },
      Annually: {
        price: parseFloat(product.content.annually_price ?? '0'),
        paymentProcessorPriceId: product.content.stripe_annually_price_id ?? '',
      },
    }
    this.type = type
    this.subscribed = false
    this.subscriptionFrequency = undefined
    this.addedToCart = false
  }

  static fromProductItemAndDetail(
    item: ProductItem,
    detail: ProductDetail,
    subscribed: boolean = true
  ): Product {
    const product = new Product(item, detail.kind)
    product.subscribed = subscribed
    product.subscriptionFrequency = detail.billingInterval

    return product
  }

  hasValidPrice = (): boolean => {
    return (
      this.priceInfo.Monthly.price > 0 &&
      this.priceInfo.Annually.price > 0 &&
      this.priceInfo.Monthly.paymentProcessorPriceId != null &&
      this.priceInfo.Annually.paymentProcessorPriceId != null
    )
  }

  get uuid(): string {
    return this._uuid
  }

  clone(overrides: Partial<Product> = {}): Product {
    return Object.assign(
      Object.create(Object.getPrototypeOf(this)),
      this,
      overrides
    )
  }
}

export class ProductsList {
  products: Product[]
  private readonly memoizedFlattenedProducts: Product[]

  constructor(products: Product[]) {
    this.products = products
    this.memoizedFlattenedProducts = memoize(this.flattenProducts.bind(this))()
  }

  static fromProductItems(productItems: ProductItems): ProductsList {
    const products = ProductsList.parseProducts(productItems)
    return new ProductsList(products)
  }

  static parseProducts(productItems: ProductItems): Product[] {
    const parsedProducts: Product[] = []
    productItems.items
      ?.filter((p) => !includes(p?.full_slug, 'products/supplements'))
      .forEach((product) => {
        if (product == null) return

        const supplements: Product[] = []
        product.content?.supplements?.forEach((supplement) => {
          if (supplement == null) return
          const supplementProduct = new Product(
            supplement as ProductItem,
            ProductKind.Supplement
          )
          if (supplementProduct.hasValidPrice())
            supplements.push(supplementProduct)
        })

        const plansProduct = new Product(product, ProductKind.Plan)
        if (plansProduct.hasValidPrice()) {
          plansProduct.supplements = supplements
          parsedProducts.push(plansProduct)
        }
      })
    return parsedProducts
  }

  private flattenProducts(): Product[] {
    const flattenedProducts: Product[] = []

    const addFlatProducts = (products: Product[]): void => {
      products.forEach((product) => {
        flattenedProducts.push(product)
        if (
          product.supplements !== undefined &&
          product.supplements.length > 0
        ) {
          addFlatProducts(product.supplements)
        }
      })
    }

    addFlatProducts(this.products)
    return flattenedProducts
  }

  getParentProduct(itemUUID: string): Product | undefined {
    return this.products.find((product) =>
      product.supplements?.some((supplement) => supplement.uuid === itemUUID)
    )
  }

  getProductByUUID(uuid: string): Product | undefined {
    return find(this.memoizedFlattenedProducts, matchesProperty('uuid', uuid))
  }

  getProductsByUUIDs(itemUUIDs: string[]): ProductsList {
    const products = this.memoizedFlattenedProducts.filter((p) =>
      itemUUIDs.includes(p.uuid)
    )
    return new ProductsList(products)
  }

  filterByType(type: ProductKind): Product[] {
    return this.products.filter((p) => p.type === type)
  }

  calculateTotal(period: ProductInterval): number {
    const total = this.products.reduce((acc, product) => {
      if (period === ProductInterval.Year)
        acc += product.priceInfo.Annually.price
      if (period === ProductInterval.Month)
        acc += product.priceInfo.Monthly.price
      return acc
    }, 0)

    return parseFloat(total.toFixed(2))
  }
}
