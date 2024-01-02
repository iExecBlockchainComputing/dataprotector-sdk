function start() {
  return Promise.resolve('Done');
}

console.log('process.env.IEXEC_IN', process.env.IEXEC_IN);
console.log('process.env.IEXEC_OUT', process.env.IEXEC_OUT);

start()
  .then(() => {
    console.log('Done');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error', error.message);
    process.exit(1);
  });
