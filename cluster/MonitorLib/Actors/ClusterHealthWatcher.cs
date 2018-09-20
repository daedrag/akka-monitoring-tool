using Akka.Actor;
using Akka.Cluster;
using MonitorLib.Stores;
using System;

namespace MonitorLib.Actors
{
    class ClusterHealthWatcher : ReceiveActor
    {
        private int _recheckCount = 1;
        private readonly int _recheckLimit = 3;
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
                ClearRecheckEvent();
                ClusterHealthStore.Instance.NotifyMemberRemoved(CurrentClusterState, m.Member);
                StartRecheckEvent();
            });

            Receive<ClusterEvent.IClusterDomainEvent>(m =>
            {
                ClearRecheckEvent();
                ClusterHealthStore.Instance.NotifyNewCurrentState(CurrentClusterState);
                StartRecheckEvent();
            });

            Receive<ClusterEvent.CurrentClusterState>(m =>
            {
                ClearRecheckEvent();
                ClusterHealthStore.Instance.NotifyNewCurrentState(m);
                StartRecheckEvent();
            });

            Receive<ReceiveTimeout>(t =>
            {
                if (IsRecheckReachedLimit()) return;
                ClusterHealthStore.Instance.NotifyNewCurrentState(CurrentClusterState);
                StartNextRecheckEvent();
            });

            ReceiveAny(m =>
            {
                Console.WriteLine($"Unhandled message: {m}");
            });
        }

        private bool IsRecheckReachedLimit()
        {
            return _recheckCount >= _recheckLimit;
        }

        private void ClearRecheckEvent()
        {
            SetReceiveTimeout(null);
        }

        private void StartRecheckEvent()
        {
            _recheckCount = 1;
            SetReceiveTimeout(TimeSpan.FromSeconds(_recheckCount));
        }

        private void StartNextRecheckEvent()
        {
            _recheckCount++;
            SetReceiveTimeout(TimeSpan.FromSeconds(_recheckCount));
        }

        public static Props Props()
        {
            return Akka.Actor.Props.Create(() => new ClusterHealthWatcher());
        }
    }
}
