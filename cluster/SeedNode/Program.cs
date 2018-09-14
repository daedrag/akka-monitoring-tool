using SeedNode.Services;
using Shared.Services;

namespace SeedNode
{
    class Program
    {
        static void Main(string[] args)
        {
            ServiceRunner.Run(() => new ServiceControl());
        }
    }
}
