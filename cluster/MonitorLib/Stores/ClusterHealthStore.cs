using System;
using System.Reactive.Linq;
using System.Reactive.Subjects;
using Akka.Cluster;
using MonitorLib.Messages;
using Newtonsoft.Json;
using static Akka.Cluster.ClusterEvent;

namespace MonitorLib.Stores
{
    class ClusterHealthStore : IObserver<string>
    {
        private CurrentClusterState currentState;
        private readonly BehaviorSubject<string> currentStateSubject;
        public IObservable<string> CurrentStateObservable { get; }

        private ClusterHealthStore()
        {
            currentStateSubject = new BehaviorSubject<string>(null);
            CurrentStateObservable = currentStateSubject
                .AsObservable();
                //.DistinctUntilChanged()
                //.Throttle(TimeSpan.FromMilliseconds(500));
        }

        public static ClusterHealthStore Instance = new ClusterHealthStore();

        public void NotifyNewCurrentState(CurrentClusterState newState)
        {
            currentState = newState;
            var message = new ClusterStateMessage { ClusterState = currentState };
            var json = JsonConvert.SerializeObject(message);
            currentStateSubject.OnNext(json);
        }

        public void NotifyMemberRemoved(CurrentClusterState newState, Member memberRemoved)
        {
            currentState = newState;
            var message = new MemberRemovedMessage
            {
                ClusterState = currentState,
                MemberRemoved = memberRemoved
            };
            var json = JsonConvert.SerializeObject(message);
            currentStateSubject.OnNext(json);
        }

        public void OnNext(string value)
        {
            Console.WriteLine(value);
        }

        public void OnError(Exception error)
        {
            Console.WriteLine($"Subscription error: {error.Message}");
        }

        public void OnCompleted()
        {
            Console.WriteLine("Subscription completed!");
        }
    }
}
