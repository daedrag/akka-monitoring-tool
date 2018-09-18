import { MemberRow } from '../table/member-table';
import { WebsocketService } from '../../services/websocket.service';
import { EventEmitter } from '@angular/core';

export interface StatsInfo {
  seedNode: string;
  displayName: string;
  wsUrl: string;
  isWsOnline: boolean;
  memberRows: MemberRow[];
  roleCount: { role: string, count: number}[];
  activeCount: number;
  unreachableCount: number;
  ws: WebsocketService;
  changeEvent: EventEmitter<any>;
  memberCacheByUniqueId: Map<number, MemberRow>;
}
