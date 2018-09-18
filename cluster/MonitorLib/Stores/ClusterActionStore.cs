using Akka.Actor;
using Akka.Cluster;
using MonitorLib.Messages;
using System;
using System.Collections.Generic;

namespace MonitorLib.Stores
{
    class ClusterActionStore
    {
        // TODO: Need redesign. 
        // I decided this way because seems like Rx.NET does not work with Actor
        // In particular, Actor subscribes to Rx.NET Observable but it does not receive any event
        private static ActorSystem _actorSystem;

        private ClusterActionStore()
        {
        }

        public static ClusterActionStore Instance => new ClusterActionStore();

        public static void BindToActorSystem(ActorSystem actorSystem)
        {
            _actorSystem = actorSystem;
        }

        public void ExecuteAction(ClusterActionMessage action)
        {
            if (action == null || _actorSystem == null) return;

            Console.WriteLine($"Executing action: {action.Action} to member {action.Member.Host}:{action.Member.Port}");
            var cluster = Cluster.Get(_actorSystem);
            var target = GetTargetedMember(cluster.State.Members, action.Member);

            if (target == null) return;
            switch (action.Action.ToLowerInvariant())
            {
                case "leave":
                    cluster.Leave(target.Address);
                    return;
                case "down":
                    cluster.Down(target.Address);
                    return;
            }
        }

        private Member GetTargetedMember(IEnumerable<Member> allMembers, MemberIdentity memberIdentity)
        {
            foreach (var member in allMembers)
            {
                if (member.UniqueAddress.Uid == memberIdentity.UniqueId &&
                    member.UniqueAddress.Address.Host == memberIdentity.Host &&
                    member.UniqueAddress.Address.Port == memberIdentity.Port)
                {
                    return member;
                }
            }
            return null;
        }
    }
}
