using MonitorLib.Stores;
using Owin.WebSocket;
using System;
using System.Net.WebSockets;
using System.Text;
using System.Threading.Tasks;

namespace MonitorLib.Sockets
{
    class WebSocket : WebSocketConnection, IObserver<string>
    {
        private IDisposable subscription;

        public override Task OnMessageReceived(ArraySegment<byte> message, WebSocketMessageType type)
        {
            // JSON serialization from the client
            var json = Encoding.UTF8.GetString(message.Array, message.Offset, message.Count);

            // TODO: Use something like Json.Net to read the json
            Console.WriteLine($"Data from client: {json}");

            return Task.CompletedTask;
        }

        public override void OnOpen()
        {
            if (subscription != null)
            {
                subscription.Dispose();
                subscription = null;
            }

            Console.WriteLine($"Socket opened, subscribing to cluster state...");
            subscription = ClusterHealthStore.Instance.CurrentStateObservable.Subscribe(this);
        }

        public override void OnClose(WebSocketCloseStatus? closeStatus, string closeStatusDescription)
        {
            Console.WriteLine($"Socket closed: {closeStatusDescription}, status={closeStatus}");
            if (subscription != null)
            {
                subscription.Dispose();
                subscription = null;
            }
        }

        public void OnNext(string value)
        {
            if (string.IsNullOrWhiteSpace(value)) return;

            //Console.WriteLine($">> Socket sends: {value}");
            var bytes = Encoding.UTF8.GetBytes(value);
            SendText(bytes, true);
        }

        public void OnError(Exception error)
        {
            // TODO
        }

        public void OnCompleted()
        {
            // TODO
        }
    }
}
