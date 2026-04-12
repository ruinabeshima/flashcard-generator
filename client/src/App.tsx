import { useAuth } from "./lib/useAuth";
import routes from "./routes";

function App() {
  const { isLoaded } = useAuth();

  return <div data-auth-loaded={isLoaded}>{routes}</div>;
}

export default App;
