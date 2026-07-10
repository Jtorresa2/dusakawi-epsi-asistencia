import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 40, textAlign: "center", fontFamily: "monospace" }}>
          <h3 style={{ color: "#DC2626" }}>Error de renderizado</h3>
          <pre style={{ color: "#374151", fontSize: 13, whiteSpace: "pre-wrap" }}>
            {this.state.error.message}
          </pre>
          <pre style={{ color: "#6B7280", fontSize: 11, whiteSpace: "pre-wrap", marginTop: 16 }}>
            {this.state.error.stack}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}
