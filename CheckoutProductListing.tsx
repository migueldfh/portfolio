import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Checkbox,
  Chip,
  Grid,
  Link,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
} from '@mui/material'
import { type Product } from 'models/Product'
import { capitalize } from 'lodash'
import { ProductInterval } from '../../../@types/generated/graphql'

const contentType = ['overview', 'contract', 'highlights']
export type ContentType = (typeof contentType)[number]

interface Props {
  uuid: string
  title: string
  caption: string
  subscriptionFrequency?: ProductInterval
  preSelected: boolean
  supplements?: Product[]
  disablePreselectedItems?: boolean
  getCaption: (product: Product) => string
  isAddedToCart: (itemUUID: string) => boolean
  handleSelectedOption: (productUUID: string) => void
  handleAsideViewClick: (productUuid: string, contentView: ContentType) => void
}

const CheckoutProductListItem = ({
  uuid,
  title,
  caption,
  subscriptionFrequency,
  preSelected = false,
  supplements,
  disablePreselectedItems = true,
  getCaption,
  handleSelectedOption,
  handleAsideViewClick,
  isAddedToCart,
}: Props): JSX.Element => {
  return (
    <Accordion
      key={uuid}
      square
      elevation={0}
      expanded={preSelected || isAddedToCart(uuid)}
      sx={{
        border: 'none',
        '& .MuiAccordionSummary-expandIconWrapper': {
          transition: 'none',
          '&.Mui-expanded': {
            transform: 'none',
          },
        },
        '&:before': {
          display: 'none',
        },
        mb: 3,
      }}
    >
      <Box sx={{ display: 'flex' }}>
        <AccordionSummary
          expandIcon={
            <Checkbox
              checked={preSelected || isAddedToCart(uuid)}
              disabled={preSelected && disablePreselectedItems}
              onChange={(e) => {
                handleSelectedOption(uuid)
              }}
              sx={{
                '& .MuiSvgIcon-root': {
                  height: 24,
                  width: 24,
                  color: 'primary.dark',
                },
                '&.Mui-disabled': {
                  '& .MuiSvgIcon-root': {
                    color: 'grey.400',
                  },
                },
              }}
            />
          }
          sx={{ flexGrow: 1, flexDirection: 'row-reverse' }}
        >
          <Grid container item xs={12} md={12}>
            <Grid item xs={8}>
              <Typography variant="h4">{title}</Typography>
              <Typography variant="caption">{`(+ ${caption}) `}</Typography>
              {contentType.map((view) => (
                <Link
                  key={view}
                  onClick={() => {
                    handleAsideViewClick(uuid, view)
                  }}
                  sx={{ pr: 2 }}
                >
                  {capitalize(view)}
                </Link>
              ))}
            </Grid>
            <Grid item xs={4}>
              {subscriptionFrequency !== undefined && (
                <Chip
                  label={`Subscribed ${
                    subscriptionFrequency === ProductInterval.Month
                      ? 'monthly'
                      : subscriptionFrequency === ProductInterval.Year
                      ? 'yearly'
                      : ''
                  }`}
                  size="small"
                  color={'primary'}
                  variant="filled"
                />
              )}
            </Grid>
          </Grid>
        </AccordionSummary>
      </Box>
      <AccordionDetails>
        <List disablePadding dense>
          {supplements !== undefined
            ? supplements.map(
                (supplement) =>
                  supplement.uuid !== undefined && (
                    <ListItem key={supplement.uuid} disablePadding>
                      <ListItemButton>
                        <ListItemIcon>
                          <Checkbox
                            disabled={
                              supplement.subscribed && disablePreselectedItems
                            }
                            checked={
                              isAddedToCart(supplement.uuid) ||
                              supplement.subscribed
                            }
                            onClick={() => {
                              handleSelectedOption(supplement.uuid)
                            }}
                            tabIndex={-1}
                            disableRipple
                            inputProps={{
                              'aria-labelledby': supplement.uuid,
                            }}
                            sx={{
                              '& .MuiSvgIcon-root': {
                                height: 24,
                                width: 24,
                                color: 'primary.dark',
                              },
                              '&.Mui-disabled': {
                                '& .MuiSvgIcon-root': {
                                  color: 'grey.400',
                                },
                              },
                            }}
                          />
                        </ListItemIcon>
                        <ListItemText
                          id={supplement.uuid}
                          primary={
                            <>
                              <Typography variant="h6">
                                {supplement.name}
                              </Typography>
                              <Typography variant="caption">{`(+ ${getCaption(
                                supplement
                              )}) `}</Typography>
                              <Link
                                onClick={() => {
                                  handleAsideViewClick(
                                    supplement.uuid,
                                    'overview'
                                  )
                                }}
                              >
                                Overview
                              </Link>{' '}
                              |{' '}
                              <Link
                                onClick={() => {
                                  handleAsideViewClick(
                                    supplement.uuid,
                                    'contract'
                                  )
                                }}
                              >
                                Contract
                              </Link>
                            </>
                          }
                        />
                      </ListItemButton>
                    </ListItem>
                  )
              )
            : 'No supplements found'}
        </List>
      </AccordionDetails>
    </Accordion>
  )
}

export default CheckoutProductListItem
