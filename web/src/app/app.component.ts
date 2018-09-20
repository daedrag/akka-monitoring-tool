import { Component, OnInit, EventEmitter, OnDestroy, AfterViewInit } from '@angular/core';
import * as _ from 'lodash';
import { Subscription } from 'rxjs';
import { StatsInfo } from './models/views/stats-info';
import { WebsocketService, SocketNotificationType } from './services/websocket.service';
import { AkkaConfigHelper } from './helpers/akka-config-helper';
import { MemberRow, UnknownStatus } from './models/table/member-table';
import { Member } from './models/cluster/member';
import { MemberStatus } from './models/cluster/member-status';
import { MessageType } from './models/socket/message-types';
import { MemberRemovedMessage } from './models/socket/member-removed-message';
import { MatSnackBar, MatDialog } from '@angular/material';
import { SettingDialogComponent } from './views/setting-dialog/setting-dialog.component';
import { ClusterSettings, ClusterWithSeedNodes } from './models/views/cluster-settings';
import { ClusterSettingsService } from './services/cluster-settings.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy, AfterViewInit {

  clusterName = '';
  seedNodeString = '';

  selectedIndex = 0;
  statsInfoList = [];

  subscriptions: Subscription[] = [];

  constructor(private snackBar: MatSnackBar, private dialog: MatDialog, private clusterSettingsService: ClusterSettingsService) {}

  ngOnInit(): void {
    this.initializeClusterNameAndSeedNodesToConnect();
  }

  ngOnDestroy(): void {
    this.unsubscribeAll();
  }

  ngAfterViewInit(): void {
    this.initializeSeedNodeConnections();
  }

  initializeClusterNameAndSeedNodesToConnect() {
    const clusterSettings: ClusterSettings = this.clusterSettingsService.getClusterSettings();
    this.clusterName = clusterSettings.default;
    const clusterWithSeedNodes = _.find(clusterSettings.clusters, (cluster: ClusterWithSeedNodes) => cluster.alias === this.clusterName);
    this.seedNodeString = clusterWithSeedNodes && clusterWithSeedNodes.seedNodes;
  }

  initializeSeedNodeConnections() {
    if (!this.seedNodeString) {
      return;
    }
    const seedNodes = this.seedNodeString.split(',');
    const statsInfoList = _.map(seedNodes, seedNode => {
      const displayName = seedNode.split('@')[1];
      const statsInfo: StatsInfo = {
        seedNode: seedNode,
        displayName: displayName,
        activeCount: 0,
        unreachableCount: 0,
        memberRows: [],
        roleCount: [],
        isWsOnline: false,
        wsUrl: AkkaConfigHelper.parseSeedNodeToWsUrl(seedNode),
        ws: new WebsocketService(),
        changeEvent: new EventEmitter<any>(),
        memberCacheByUniqueId: new Map<number, MemberRow>()
      };

      return statsInfo;
    });

    _.each(statsInfoList, s => {
      try {
        this.subscribeToWsEvents(s);
        this.subscribeToWsStatus(s);
        this.startWsConnection(s);
      } catch (error) {
        // TODO
      }
    });

    setTimeout(() => this.statsInfoList = statsInfoList);
  }

  terminateAllSeedNodeConnections() {
    _.each(this.statsInfoList, (statsInfo: StatsInfo) => {
      this.stopWsConnection(statsInfo);
    });
    this.unsubscribeAll();
  }

  subscribeToWsEvents(statsInfo: StatsInfo) {
    const clusterStateSubscription = statsInfo.ws
      .getClusterStateObservable()
      .subscribe(message => {
        console.log(message);
        const now = new Date();
        const clusterState = message && message.ClusterState;
        const messageType = message && message.Type;

        if (!clusterState) {
          statsInfo.memberCacheByUniqueId.forEach((member) => {
            if (member.Status !== UnknownStatus) {
              member.LastUpdated = now;
              member.Status = UnknownStatus;
            }
          });
          statsInfo.changeEvent.emit();
          return;
        }

        _.each(clusterState.Members, member => {
          if (!this.getAndUpdateMemberInfoInMap(statsInfo, member, now)) {
            const newMemberRow: MemberRow = {
              Host: member.UniqueAddress.Address.Host,
              Port: member.UniqueAddress.Address.Port,
              Role: member.Roles.join(', '),
              Status: MemberStatus[member.Status],
              UniqueId: member.UniqueAddress.Uid,
              LastUpdated: now
            };
            statsInfo.memberCacheByUniqueId.set(newMemberRow.UniqueId, newMemberRow);
            statsInfo.memberRows.push(newMemberRow);
          }
        });

        // need to handle MemberRemoved since its status will not be part of ClusterState anymore
        if (messageType === MessageType.MemberRemoved) {
          const member = (message as MemberRemovedMessage).MemberRemoved;
          this.getAndUpdateMemberInfoInMap(statsInfo, member, now, MemberStatus.Removed);
        }

        // update status for currently unreachable members
        const currentlyUnreachableIds = [];
        _.each(clusterState.Unreachable, member => {
          currentlyUnreachableIds.push(member.UniqueAddress.Uid);
          this.getAndUpdateMemberInfoInMap(statsInfo, member, now, MemberStatus.Unreachable);
        });

        // for previously unreachable members, we need to update status if any are removed
        const unreachableStatus = MemberStatus[MemberStatus.Unreachable];
        statsInfo.memberCacheByUniqueId.forEach((member, uniqueId) => {
          if (member.Status !== unreachableStatus || currentlyUnreachableIds.includes(uniqueId)) {
            return;
          }
          member.Status = MemberStatus[MemberStatus.Removed];
        });

        const memberGroup = _.groupBy(statsInfo.memberRows, (member: MemberRow) => member.Status);
        const activeStatus = MemberStatus[MemberStatus.Up];

        statsInfo.activeCount = (memberGroup[activeStatus] || []).length;
        statsInfo.unreachableCount = (memberGroup[unreachableStatus] || []).length;

        const allRoles = clusterState.AllRoles;
        const aliveMembers = _.filter(statsInfo.memberRows, (member: MemberRow) => member.Status !== MemberStatus[MemberStatus.Removed]);
        const roleGroup = _.countBy(aliveMembers, (member: MemberRow) => member.Role);

        statsInfo.roleCount = _.map(allRoles, role => ({role: role, count: roleGroup[role] || 0}));

        statsInfo.changeEvent.emit();
      });

    this.subscriptions.push(clusterStateSubscription);
  }

  subscribeToWsStatus(statsInfo: StatsInfo) {
    const statusSubscription = statsInfo.ws.getSocketOpenedObservable()
      .subscribe(isOnline => {
        statsInfo.isWsOnline = isOnline;
        setTimeout(() => statsInfo.changeEvent.emit(), 500);
      });
    this.subscriptions.push(statusSubscription);

    const notificationSubscription = statsInfo.ws.getSocketNotificationObservable()
      .subscribe(notif => {
        if (!notif) {
          return;
        }
        this.snackBar.open(`[ ${statsInfo.displayName} ] [ ${SocketNotificationType[notif.type]} ] ${notif.message}`, 'Dismiss', {
          duration: 3000
        });
      });
    this.subscriptions.push(notificationSubscription);
  }

  // tslint:disable-next-line:no-unnecessary-initializer
  getAndUpdateMemberInfoInMap(statsInfo: StatsInfo, member: Member, lastUpdated: Date, status: MemberStatus = undefined): boolean {
    const uniqueId = member.UniqueAddress.Uid;
    const existingMemberRow = statsInfo.memberCacheByUniqueId.get(uniqueId);
    if (existingMemberRow) {
      existingMemberRow.Status =
        status !== undefined
          ? MemberStatus[status]
          : MemberStatus[member.Status];
      existingMemberRow.LastUpdated = lastUpdated;
      return true;
    }
    return false;
  }

  unsubscribeAll() {
    _.each(this.subscriptions, subscription => subscription.unsubscribe());
    this.subscriptions = [];
  }

  startWsConnection(statsInfo: StatsInfo) {
    if (!statsInfo.ws) {
      return;
    }
    statsInfo.ws.establishWsConnection(statsInfo.wsUrl);
  }

  stopWsConnection(statsInfo: StatsInfo) {
    if (!statsInfo.ws) {
      return;
    }
    statsInfo.ws.discardWsConnection();
  }

  openSettingDialog() {
    const clusterSettings: ClusterSettings = this.clusterSettingsService.getClusterSettings();
    const dialogRef = this.dialog.open(SettingDialogComponent, {
      data: clusterSettings
    });

    dialogRef.afterClosed().subscribe(result => {
      if (!result) {
        return;
      }
      this.clusterSettingsService.setClusterSettings(result);

      this.terminateAllSeedNodeConnections();
      this.initializeClusterNameAndSeedNodesToConnect();
      this.initializeSeedNodeConnections();
    });
  }

}
