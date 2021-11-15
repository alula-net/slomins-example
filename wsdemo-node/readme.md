# Alula WS Example

## About

This is a small demo app to demonstrate interacting w/ an Alula device to get it's zone configurations.

The main logic for the program is implemented in [./index](./index.js) and a helper class [WebsocketClient](./client.js) is implemented in [./client](./client.js)

The purpose of this demonstration is to provide a high-level wrapper around the low-level "callback" based nature of the Helix protocol.

By allowing the user to `await client.request`, we can assign the responses to variables and make requests to the device in synchronous fashion.

## Setup

1. Install Node.js runtime (https://nodejs.org/en/)
1. Clone this repository
1. `$ cd ./wsdemo-node`
1. `$ npm install`
1. Open [./index](./index.js) and update lines 2 & 3 with an `accessToken` and `deviceId`.
1. `$ npm start`
