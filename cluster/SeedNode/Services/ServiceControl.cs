using Shared.Services;
using System;

namespace SeedNode.Services
{
    class ServiceControl : ServiceBase
    {
        private IDisposable monitorApp;

        public ServiceControl() : base("MyCluster", "cluster.hocon", "SeedNode")
        {
        }

        public override void PreStart()
        {
            base.PreStart();
        }

        public override void PostStart()
        {
            base.PostStart();
            // This will *ONLY* bind to localhost, if you want to bind to all addresses
            // use http://*:8080 or http://+:8080 to bind to all addresses. 
            // See http://msdn.microsoft.com/en-us/library/system.net.httplistener.aspx 
            // for more information.
            const string hostUrl = "http://localhost:8080/";
            monitorApp = MonitorLib.ClusterMonitoring.Start(hostUrl, ClusterSystem);
            Console.WriteLine($"Web app is running at {hostUrl}");
        }

        public override void PreStop()
        {
            base.PreStop();
        }

        public override void PostStop()
        {
            base.PostStop();
            monitorApp?.Dispose();
            Console.WriteLine($"Monitor app is disposed");
        }
    }
}
