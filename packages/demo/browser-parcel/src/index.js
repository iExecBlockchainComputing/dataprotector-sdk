import { IExecDataProtector } from '@iexec/dataprotector';

const BELLECOUR_CHAIN_ID = 134;

const userAddressDiv = document.getElementById('user-address');
const chainIdDiv = document.getElementById('chain-id');
const testButton = document.getElementById('test-button');
const errorMessageDiv = document.getElementById('error-message');
const protectedDataAddressDiv = document.getElementById(
  'protected-data-address'
);

testButton.addEventListener('click', createProtectedData);

testButton.setAttribute('disabled', '');

checkConnectedWallet();

function checkConnectedWallet() {
  if (!window.ethereum) {
    setErrorMessage('Missing Ethereum provider. Please install Metamask.');
    return;
  }

  testButton.removeAttribute('disabled');
}

async function createProtectedData() {
  setErrorMessage('');
  protectedDataAddressDiv.innerText = '';

  // --- Check Metamask installed (or any other wallet compatible with iExec Bellecour blockchain)
  if (!window.ethereum) {
    setErrorMessage('Missing Ethereum provider. Please install Metamask.');
    return;
  }

  // --- Check user connected
  const accounts = await window.ethereum.request({
    method: 'eth_requestAccounts',
  });
  // @ts-ignore
  const userAddress = accounts?.[0];
  if (!userAddress) {
    setErrorMessage('Missing user address?');
    return;
  }
  userAddressDiv.innerText = `Connected with address: ${userAddress}`;

  // --- Check good network
  const chainId = await window.ethereum.request({ method: 'eth_chainId' });
  chainIdDiv.innerText = `Chain ID: ${String(Number(chainId))}`;
  if (Number(chainId) !== BELLECOUR_CHAIN_ID) {
    setErrorMessage('Invalid network, please switch to Bellecour network.');
    return;
  }

  testButton.setAttribute('disabled', '');

  const dataProtector = new IExecDataProtector(window.ethereum);

  try {
    await dataProtector.core.protectData({
      name: 'My personal data',
      data: {
        firstName: 'John',
        familyName: 'Doe',
        birthYear: 1971,
        usCitizen: true,
        avatar: new TextEncoder().encode(
          '<?xml version="1.0" standalone="no"?><svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="50" /></svg>'
        ),
      },
      onStatusUpdate: ({ title, isDone, payload }) => {
        console.log(title, { isDone });
        if (title === 'DEPLOY_PROTECTED_DATA' && isDone) {
          const protectedDataAddress = payload.address;
          protectedDataAddressDiv.innerHTML = `Protected data address:
  <pre style="display: inline-block"><code>${protectedDataAddress}</code></pre>
  <div style="margin-top: 8px">
    See in explorer: <a
      href="https://explorer.iex.ec/bellecour/dataset/${protectedDataAddress}"
      target="_blank" rel="noreferrer"
      style="text-decoration: underline"
    >
      https://bellecour.iex.ec/address/${protectedDataAddress}
    </a>
  </div>
  `;
        }
      },
    });
    console.log('DONE');
    testButton.removeAttribute('disabled');
  } catch (e) {
    console.log(e);
    errorMessageDiv.innerText = e.message;
    testButton.removeAttribute('disabled');
  }
}

function setErrorMessage(errorMessage) {
  errorMessageDiv.innerText = errorMessage;
}
