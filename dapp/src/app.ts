import start from './consumeContent';

start().catch((error) => {
  console.error(`Error: ${error.message}`);
  process.exit(1);
});
