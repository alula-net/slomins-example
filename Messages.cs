
public class HelixSubscribeMethod
{
    public HelixSubscribeMethod(string id)
    {
        deviceId = id;
    }

    public string deviceId { get; set; }
}

public class HelixSubscribeMsg
{
    public HelixSubscribeMsg(string deviceId)
    {
        subscribe = new HelixSubscribeMethod(deviceId);
    }
    public Guid id = Guid.NewGuid();

    public string channel = "device.helix";

    public HelixSubscribeMethod subscribe { get; set; }

}


public class HelixMfdMsg
{
    public HelixMfdMsg(string deviceId)
    {
        send = new HelixSendMethod(deviceId, new
        {

        });
    }
    public Guid id = Guid.NewGuid();

    public string channel = "device.helix";

    public HelixSendMethod send { get; set; }
}

public class HelixSendMethod
{
    public HelixSendMethod(string id, object data)
    {
        deviceId = id;
        payload = data;
    }

    public string cmdrsp = "cmdrsp";

    public string deviceId { get; set; }

    public Guid requestId = Guid.NewGuid();

    public object payload { get; set; }
}

public class HelixMfdPayload
{
    public HelixMfdPayload()
    {

    }
}