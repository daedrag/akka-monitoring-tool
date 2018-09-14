using Akka.Cluster;

namespace MonitorLib.Messages
{
    class MemberRemovedMessage : ClusterStateMessage
    {
        public override string Type { get; } = "MemberRemoved";
        public Member MemberRemoved { get; set; }
    }
}
