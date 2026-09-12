import React from 'react'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface ErrorBoundaryProps {
  children: React.ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  message: string
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, message: '' }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, message: error.message || 'Something went wrong.' }
  }

  handleRetry = () => {
    this.setState({ hasError: false, message: '' })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center">
          <AlertTriangle size={28} className="mb-3 text-rose-500" />
          <p className="text-sm font-medium text-rose-700">Something went wrong rendering this view.</p>
          <p className="mt-1 text-xs text-rose-500">{this.state.message}</p>
          <Button size="sm" variant="danger" className="mt-4" onClick={this.handleRetry}>
            Retry
          </Button>
        </div>
      )
    }
    return this.props.children
  }
}