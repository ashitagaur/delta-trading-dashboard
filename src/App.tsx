import { Dashboard } from './components/Layout/Dashboard';
import { useWebSocketConnection } from './hooks/useWebSocketConnection';

function App() {
  useWebSocketConnection();
  return <Dashboard />;
}

export default App;
