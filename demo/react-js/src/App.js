import "./App.css";
import { IExecDataProtector } from "dataprotector-sdk";
import { useEffect } from "react";

// type ProtectedData = {
//   datasetChecksum: string;
//   datasetMultiaddr: string | Buffer;
//   datasetName: string;
//   owner: string;
//   schema: JSON;
// };

function App() {
  let iexecDataProtector = null;

  let ethProvider = null;
  const connection = async () => {
    if (window.ethereum) {
      console.log("using default provider");
      ethProvider = window.ethereum;
      ethProvider.on("chainChanged", (_chainId) =>
        window.location.reload()
      );
      ethProvider.on("accountsChanged", (_accounts) =>
        window.location.reload()
      );
      await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: "0x86",
            chainName: "iExec Sidechain",
            nativeCurrency: {
              name: "xRLC",
              symbol: "xRLC",
              decimals: 18,
            },
            rpcUrls: ["https://bellecour.iex.ec"],
            blockExplorerUrls: ["https://blockscout-bellecour.iex.ec"],
          },
        ],
      });
    } else {
      console.log("no provider");
    }
  };

  useEffect(() => {
    if (window.ethereum !== undefined) {
      iexecDataProtector = new IExecDataProtector(window.ethereum);
    }
  }, [ethProvider]);

  const testFetch = async () => {
    console.log("Wait for the creation of the CNFT... ! It's Loading... ");
    // const data: ProtectedData[] = await iexecDataProtector!.fetchProtectedData({
    //   requireSchema: {
    //     nom: "string",
    //     prenom: "string",
    //     pokerLicense: "string",
    //   },
    // });
    // data.map((d) => {
    //   console.log(d);
    // });
  };

  return (
    <div className="App">
      <header className="App-header">
        <button onClick={connection}>Connection</button>
        <br />
        <button onClick={testFetch}>testFetch</button>
        <br />
      </header>
    </div>
  );
}

export default App;
