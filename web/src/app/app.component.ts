import { AmChart, AmChartsService } from '@amcharts/amcharts3-angular';
import { Component, OnDestroy, OnInit, AfterViewInit } from '@angular/core';
import { GridApi, GridOptions } from 'ag-grid-community';
import * as _ from 'lodash';
import { Subscription, BehaviorSubject, interval, Observable } from 'rxjs';
import { throttle } from 'rxjs/operators';
import { Member } from './models/cluster/member';
import { MemberStatus } from './models/cluster/member-status';
import { MemberRemovedMessage } from './models/socket/member-removed-message';
import { MessageType } from './models/socket/message-types';
import {
  MemberColumnDef,
  MemberRow,
  UnknownStatus
} from './models/table/member-table';
import { WebsocketService } from './services/websocket.service';
import { MatSnackBar } from '@angular/material';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy, AfterViewInit {
  title = 'web';
  ws: WebsocketService;
  wsUrl = 'ws://localhost:8080/ws';
  wsOnline: Observable<boolean>;
  clusterStateSubscription: Subscription;
  socketNotificationSubscription: Subscription;

  columnDefs = MemberColumnDef;
  rowData: MemberRow[] = [];
  gridOptions: GridOptions = {
    enableColResize: true,
    getRowNodeId: data => data.UniqueId,
    enableCellChangeFlash: true,
    enableSorting: true,
    enableFilter: true,
    rowSelection: 'single',
    suppressCellSelection: true,
    components: {
      rowIdRenderer: params => '' + params.rowIndex,
      dateRenderer: params => params.value.toLocaleDateString() + ' ' + params.value.toLocaleTimeString()
    },
    onGridReady: e => {
      this.gridApi = this.gridOptions.api;
      setTimeout(() => this.gridOptions.api.sizeColumnsToFit(), 100);
    }
  };
  gridApi: GridApi;

  memberMap = new Map<number, MemberRow>();
  activeCount = 0;
  unreachableCount = 0;

  allRoles: string[];

  chart: AmChart;
  chartData = [{role: 'unknown', count: 0}];
  chartDataSubject = new BehaviorSubject<any[]>(this.chartData);
  chartDataSubscription: Subscription;

  constructor(
    private amChartsService: AmChartsService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.ws = new WebsocketService();
    this.wsOnline = this.ws.getSocketOpenedObservable();
    this.clusterStateSubscription = this.ws
      .getClusterStateObservable()
      .subscribe(state => {
        const now = new Date();
        const clusterState = state && state.ClusterState;
        const messageType = state && state.Type;
        // console.log(messageType, state);

        if (!clusterState) {
          this.memberMap.forEach((member, key) => {
            if (member.Status !== UnknownStatus) {
              member.LastUpdated = now;
              member.Status = UnknownStatus;
            }
          });
          this.checkGridChanges();
          return;
        }

        _.each(clusterState.Members, member => {
          if (!this.getAndUpdateMemberInfoInMap(member, now)) {
            const newMemberRow: MemberRow = {
              Host: member.Address.Host,
              Port: member.Address.Port,
              Role: member.Roles.join(', '),
              Status: MemberStatus[member.Status],
              UniqueId: member.UniqueAddress.Uid,
              LastUpdated: now
            };
            this.memberMap.set(newMemberRow.UniqueId, newMemberRow);
            this.rowData.push(newMemberRow);
          }
        });

        // need to handle MemberRemoved since its status will not be part of ClusterState anymore
        if (messageType === MessageType.MemberRemoved) {
          const member = (state as MemberRemovedMessage).MemberRemoved;
          this.getAndUpdateMemberInfoInMap(member, now, MemberStatus.Removed);
        }

        _.each(clusterState.Unreachable, member => {
          this.getAndUpdateMemberInfoInMap(member, now, MemberStatus.Unreachable);
        });

        const memberGroup = _.groupBy(this.rowData, (member: MemberRow) => member.Status);
        const activeStatus = MemberStatus[MemberStatus.Up];
        const unreachableStatus = MemberStatus[MemberStatus.Unreachable];
        this.activeCount = (memberGroup[activeStatus] || []).length;
        this.unreachableCount = (memberGroup[unreachableStatus] || []).length;

        console.log(this.rowData);
        this.checkGridChanges();

        this.allRoles = clusterState.AllRoles;

        const aliveMembers = _.filter(this.rowData, (member: MemberRow) => member.Status !== MemberStatus[MemberStatus.Removed]);
        const roleGroup = _.countBy(aliveMembers, (member: MemberRow) => member.Role);
        this.chartData = _.map(this.allRoles, role => ({role: role, count: roleGroup[role] || 0}));
        this.chartDataSubject.next(this.chartData);
      });
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.chart = this.amChartsService.makeChart('chartdiv', {
        type: 'serial',
        theme: 'none',
        dataProvider: this.chartData,
        'valueAxes': [ {
          'gridColor': '#FFFFFF',
          'gridAlpha': 0.2,
          'dashLength': 0
        } ],
        'gridAboveGraphs': true,
        'startDuration': 1,
        'graphs': [ {
          'balloonText': '[[category]]: <b>[[value]]</b>',
          'fillAlphas': 0.8,
          'lineAlpha': 0.2,
          'type': 'column',
          'valueField': 'count'
        } ],
        'chartCursor': {
          'categoryBalloonEnabled': false,
          'cursorAlpha': 0,
          'zoomable': false
        },
        'categoryField': 'role',
        'categoryAxis': {
          'gridPosition': 'start',
          'gridAlpha': 0,
          'tickPosition': 'start',
          'tickLength': 20
        },
        // export: {
        //   enabled: true
        // }
      });

      this.chartDataSubscription = this.chartDataSubject
      // .pipe(throttle(val => interval(100)))
      .subscribe(data => {
        if (!this.chart) {
          return;
        }
        setTimeout(() => {
          this.amChartsService.updateChart(this.chart, () => {
            console.log(data);
            this.chart.dataProvider = data;
          });
        }, 500);
      });
    }, 500);
  }

  ngOnDestroy(): void {
    if (this.clusterStateSubscription) {
      this.clusterStateSubscription.unsubscribe();
    }

    if (this.chart) {
      this.amChartsService.destroyChart(this.chart);
    }

    if (this.chartDataSubscription) {
      this.chartDataSubscription.unsubscribe();
    }
  }

  // tslint:disable-next-line:no-unnecessary-initializer
  getAndUpdateMemberInfoInMap(member: Member, lastUpdated: Date, status: MemberStatus = undefined): boolean {
    const uniqueId = member.UniqueAddress.Uid;
    const existingMemberRow = this.memberMap.get(uniqueId);
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

  checkGridChanges() {
    // TODO: need to check why flashing does not work
    this.rowData = [...this.rowData];
    if (this.gridApi) {
      // this.gridApi.refreshCells({ force: true });
      setTimeout(() => this.gridApi.sizeColumnsToFit(), 100);
    }
  }

  resetAll() {
    this.rowData = [];
    this.activeCount = 0;
    this.unreachableCount = 0;
    this.memberMap.clear();
    this.checkGridChanges();

    this.chartData = [];
    this.chartDataSubject.next([]);
  }

  startWsConnection() {
    this.resetAll();
    this.ws.establishWsConnection(this.wsUrl);
  }

  stopWsConnection() {
    this.ws.discardWsConnection();
  }
}
