import { useState } from 'react';
import './App.css';
import { createProtectedData } from './dataprotector';

function App() {
  const [isLoading, setIsLoading] = useState(false);

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
          disabled={isLoading}
          onClick={() => {
            setIsLoading(true);
            createProtectedData()
              .then(() => {
                setIsLoading(false);
                console.log('DONE');
              })
              .catch((err) => {
                setIsLoading(false);
                console.error(err);
              });
          }}
        >
          Create protected data
        </button>
        <p>Open the console to see logs</p>
      </div>
    </>
  );
}

export default App;
