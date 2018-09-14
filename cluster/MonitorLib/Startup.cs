using MonitorLib.Sockets;
using Owin;
using Owin.WebSocket.Extensions;

namespace MonitorLib
{
    class Startup
    {
        public void Configuration(IAppBuilder app)
        {
            app.MapWebSocketRoute<WebSocket>("/ws");
        }
    }
}
