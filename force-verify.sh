#!/bin/bash

# Verifica si el archivo .env existe
if [ -f .env ]; then
  # Lee y carga las variables de entorno desde .env
  export $(cat .env | xargs)
  echo "Variables de entorno cargadas desde .env"

  # Hacer un echo de la variable DATABASE_URL
  echo "PRIVATE_KEY: $PRIVATE_KEY"
  echo "POLYGONSCAN_API_KEY: $POLYGONSCAN_API_KEY"
else
  echo "El archivo .env no existe en el directorio actual."
fi
retries=100
while [ $retries -gt 0 ]; do
  forge verify-contract --chain-id 137 --num-of-optimizations 200 --watch --constructor-args "$(cast abi-encode 'constructor(address,uint64,bytes32,uint32,address, address)' '0xae975071be8f8ee67addbc1a82488f1c24858067' 764 '0xd729dc84e21ae57ffb6be0053bf2b0668aa2aaf300a2a7b2ddf7dc0bb6e875a8' 2500000 '0x8105647Cf252f7d7BBf2B00b4834ef6A8eEDcBdA' '0x032F747C837A664005d54A57f65e135ca2Bda236')" --etherscan-api-key $POLYGONSCAN_API_KEY --compiler-version v0.8.17 0x91acb37eea86dd888ab38e87345f842035326c37 contracts/wav3s.sol:wav3s
  if [ $? -eq 0 ]; then
    echo "Verification succeeded!"
    break
  else
    echo "Verification failed, $retries retries left..."
    retries=$((retries-1))
    sleep 5  # Add a delay between retries if needed
  fi
done