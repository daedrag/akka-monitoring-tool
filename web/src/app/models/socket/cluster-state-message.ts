import { ClusterState } from '../cluster/cluster-state';

export interface ClusterStateMessage {
    Type: string;
    ClusterState: ClusterState;
}
