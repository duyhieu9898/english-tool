import type { Meta, StoryObj } from '@storybook/react-vite';
import { ButtonGallery } from './ButtonGallery';

const meta: Meta<typeof ButtonGallery> = {
  title: 'UI/ButtonGallery',
  component: ButtonGallery,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof ButtonGallery>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
