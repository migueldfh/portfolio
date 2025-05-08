import Grid from '@mui/material/Grid'
import CheckoutProductListItem from '../molecules/CheckoutProductListItem'
import { type Product } from 'models/Product'
import { printPriceLabel } from 'utils/StringFormatter'
import { ProductInterval } from '../../../@types/generated/graphql'

interface Props {
  products?: Product[]
  isAddedToCart: (itemUUID: string) => boolean
  onSelectedProduct: (productUUID: string) => void
  onHandleAsideViewClick: (productUuid: string, contentView: string) => void
}

const getPriceCaption = (product: Product): string => {
  return `${printPriceLabel(
    ProductInterval.Month,
    product.priceInfo.Monthly.price
  )} or ${printPriceLabel(
    ProductInterval.Year,
    product.priceInfo.Annually.price
  )}`
}

const ProductListing = ({
  products,
  isAddedToCart,
  onSelectedProduct,
  onHandleAsideViewClick,
}: Props): JSX.Element => {
  return (
    <>
      <Grid container justifyContent="space-between" spacing={2}>
        <Grid item xs={12} md={8}>
          {products?.map((product) => (
            <CheckoutProductListItem
              key={product.uuid}
              uuid={product.uuid}
              title={product.name}
              caption={getPriceCaption(product)}
              subscriptionFrequency={product.subscriptionFrequency}
              preSelected={product.subscribed}
              supplements={product.supplements}
              getCaption={getPriceCaption}
              handleSelectedOption={onSelectedProduct}
              handleAsideViewClick={(uuid, contentView) => {
                onHandleAsideViewClick(uuid, contentView)
              }}
              isAddedToCart={isAddedToCart}
            />
          ))}
        </Grid>
      </Grid>
    </>
  )
}

export default ProductListing
