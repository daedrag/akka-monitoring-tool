using System;

namespace MonitorLib
{
    class Compiled
    {
        private Type[] KeepDependencies()
        {
            return new[]
            {
                typeof(Microsoft.Owin.Host.HttpListener.OwinHttpListener)
            };
        }
    }
}
