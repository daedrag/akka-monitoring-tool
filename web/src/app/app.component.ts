import { AmChart, AmChartsService } from '@amcharts/amcharts3-angular';
import { Component, OnDestroy, OnInit, AfterViewInit } from '@angular/core';
import { GridApi, GridOptions } from 'ag-grid-community';
import * as _ from 'lodash';
import { Subscription, BehaviorSubject, Observable } from 'rxjs';
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
import { AkkaConfigHelper } from './helpers/akka-config-helper';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {

  seedNodeString = 'akka.tcp://MyCluster@localhost:8081,akka.tcp://MyCluster@localhost:8082';
  seedNodes = [];
  seedNodeTabTitles = {};
  seedNodeOnlineStatuses = {};

  constructor() {}

  ngOnInit(): void {
    this.seedNodes = this.seedNodeString.split(',');
    _.each(this.seedNodes, seedNode => {
      const displayValue = seedNode.split('@')[1];
      this.seedNodeTabTitles[seedNode] = displayValue;
      this.seedNodeOnlineStatuses[seedNode] = false;
    });
    console.log(this.seedNodeTabTitles);
  }

  setWsOnlineChange(seedNode, online) {
    this.seedNodeOnlineStatuses[seedNode] = online;
  }

}
