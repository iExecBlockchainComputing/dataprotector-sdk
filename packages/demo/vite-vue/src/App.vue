<script setup>
import { ref } from 'vue';
import { createProtectedData } from './dataprotector';

const isLoading = ref(false);

function protectData() {
  isLoading.value = true;
  createProtectedData()
    .then(() => {
      isLoading.value = false;
      console.log('DONE');
    })
    .catch((err) => {
      isLoading.value = false;
      console.error(err);
    });
}
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
      <button :disabled="isLoading" @click="protectData">
        Create protected data
      </button>
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
