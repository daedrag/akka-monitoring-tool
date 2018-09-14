export enum MemberStatus {
    //
    // Summary:
    //     Indicates that a new node is joining the cluster.
    Joining = 0,
    //
    // Summary:
    //     Indicates that a node is a current member of the cluster.
    Up = 1,
    //
    // Summary:
    //     Indicates that a node is beginning to leave the cluster.
    Leaving = 2,
    //
    // Summary:
    //     Indicates that all nodes are aware that this node is leaving the cluster.
    Exiting = 3,
    //
    // Summary:
    //     Node was forcefully removed from the cluster by means of Akka.Cluster.Cluster.Down(Akka.Actor.Address)
    Down = 4,
    //
    // Summary:
    //     Node was removed as a member from the cluster.
    Removed = 5,
    //
    // Summary:
    //     Indicates that new node has already joined, but it cannot be set to Akka.Cluster.MemberStatus.Up
    //     because cluster convergence cannot be reached i.e. because of unreachable nodes.
    WeaklyUp = 6,

    // this is added for UI visualization only
    Unreachable = 999
}
