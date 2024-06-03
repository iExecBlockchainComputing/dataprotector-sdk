<script setup>
import { test } from './dataprotector';
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
      <button @click="test">TEST</button>
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
