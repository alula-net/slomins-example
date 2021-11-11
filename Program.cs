using System.Net.WebSockets;
using System.Text;
using Newtonsoft.Json;

string baseUrl = "wss://api.alula.net";
string accessToken = "<token>";
string uri = $"{baseUrl}/ws/v1/?access_token={accessToken}";
string deviceId = "<deviceId>";

// message.id -> sent message object
Dictionary<Guid, object> messageMap = new Dictionary<Guid, object>();
Dictionary<Guid, object> requestMap = new Dictionary<Guid, object>();

do
{
    using (var socket = new ClientWebSocket())
        try
        {
            Console.WriteLine($"connecting to {uri}");
            await socket.ConnectAsync(new Uri(uri), CancellationToken.None);

            HelixSubscribeMsg subscribeMsg = new HelixSubscribeMsg(deviceId);
            await SendSubscribe(socket, subscribeMsg);

            await ReceiveJson(socket);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"{ex.Message}\n{ex.StackTrace}");
        }
} while (true);

async Task SendSubscribe(ClientWebSocket socket, HelixSubscribeMsg msg)
{
    messageMap.Add(msg.id, msg);
    await SendJson(socket, msg);
}

async Task SendMFD(ClientWebSocket socket, HelixMfdMsg msg)
{
    messageMap.Add(msg.id, msg);
    requestMap.Add(msg.send.requestId, msg);
    await SendJson(socket, msg);
}

async Task SendJson(ClientWebSocket socket, dynamic obj)
{
    string data = JsonConvert.SerializeObject(obj);
    Console.WriteLine($"SEND - {data}");

    ArraySegment<byte> encoded = Encoding.UTF8.GetBytes(data);
    await socket.SendAsync(encoded, WebSocketMessageType.Text, true, CancellationToken.None);
}

async Task<object> ReceiveJson(ClientWebSocket socket)
{
    // buffer to accept 2kb of data at a time, until the message is finished.
    var buffer = new ArraySegment<byte>(new byte[2048]);
    do
    {
        WebSocketReceiveResult result;
        using (var ms = new MemoryStream())
        {
            do
            {
                result = await socket.ReceiveAsync(buffer, CancellationToken.None);
                ms.Write(buffer.Array!, buffer.Offset, result.Count);
            } while (!result.EndOfMessage);

            if (result.MessageType == WebSocketMessageType.Close)
                break;

            ms.Seek(0, SeekOrigin.Begin);
            using (var reader = new StreamReader(ms, Encoding.UTF8))
            {
                string data = await reader.ReadToEndAsync();
                dynamic obj = JsonConvert.DeserializeObject(data)!;
                Console.WriteLine(data);
                return obj;
            }
        }
    } while (true);
    return null!;
}