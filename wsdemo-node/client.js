const EventEmitter = require("events");
const { v4: uuidv4 } = require("uuid");
const { w3cwebsocket: W3CWebSocket } = require("websocket");

// https://nodejs.org/api/events.html#class-eventemitter
class WebsocketClient extends EventEmitter {
  constructor(baseUrl, accessToken, ...opts) {
    super(...opts);
    this.baseUrl = baseUrl;
    this.accessToken = accessToken;
    this.setMaxListeners(Infinity);
    this.on("message", (e) => this.handleMessage(e));
  }

  // Parse message strings from the api into objects.
  handleMessage(event) {
    try {
      const data = JSON.parse(event.data);
      this.emit("data", data);
    } catch (err) {
      console.log("failed to parse message", event);
    }
  }

  // Send a message and wait for reply
  request(message = {}) {
    return new Promise((resolve, reject) => {
      // Generate a new id for every message if one is not provided
      if (!message.id) {
        message.id = uuidv4();
      }

      // If it is a helix request (send: cmdresp: requestMfd), generate
      // an addition requestId to track the response from the device instead.
      if (
        message.channel === "device.helix" &&
        message.send &&
        !message.send.requestId
      ) {
        message.send.requestId = uuidv4();
      }

      // If helix request, we want to wait for the response from the device
      if (message.channel === "device.helix" && message.send?.requestId) {
        this.on("data", handleHelixData.bind(this));
      }
      // Otherwise wait for the regular api response
      else {
        this.on("data", handleData.bind(this));
      }

      // Encode and send the message
      const data = JSON.stringify(message);
      this.client.send(data);
      this.emit("request", message);

      function handleHelixData(reply) {
        if (
          reply.channel === "device.helix" &&
          reply.event?.data?.requestId === message.send?.requestId
        ) {
          resolve(reply);
          this.off("data", handleHelixData); // cleanup internal subscription
        }
      }

      function handleData(reply) {
        if (reply.id === message.id) {
          resolve(reply);
          this.off("data", handleData); // cleanup internal subscription
        }
      }
    });
  }

  connect() {
    return new Promise((resolve, reject) => {
      // Setup a listener for the "ready" event
      this.on("data", handleReady.bind(this));

      // Establish the websocket
      const client = new W3CWebSocket(
        `${this.baseUrl}/ws/v1?access_token=${this.accessToken}`
      );

      this.client = client;

      client.onmessage = (e) => this.emit("message", e);
      client.onerror = (err) => {
        this.emit("error", err);
        reject(err);
      };

      client.onopen = () => this.emit("open");

      // If the access_token is not valid,
      // the websocket will be closed immediately but no error will be thrown
      client.onclose = () => this.emit("close");

      function handleReady(data) {
        if (data.channel === "*" && data.message === "ready") {
          resolve(data);
          this.off("data", handleReady);
        }
      }
    });
  }
}

module.exports = { WebsocketClient };
