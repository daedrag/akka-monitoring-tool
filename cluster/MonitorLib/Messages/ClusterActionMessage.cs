namespace MonitorLib.Messages
{
    class MemberIdentity
    {
        public int UniqueId { get; set; }
        public string Host { get; set; }
        public int Port { get; set; }
    }

    class ClusterActionMessage
    {
        public string Action { get; set; }
        public MemberIdentity Member { get; set; }
    }
}
