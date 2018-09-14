using System;
using Topshelf;

namespace Shared.Services
{
    public static class ServiceRunner
    {
        public static void Run<T>(Func<T> generator) where T : ServiceBase
        {
            var service = generator.Invoke();
            var rc = HostFactory.Run(x =>
            {
                x.Service<T>(s =>
                {
                    s.ConstructUsing(name => service);
                    s.WhenStarted((tc, hostControl) => {
                        tc.OnClusterShutdown += (sender, e) => hostControl.Stop();
                        return tc.Start();
                    });
                    s.WhenStopped(tc => tc.Stop());
                });
                x.RunAsLocalSystem();
                x.SetDescription(service.Description);
                x.SetDisplayName(service.ServiceName);
                x.SetServiceName(service.ServiceName);
            });

            var exitCode = (int)Convert.ChangeType(rc, rc.GetTypeCode());
            Environment.ExitCode = exitCode;
        }
    }
}
