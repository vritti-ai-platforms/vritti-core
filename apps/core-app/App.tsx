import './global.css';
import { StatusBar } from 'expo-status-bar';
import { DeploymentSelectionScreen } from './src/screens/DeploymentSelectionScreen';

export default function App() {
  return (
    <>
      <StatusBar style="auto" />
      <DeploymentSelectionScreen />
    </>
  );
}
