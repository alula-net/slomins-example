const { WebsocketClient } = require("./client");
const token = "accessToken";
const deviceId = "deviceId";
const baseUrl = "wss://api.alulaprod.com";

main().catch((err) => console.log(err));

async function main() {
  const socket = new WebsocketClient(baseUrl, token);

  socket.on("close", () => {
    console.log("socket closed by server.");
    process.exit(1);
  });

  // Connect to the socket and wait for message: 'ready'
  await socket.connect();

  // Establish a communication path to the device
  await socket.request({
    channel: "device.helix",
    subscribe: { deviceId: deviceId },
  });

  // Get the highestUsedIndexes so we know how many zones to request
  const highestUsedIndexes = await socket.request({
    channel: "device.helix",
    send: {
      cmdrsp: "requestMfd",
      deviceId: deviceId,
      payload: [{ name: "highestUsedIndexes" }],
    },
  });

  const highestUsed = highestUsedIndexes.event.data.payload[0].value;

  // Create a collection of zones to fill up
  const zoneConfigs = [];

  // Request a list of zones, 3 per "page"
  const itemsPerCall = 3;
  for (let i = 0; i < highestUsed.zoneIndex; i += itemsPerCall) {
    const resp = await socket.request({
      channel: "device.helix",
      send: {
        cmdrsp: "requestMfd",
        deviceId: deviceId,
        payload: [
          {
            name: "zoneConfiguration",
            indexFirst: i,
            indexLast: i + itemsPerCall,
          },
        ],
      },
    });
    const configs = resp.event.data.payload[0].items;
    zoneConfigs.push(...configs);
  }

  // Filter out zones which are populated (zone.id > 0)
  const populatedZoneConfigs = zoneConfigs.filter((c) => c.value.id > 0);
  console.log(populatedZoneConfigs);
  process.exit(0);
}
