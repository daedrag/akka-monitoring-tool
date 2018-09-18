using Akka.Actor;
using Microsoft.Owin.Hosting;
using MonitorLib.Actors;
using MonitorLib.Stores;
using System;

namespace MonitorLib
{
    public static class ClusterMonitoring
    {
        public class DisposableResult : IDisposable
        {
            private IDisposable _webApp;
            private ActorSystem _actorSystem;
            private IActorRef _watcher;

            public DisposableResult(IDisposable webApp, ActorSystem actorSystem, IActorRef watcher)
            {
                _webApp = webApp;
                _actorSystem = actorSystem;
                _watcher = watcher;
            }

            public void Dispose()
            {
                _webApp.Dispose();
                _actorSystem.Stop(_watcher);
            }
        }

        public static IDisposable Start(string url, ActorSystem actorSystem)
        {
            var watcher = actorSystem.ActorOf(ClusterHealthWatcher.Props(), "cluster-health-watcher");
            var webApp = WebApp.Start<Startup>(url);
            ClusterActionStore.BindToActorSystem(actorSystem);
            return new DisposableResult(webApp, actorSystem, watcher);
        }
    }
}
