using MonitorLib.Messages;
using MonitorLib.Stores;
using Newtonsoft.Json;
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
            return Task.Run(() =>
            {
                // JSON serialization from the client
                var json = Encoding.UTF8.GetString(message.Array, message.Offset, message.Count);

                try
                {
                    var actionMessage = JsonConvert.DeserializeObject<ClusterActionMessage>(json);
                    ClusterActionStore.Instance.ExecuteAction(actionMessage);
                }
                catch (Exception e)
                {
                    // TODO
                }
            });
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
