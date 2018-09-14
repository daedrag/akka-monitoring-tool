using LightHouse.Services;
using Shared.Services;

namespace ClusterMember
{
    class Program
    {
        static void Main(string[] args)
        {
            ServiceRunner.Run(() => new ServiceControl());
        }
    }
}
