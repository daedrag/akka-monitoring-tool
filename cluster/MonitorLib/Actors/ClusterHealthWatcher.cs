using Akka.Actor;
using Akka.Cluster;
using MonitorLib.Stores;
using System;

namespace MonitorLib.Actors
{
    class ClusterHealthWatcher : ReceiveActor
    {
        private ClusterEvent.CurrentClusterState CurrentClusterState => Cluster.Get(Context.System).State;

        public ClusterHealthWatcher()
        {
            Become(Ready);
        }

        protected override void PreStart()
        {
            Cluster.Get(Context.System).Subscribe(Self, new[] { typeof(ClusterEvent.IClusterDomainEvent) });
        }

        protected override void PostStop()
        {
            Cluster.Get(Context.System).Unsubscribe(Self);
        }

        private void Ready()
        {
            Receive<ClusterEvent.MemberRemoved>(m =>
            {
                ClusterHealthStore.Instance.NotifyMemberRemoved(CurrentClusterState, m.Member);
            });

            Receive<ClusterEvent.IClusterDomainEvent>(m =>
            {
                //Console.WriteLine(m);
                //Console.WriteLine(JsonConvert.ToString(m));
                //CurrentClusterState.Members
                //    .ToList()
                //    .ForEach(member => Console.WriteLine($">> {String.Join(", ", member.Roles.ToArray())}, {member.Status}"));
                ClusterHealthStore.Instance.NotifyNewCurrentState(CurrentClusterState);
            });

            Receive<ClusterEvent.CurrentClusterState>(m =>
            {
                ClusterHealthStore.Instance.NotifyNewCurrentState(m);
            });

            ReceiveAny(m =>
            {
                Console.WriteLine($"Unhandled message: {m}");
            });
        }

        public static Props Props()
        {
            return Akka.Actor.Props.Create(() => new ClusterHealthWatcher());
        }
    }
}
