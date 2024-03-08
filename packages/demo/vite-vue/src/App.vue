<script setup>
import { protectData } from './dataprotector';
</script>

<template>
  <div>
    <img
      alt="Vue logo"
      class="logo"
      src="./assets/logo.svg"
      width="100"
      height="100"
    />
    <div>
      <button @click="protectData">Create protected data</button>
      <p>Open the console to see logs</p>
    </div>
  </div>
</template>

<style scoped>
.logo {
  display: block;
  margin: 0 auto 2rem;
}
</style>
