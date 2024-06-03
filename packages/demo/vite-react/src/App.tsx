import './App.css';
import { test } from './dataprotector';

function App() {
  return (
    <>
      <img
        alt="React logo"
        className="logo"
        src="/react.svg"
        width="100"
        height="100"
      />
      <div>
        <button
          onClick={() => {
            test().catch(console.log);
          }}
        >
          TEST
        </button>
        <p>Open the console to see logs</p>
      </div>
    </>
  );
}

export default App;
