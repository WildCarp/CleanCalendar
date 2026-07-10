import React, { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] React 渲染错误:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex items-center justify-center h-full bg-cc-canvas p-8">
          <div className="max-w-md text-center">
            <div className="text-4xl mb-4">⚠️</div>
            <h1 className="text-h2 text-cc-text-primary mb-2">应用发生错误</h1>
            <p className="text-body text-cc-text-secondary mb-4">
              请尝试刷新页面。如果问题持续，请清除浏览器缓存。
            </p>
            <pre className="text-caption text-cc-error bg-cc-surface border border-cc-border-default rounded-cc-md p-3 mb-4 text-left overflow-auto max-h-[200px] whitespace-pre-wrap">
              {this.state.error?.message || '未知错误'}
            </pre>
            <button
              className="px-4 py-2 bg-cc-accent text-white rounded-cc-md cursor-pointer text-body-em hover:bg-cc-accent-hover transition-colors"
              onClick={this.handleReset}
            >
              重试
            </button>
            <button
              className="ml-2 px-4 py-2 bg-cc-surface text-cc-text-secondary border border-cc-border-default rounded-cc-md cursor-pointer text-body-em hover:bg-cc-surface-hover transition-colors"
              onClick={() => window.location.reload()}
            >
              刷新页面
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}