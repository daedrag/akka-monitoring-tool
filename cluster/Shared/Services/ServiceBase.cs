using Akka.Actor;
using Akka.Cluster;
using Shared.Config;
using System;

namespace Shared.Services
{
    public abstract class ServiceBase
    {
        public string ServiceName { get; }
        public string Description { get; }

        public string ClusterName { get; }
        public string HoconPath { get; }
        public ActorSystem ClusterSystem { get; private set; }
        public Akka.Configuration.Config ClusterConfig { get; private set; }

        public event EventHandler OnClusterShutdown;
        private bool isShuttingDown;

        public ServiceBase(string clusterName, string hoconPath, string serviceName, string description = null)
        {
            ServiceName = serviceName;
            Description = description ?? string.Empty;
            ClusterName = clusterName;
            HoconPath = hoconPath;
        }

        public bool Start()
        {
            PreStart();
            // create actor system
            ClusterConfig = HoconLoader.ParseConfig(HoconPath).WithPortFromEnvironmentVariable();
            ClusterSystem = ActorSystem.Create(ClusterName, ClusterConfig);

            var cluster = Cluster.Get(ClusterSystem);
            // call PostStart only after joined cluster successfully
            cluster.RegisterOnMemberUp(() => PostStart());
            // aggressive solution: call Stop immediately when left cluster
            cluster.RegisterOnMemberRemoved(() => {
                Console.WriteLine($"Current member is removed from cluster, member info: {cluster.SelfMember}");
                Stop();
            });
            return true;
        }

        public virtual void PreStart()
        {
            Console.WriteLine($"PreStart: {ServiceName} running...");
        }
        public virtual void PostStart()
        {
            Console.WriteLine($"PostStart: {ServiceName} running...");
        }

        public bool Stop()
        {
            // add check if Stop has already been called by MemberRemoved
            if (isShuttingDown) return true;
            isShuttingDown = true;

            PreStop();

            // trigger coordinated shutdown before calling PostStop
            Console.WriteLine("Coordinated shutdown starting...");
            CoordinatedShutdown.Get(ClusterSystem)
                .Run(CoordinatedShutdown.ClrExitReason.Instance)
                .ContinueWith(t => PostStop())  // call PostStop after shutdown successfully
                .ContinueWith(t => NotifyClusterShutdown())  // notify for topself stop
                .Wait();
            return true;
        }

        public virtual void PreStop()
        {
            Console.WriteLine($"PreStop: {ServiceName} running...");
        }
        public virtual void PostStop()
        {
            Console.WriteLine($"PostStop: {ServiceName} running...");
        }

        private void NotifyClusterShutdown()
        {
            OnClusterShutdown?.Invoke(this, null);
        }
    }
}
