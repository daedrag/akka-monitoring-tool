import { Member } from './member';
import { Address } from './address';

export interface ClusterState {
    Members: Member[];
    Unreachable: Member[];
    SeenBy: Address[];
    Leader: Address;
    AllRoles: string[];
}