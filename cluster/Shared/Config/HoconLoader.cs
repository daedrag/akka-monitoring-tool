using Akka.Configuration;
using System;
using System.IO;

namespace Shared.Config
{
    public static class HoconLoader
    {
        public static Akka.Configuration.Config ParseConfig(string hoconPath)
        {
            return ConfigurationFactory.ParseString(File.ReadAllText(hoconPath));
        }

        public static Akka.Configuration.Config WithPortFromEnvironmentVariable(this Akka.Configuration.Config clusterConfig)
        {
            var actualPort = -1;
            var envPort = Environment.GetEnvironmentVariable("CLUSTER_PORT")?.Trim();
            if (!string.IsNullOrEmpty(envPort))
            {
                int.TryParse(envPort, out actualPort);
            }

            if (actualPort != -1)
            {
                return ConfigurationFactory.ParseString($"akka.remote.dot-netty.tcp.port = {actualPort}")
                .WithFallback(clusterConfig);
            }

            return clusterConfig;
        }
    }
}
