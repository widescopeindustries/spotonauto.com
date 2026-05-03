"use client";

import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

export default class SceneErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.warn("3D scene failed to render:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="w-full h-full min-h-[300px] flex items-center justify-center bg-[#050507] rounded-2xl border border-white/5">
            <p className="text-sm text-[#6E6E80]">3D preview unavailable</p>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
