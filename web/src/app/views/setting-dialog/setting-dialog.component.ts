import { Component, OnInit, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material';
import { ClusterSettings, ClusterWithSeedNodes } from '../../models/views/cluster-settings';
import * as _ from 'lodash';

@Component({
  selector: 'app-setting-dialog',
  templateUrl: './setting-dialog.component.html',
  styleUrls: ['./setting-dialog.component.scss']
})
export class SettingDialogComponent implements OnInit {

  newCluster: ClusterWithSeedNodes = {
    alias: '',
    seedNodes: ''
  };

  constructor(@Inject(MAT_DIALOG_DATA) public data: ClusterSettings) { }

  ngOnInit() {
    this.checkDefaultCluster();
  }

  addNewCluster() {
    this.data.clusters.push(this.newCluster);
    this.newCluster = {
      alias: '',
      seedNodes: ''
    };
    this.checkDefaultCluster();
  }

  deleteCluster(index: number) {
    if (this.data.clusters[index]) {
      this.data.clusters.splice(index, 1);
    }
    this.checkDefaultCluster();
  }

  checkDefaultCluster() {
    const isValidDefaultAlias = _.find(this.data.clusters, (cluster: ClusterWithSeedNodes) => cluster.alias === this.data.default);
    if (!isValidDefaultAlias) {
      this.data.default = '';
    }
  }

}
