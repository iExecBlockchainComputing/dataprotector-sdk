import { useState } from 'react';
import { createProtectedData } from './dataprotector.js';

const App = () => {
  const [isLoading, setIsLoading] = useState(false);

  return (
    <div style={{ textAlign: 'center' }}>
      <h1>
        dataprotector-sdk with
        <br />
        Create React App (JS)
      </h1>
      <div style={{ marginTop: '20px' }}>
        <img src="/logo192.png" width="100" alt="React logo" />
      </div>
      <button
        style={{ marginTop: '20px' }}
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
  );
};

export default App;
