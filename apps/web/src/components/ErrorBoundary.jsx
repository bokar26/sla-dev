import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  
  static getDerivedStateFromError(err) { 
    return { hasError: true, msg: err?.message || "Render error" }; 
  }
  
  componentDidCatch(error, info) { 
    console.error("UI ErrorBoundary:", error, info); 
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div className="m-4 rounded-lg border border-rose-300 bg-rose-50 text-rose-900 p-3 text-sm">
          Something went wrong rendering this section. {this.state.msg}
        </div>
      );
    }
    return this.props.children;
  }
}
