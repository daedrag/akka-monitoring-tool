import { Component, OnInit, OnDestroy, AfterViewInit, Input, OnChanges, SimpleChanges } from '@angular/core';
import { MemberColumnDef, MemberRow } from '../../models/table/member-table';
import { GridOptions, GridApi } from 'ag-grid-community';
import { AmChart, AmChartsService } from '@amcharts/amcharts3-angular';
import * as _ from 'lodash';
import { AkkaConfigHelper } from '../../helpers/akka-config-helper';
import { StatsInfo } from '../../models/views/stats-info';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { MemberStatus } from '../../models/cluster/member-status';

@Component({
  selector: 'app-monitor-container',
  templateUrl: './monitor-container.component.html',
  styleUrls: ['./monitor-container.component.scss']
})
export class MonitorContainerComponent implements OnInit, OnDestroy, AfterViewInit, OnChanges {

  @Input() statsInfo: StatsInfo;

  columnDefs = MemberColumnDef;

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
      dateRenderer: params => params.value.toLocaleDateString() + ' ' + params.value.toLocaleTimeString(),
    },
    onGridReady: () => {
      this.gridApi = this.gridOptions.api;
      setTimeout(() => this.gridOptions.api.sizeColumnsToFit(), 100);
    }
  };

  frameworkComponents = {
    actionCellRenderer: RowActionCellComponent
  };

  gridContext = { componentParent: this };

  chart: AmChart;
  gridApi: GridApi;

  waitingForChanges: boolean;
  seedNode: string;
  wsOnline: boolean;
  rowData: MemberRow[] = [];
  activeCount = 0;
  unreachableCount = 0;
  chartData = [];

  constructor(
    private amChartsService: AmChartsService,
  ) { }

  ngOnInit(): void {
    this.subscribeToStatsInfo();
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.subscribeToStatsInfo();
    this.refreshAndCheckChanges();
  }

  ngAfterViewInit() {
    this.initializeChart();
  }

  ngOnDestroy(): void {
  }

  subscribeToStatsInfo() {
    if (!this.statsInfo) {
      this.resetAll();
      return;
    }

    this.statsInfo.changeEvent.subscribe(e => {
      this.refreshAndCheckChanges();
    });
  }

  refreshAndCheckChanges() {
    if (this.statsInfo) {
      this.loadAllData();
    } else {
      this.resetAll();
    }

    this.checkGridChanges();
    this.updateChart();
  }

  loadAllData() {
    this.waitingForChanges = false;
    this.seedNode = this.statsInfo.seedNode;
    this.wsOnline = this.statsInfo.isWsOnline;
    this.rowData = [...this.statsInfo.memberRows];
    this.activeCount = this.statsInfo.activeCount;
    this.unreachableCount = this.statsInfo.unreachableCount;
    this.chartData = this.statsInfo.roleCount;
  }

  resetAll() {
    this.waitingForChanges = false;
    this.seedNode = 'unknown';
    this.wsOnline = false;
    this.rowData = [];
    this.activeCount = 0;
    this.unreachableCount = 0;
    this.chartData = [];
  }

  checkGridChanges() {
    // TODO: need to check why flashing does not work
    this.rowData = [...this.rowData];
    if (this.gridApi) {
      this.gridApi.refreshCells({ force: true });
      this.gridApi.sizeColumnsToFit();
    }
  }

  initializeChart() {
    this.chart = this.amChartsService.makeChart('chartdiv', {
      type: 'pie',
      startDuration: 0,
      theme: 'none',
      dataProvider: [],
      valueField: 'count',
      titleField: 'role',
      legend: {
        position: 'right',
        marginRight: 100
      },
      innerRadius: '30%',
      // export: {
      //   enabled: true
      // },
      creditsPosition: 'bottom-left',
      fontSize: 10,
      labelText: '[[title]]',
      labelRadius: -5
    });
  }

  updateChart() {
    if (!this.chart) {
      // throw new Error('Should not call updateChart when chart is not initialized');
      return;
    }
    this.amChartsService.updateChart(this.chart, () => {
      this.chart.dataProvider = this.chartData;
    });
  }

  startWsConnection() {
    if (!this.statsInfo || !this.statsInfo.ws) {
      return;
    }
    this.waitingForChanges = true;

    const wsUrl = AkkaConfigHelper.parseSeedNodeToWsUrl(this.seedNode);
    this.statsInfo.ws.establishWsConnection(wsUrl);
  }

  stopWsConnection() {
    if (!this.statsInfo || !this.statsInfo.ws) {
      return;
    }
    this.statsInfo.ws.discardWsConnection();
  }

  handleCellAction(action: string, uniqueId: number) {
    const memberRow = this.statsInfo.memberCacheByUniqueId.get(uniqueId);
    if (!memberRow) {
      return;
    }

    console.log('Action:', action, ', Member:', memberRow);
  }
}

@Component({
  selector: 'app-row-action-cell',
  template:
  `<span>
    <button mat-button color="accent" (click)="callLeave()" [disabled]="!enabled">Leave</button>
    <button mat-button color="warn" (click)="callDown()" [disabled]="!enabled">Down</button>
  </span>`,
  styles: [
      `.btn {
          line-height: 0.5
      }`
  ]
})
export class RowActionCellComponent implements ICellRendererAngularComp {
  params: any;
  enabled: boolean;

  agInit(params: any): void {
    this.params = params;
    if (this.params.value === 'Up') {
      this.enabled = true;
    }
  }

  refresh(): boolean {
    return false;
  }

  callLeave() {
    this.callParentAction('leave');
  }

  callDown() {
    this.callParentAction('down');
  }

  callParentAction(action: string) {
    this.params.context.componentParent.handleCellAction(action, this.params.node.id);
  }
}
