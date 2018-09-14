using Shared.Services;

namespace LightHouse.Services
{
    class ServiceControl : ServiceBase
    {
        public ServiceControl() : base("MyCluster", "cluster.hocon", "ClusterMember")
        {
        }
    }
}
