const main = () => {
  return Promise.resolve('Done');
};

main().catch((e) => {
  console.log(e);
  process.exit(1);
});
