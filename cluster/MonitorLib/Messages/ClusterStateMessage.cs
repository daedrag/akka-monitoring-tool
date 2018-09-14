using static Akka.Cluster.ClusterEvent;

namespace MonitorLib.Messages
{
    class ClusterStateMessage
    {
        public virtual string Type { get; } = "ClusterState";
        public CurrentClusterState ClusterState { get; set; }
    }
}
