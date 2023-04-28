<script setup>
import HelloWorld from './components/HelloWorld.vue';
import TheWelcome from './components/TheWelcome.vue';
import { IExecDataProtector } from 'dataprotector-sdk';
let iexecDataProtector = null;

let ethProvider = null;
const connection = async () => {
  if (window.ethereum) {
    console.log('using default provider');
    ethProvider = window.ethereum;
    ethProvider.on('chainChanged', (_chainId) => window.location.reload());
    ethProvider.on('accountsChanged', (_accounts) => window.location.reload());
    await window.ethereum.request({
      method: 'eth_requestAccounts',
    });
    window.ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [
        {
          chainId: '0x86',
          chainName: 'iExec Sidechain',
          nativeCurrency: {
            name: 'xRLC',
            symbol: 'xRLC',
            decimals: 18,
          },
          rpcUrls: ['https://bellecour.iex.ec'],
          blockExplorerUrls: ['https://blockscout-bellecour.iex.ec'],
        },
      ],
    });
  } else {
    console.log('no provider');
  }
};
connection();
iexecDataProtector = new IExecDataProtector(window.ethereum);
</script>

<template>
  <header>
    <img
      alt="Vue logo"
      class="logo"
      src="./assets/logo.svg"
      width="125"
      height="125"
    />

    <div class="wrapper">
      <HelloWorld msg="You did it!" />
    </div>
  </header>
</template>

<style scoped>
header {
  line-height: 1.5;
}

.logo {
  display: block;
  margin: 0 auto 2rem;
}

@media (min-width: 1024px) {
  header {
    display: flex;
    place-items: center;
    padding-right: calc(var(--section-gap) / 2);
  }

  .logo {
    margin: 0 2rem 0 0;
  }

  header .wrapper {
    display: flex;
    place-items: flex-start;
    flex-wrap: wrap;
  }
}
</style>
