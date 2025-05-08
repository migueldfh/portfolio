import type { Meta, StoryObj } from '@storybook/react'
import CalendarEventListItem from 'view/components/organisms/CalendarEventListItem'
import { CalendarEventStatus } from '../@types/generated/graphql'
import { createMockCalendarEvent } from 'fixtures/factory/createCalendarEvent'
import { DateFormatter } from 'utils/dateUtils'
import { userEvent, within, screen } from '@storybook/testing-library'
import { expect } from '@storybook/jest'

const startDate = new Date('04/24/2023 06:00 pm')
const endDate = new Date('04/24/2023 06:30 pm')

const event = createMockCalendarEvent({
  startTime: startDate,
  endTime: endDate,
  status: CalendarEventStatus.Created,
})

const eventLongDescription = createMockCalendarEvent({
  startTime: startDate,
  endTime: endDate,
  status: CalendarEventStatus.Created,
  description:
    'This is a very long description, Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book.',
})

const eventCreated = createMockCalendarEvent({
  status: CalendarEventStatus.Completed,
})

const meta: Meta<typeof CalendarEventListItem> = {
  // Creating the Test object
  title: 'organisms/CalendarEventListItem',
  component: CalendarEventListItem,
}
export default meta
type Story = StoryObj<typeof CalendarEventListItem>

export const ScheduledCalendarEvent: Story = {
  args: {
    calendarEvent: event,
  },
  render: (args) => <CalendarEventListItem {...args} />,
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement)
    const formattedUpdateTime = DateFormatter(
      args.calendarEvent.lastUpdatedTimestamp
    ) as string
    const description = args.calendarEvent.description as string

    void expect(canvas.getByText(args.calendarEvent.name)).toBeInTheDocument()
    void expect(
      canvas.getByText(`Created: ${formattedUpdateTime}`)
    ).toBeInTheDocument()
    void expect(
      canvas.getByLabelText('Open Options Menu Button')
    ).toBeInTheDocument()
    void expect(canvas.getByText(description)).toBeInTheDocument()
    void expect(canvas.getByLabelText('Start Time Input')).toBeInTheDocument()
    void expect(canvas.getByLabelText('End Time Input')).toBeInTheDocument()
    void expect(
      canvas.queryByLabelText('Event was completed')
    ).not.toBeInTheDocument()

    await userEvent.click(screen.getByLabelText('Start Time Input'))
    void expect(screen.getByText('Select date & time')).toBeInTheDocument()

    await userEvent.click(screen.getByLabelText('Start Time Input'))
    let pickerEl = within(screen.getByRole('dialog'))
    await userEvent.click(pickerEl.getByText('25'))
    await userEvent.click(pickerEl.getByText('OK'))
    void expect(args.onChangeEventStartTime).toHaveBeenCalled()

    await userEvent.click(screen.getByLabelText('End Time Input'))
    pickerEl = within(screen.getByRole('dialog'))
    await userEvent.click(pickerEl.getByText('25'))
    await userEvent.click(pickerEl.getByText('OK'))
    void expect(args.onChangeEventEndTime).toHaveBeenCalled()
  },
}

export const CompletedCalendarEvent: Story = {
  args: {
    calendarEvent: eventCreated,
  },
  render: (args) => <CalendarEventListItem {...args} />,
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement)

    void expect(
      canvas.getByLabelText('Event was completed')
    ).toBeInTheDocument()
  },
}

export const EventTruncatedDescription: Story = {
  args: {
    calendarEvent: eventLongDescription,
  },
  render: (args) => <CalendarEventListItem {...args} />,
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement)
    const eventDescription = args.calendarEvent.description as string

    const visibleDescription = canvas.getByTestId(
      'calendareventlistitem-description'
    ).innerText.length

    // 200 characters max length + 13 of blank spaces and ... read more button
    void expect(visibleDescription).toBe(213)

    void expect(canvas.queryByText(eventDescription)).not.toBeInTheDocument()
    void expect(
      canvas.getByTestId('toggle-description-length')
    ).toBeInTheDocument()
    void expect(
      canvas.getByTestId('toggle-description-length')
    ).toHaveTextContent('... read more')
    await userEvent.click(canvas.getByTestId('toggle-description-length'))

    const fullDescription = screen.getByTestId(
      'calendareventlistitem-description'
    ).innerText.length
    void expect(fullDescription).toBeGreaterThanOrEqual(213)

    void expect(canvas.queryByText(eventDescription)).toBeInTheDocument()
    void expect(
      canvas.getByTestId('toggle-description-length')
    ).toBeInTheDocument()
    void expect(
      canvas.getByTestId('toggle-description-length')
    ).toHaveTextContent('read less')

    await userEvent.click(canvas.getByTestId('toggle-description-length'))
    void expect(canvas.queryByText(eventDescription)).not.toBeInTheDocument()
  },
}
