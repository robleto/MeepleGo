import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { AuthLayout } from './AuthLayout'
import { TextInput } from '../Controls'

const meta: Meta<typeof AuthLayout> = {
  title: 'Components/AuthLayout',
  component: AuthLayout,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

export const Login: Story = {
  args: {
    title: 'Sign in to your account',
    subtitle: 'Welcome back! Please sign in to continue',
    children: (
      <form className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Email
          </label>
          <TextInput
            type="email"
            placeholder="you@example.com"
            hasLabel={true}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Password
          </label>
          <TextInput type="password" placeholder="••••••••" hasLabel={true} />
        </div>
        <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors">
          Sign In
        </button>
      </form>
    ),
    footer: (
      <>
        Don't have an account?{' '}
        <a href="#" className="text-blue-600 hover:underline">
          Sign up
        </a>
      </>
    ),
  },
}

export const Signup: Story = {
  args: {
    title: 'Create your account',
    subtitle: 'Join MeepleGo to track your board game collection',
    children: (
      <form className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Full Name
          </label>
          <TextInput type="text" placeholder="John Doe" hasLabel={true} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Email
          </label>
          <TextInput
            type="email"
            placeholder="you@example.com"
            hasLabel={true}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Password
          </label>
          <TextInput type="password" placeholder="••••••••" hasLabel={true} />
        </div>
        <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors">
          Create Account
        </button>
      </form>
    ),
    footer: (
      <>
        Already have an account?{' '}
        <a href="#" className="text-blue-600 hover:underline">
          Sign in
        </a>
      </>
    ),
  },
}

export const ResetPassword: Story = {
  args: {
    title: 'Reset your password',
    subtitle: "Enter your email and we'll send you a reset link",
    children: (
      <form className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Email
          </label>
          <TextInput
            type="email"
            placeholder="you@example.com"
            hasLabel={true}
          />
        </div>
        <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors">
          Send Reset Link
        </button>
      </form>
    ),
    footer: (
      <>
        Remember your password?{' '}
        <a href="#" className="text-blue-600 hover:underline">
          Sign in
        </a>
      </>
    ),
  },
}
