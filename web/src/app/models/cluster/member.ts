import { UniqueAddress } from './unique-address';
import { Address } from './address';
import { MemberStatus } from './member-status';

export interface Member {
    UniqueAddress: UniqueAddress;
    Address: Address;
    Roles: string[];
    Status: MemberStatus;
}
