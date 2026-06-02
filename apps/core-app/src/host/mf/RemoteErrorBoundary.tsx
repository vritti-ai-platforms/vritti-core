import { Text } from '@vritti/quantum-ui-native/Text';
import React from 'react';
import { View } from 'react-native';

interface Props {
  remoteName: string;
  moduleName: string;
  children: React.ReactNode;
}

interface State {
  error: Error | null;
}

export class RemoteErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error('[RemoteErrorBoundary]', {
      remoteName: this.props.remoteName,
      moduleName: this.props.moduleName,
      message: error.message,
      stack: error.stack,
      componentStack: info.componentStack,
    });
  }

  render(): React.ReactNode {
    if (this.state.error) {
      return (
        <View style={{ padding: 16, gap: 8 }}>
          <Text style={{ fontWeight: '600', color: '#c00' }}>
            {this.props.remoteName}/{this.props.moduleName} failed
          </Text>
          <Text style={{ fontFamily: 'Menlo', fontSize: 12 }}>{this.state.error.message}</Text>
        </View>
      );
    }
    return this.props.children;
  }
}
