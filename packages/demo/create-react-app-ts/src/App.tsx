import { createProtectedData } from './dataprotector';

const App = () => {
  return (
    <div style={{ textAlign: 'center' }}>
      <h1>
        dataprotector-sdk with
        <br />
        Create React App (TypeScript)
      </h1>
      <div style={{ marginTop: '20px' }}>
        <img src="/logo192.png" width="100" alt="React logo" />
      </div>
      <button
        style={{ marginTop: '20px' }}
        onClick={() => {
          createProtectedData().catch(console.log);
        }}
      >
        Create protected data
      </button>
      <p>Open the console to see logs</p>
    </div>
  );
};

export default App;
