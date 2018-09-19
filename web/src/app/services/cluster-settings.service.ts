import { Injectable } from '@angular/core';
import { ClusterSettings } from '../models/views/cluster-settings';

@Injectable({
  providedIn: 'root'
})
export class ClusterSettingsService {

  private _clusterSettingsKey = 'clusterSettings';
  constructor() { }

  getClusterSettings(): ClusterSettings {
    const data = localStorage.getItem(this._clusterSettingsKey);
    if (!data) {
      return <ClusterSettings>{
        clusters: [],
        default: ''
      };
    }
    return JSON.parse(data);
  }

  setClusterSettings(settings: ClusterSettings) {
    if (settings === undefined) {
      localStorage.removeItem(this._clusterSettingsKey);
      return;
    }
    const data = JSON.stringify(settings);
    localStorage.setItem(this._clusterSettingsKey, data);
  }

}
