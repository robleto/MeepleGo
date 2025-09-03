import type { Meta, StoryObj } from '@storybook/react'
import { AuthLayout } from './AuthLayout'

const meta: Meta<typeof AuthLayout> = {
  title: 'Components/Shared/AuthLayout',
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
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input 
            type="email" 
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" 
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <input 
            type="password" 
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" 
            placeholder="••••••••"
          />
        </div>
        <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors">
          Sign In
        </button>
      </form>
    ),
    footer: (
      <>
        Don't have an account? <a href="#" className="text-blue-600 hover:underline">Sign up</a>
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
          <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
          <input 
            type="text" 
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" 
            placeholder="John Doe"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input 
            type="email" 
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" 
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <input 
            type="password" 
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" 
            placeholder="••••••••"
          />
        </div>
        <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors">
          Create Account
        </button>
      </form>
    ),
    footer: (
      <>
        Already have an account? <a href="#" className="text-blue-600 hover:underline">Sign in</a>
      </>
    ),
  },
}

export const ResetPassword: Story = {
  args: {
    title: 'Reset your password',
    subtitle: 'Enter your email and we\'ll send you a reset link',
    children: (
      <form className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input 
            type="email" 
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" 
            placeholder="you@example.com"
          />
        </div>
        <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors">
          Send Reset Link
        </button>
      </form>
    ),
    footer: (
      <>
        Remember your password? <a href="#" className="text-blue-600 hover:underline">Sign in</a>
      </>
    ),
  },
}
