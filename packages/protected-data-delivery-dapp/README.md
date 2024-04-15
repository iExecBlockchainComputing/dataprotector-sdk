## Protected-data-delivery-dapp

This sub repo contains the following architecture :

```
.
├── deployment
├── src
└── tests
```

### Deployment

This sub repo use node v18. It contains all the necessary scripts in order to deploy the dapp.

### Src & Tests

`src` folder contains the code of the Dapp.
`tests`folder contains the units tests for the Dapp.

Node v14 is to be used: **Scone** does not seem to support any higher version.

### Run Tests

Run the following command :

```
npm run test
```

#### Running the Dapp locally using Node

1. **Create local directories**: In your terminal, execute the following commands to create two local directories on your machine:

   ```
   mkdir -p ./tmp/iexec_in ./tmp/iexec_out
   ```

2. **Prepare your data**: Place the `protectedData.zip` file (from `./tests/_test_inputs_/protectedData.zip`) inside the `./tmp/iexec_in` directory that you just created in step 1. This zip contains a file named `file` that will be delivered by the app. If you want, you can set your own zip but it should contains a file named `file` because it this one that will be delivered.

   You should create an `.env` file according to the `.env.override` and complete it. A possible example here could be :

   ```
   IEXEC_IN=./tmp/iexec_in/
   IEXEC_OUT=./tmp/iexec_out/
   IEXEC_DATASET_FILENAME="protectedData.zip"
   ```

3. **Run the Node script**: Execute the following command to run the
   Docker container and execute the Dapp:

   ```
   npm run start-local
   ```

After running the Docker container, you can find the result of the Dapp's execution in the `./tmp/iexec_out` directory on your machine.

#### Running the Dapp locally using Docker

1. **Build the Docker image**: Navigate to the `packages/protected-data-delivery-dapp` directory of the project and run the following command to build the Docker image:

   ```
   docker build . --tag protected-data-delivery-dapp
   ```

2. **Create local directories**: In your terminal, execute the following commands to create two local directories on your machine:

   ```
   mkdir -p ./tmp/iexec_in ./tmp/iexec_out
   ```

3. **Prepare your data**: Place the `protectedData.zip` file (from `./tests/_test_inputs_/protectedData.zip`) inside the `./tmp/iexec_in` directory that you just created in step 1. This zip contains a file named `file` that will be delivered by the app. If you want, you can set your own zip but it should contains a file named `file` because it this one that will be delivered.

4. **Run the Docker container**: Execute the following command to run the
   Docker container and execute the Dapp:

   ```
   docker run --rm \
       -v ./tmp/iexec_in:/iexec_in \
       -v ./tmp/iexec_out:/iexec_out \
       -e IEXEC_IN=/iexec_in \
       -e IEXEC_OUT=/iexec_out \
       -e IEXEC_DATASET_FILENAME=protectedData.zip \
       protected-data-delivery-dapp
   ```

After running the Docker container, you can find the result of the Dapp's execution in the `/tmp/iexec_out` directory on your machine.
