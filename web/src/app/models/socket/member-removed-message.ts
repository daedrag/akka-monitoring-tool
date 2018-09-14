import { ClusterStateMessage } from './cluster-state-message';
import { Member } from '../cluster/member';

export interface MemberRemovedMessage extends ClusterStateMessage {
    MemberRemoved: Member;
}
