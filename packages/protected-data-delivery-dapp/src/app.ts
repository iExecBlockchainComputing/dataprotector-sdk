import start from './consumeContent.js';

start().catch((error) => {
  console.error(`Error: ${error.message}`);
  process.exit(1);
});
