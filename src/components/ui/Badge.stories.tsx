import type { Meta, StoryObj } from '@storybook/react-vite';
import { Badge } from './Badge';

const meta: Meta<typeof Badge> = {
  title: 'UI/Badge',
  component: Badge,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    color: {
      control: 'select',
      options: ['white', 'blue', 'green', 'red', 'yellow', 'teal'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md'],
    },
    shadow: {
      control: 'boolean',
    },
    className: {
      control: 'text',
    },
  },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'Badge',
    color: 'white',
    size: 'md',
  },
};

export const Blue: Story = {
  args: {
    children: 'Blue Badge',
    color: 'blue',
  },
};

export const Green: Story = {
  args: {
    children: 'Green Badge',
    color: 'green',
  },
};

export const Red: Story = {
  args: {
    children: 'Red Badge',
    color: 'red',
  },
};

export const Yellow: Story = {
  args: {
    children: 'Yellow Badge',
    color: 'yellow',
  },
};

export const Teal: Story = {
  args: {
    children: 'Teal Badge',
    color: 'teal',
  },
};

export const Small: Story = {
  args: {
    children: 'Small Badge',
    color: 'white',
    size: 'sm',
  },
};

export const Medium: Story = {
  args: {
    children: 'Medium Badge',
    color: 'white',
    size: 'md',
  },
};
export const NoShadow: Story = {
  args: {
    children: 'No Shadow',
    color: 'white',
    shadow: false,
  },
};
