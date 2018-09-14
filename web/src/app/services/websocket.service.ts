import { BehaviorSubject, Observable } from 'rxjs';
import { ClusterStateMessage } from '../models/socket/cluster-state-message';

export class WebsocketService {

  private _ws: WebSocket;

  private _clusterState: ClusterStateMessage = undefined;
  private _clusterStateSubject = new BehaviorSubject<ClusterStateMessage>(this._clusterState);

  private _socketOpened: boolean;
  private _socketOpenedSubject = new BehaviorSubject<boolean>(this._socketOpened);

  constructor() {
  }

  establishWsConnection(wsUrl: string) {
    this.discardWsConnection();
    this._ws = new WebSocket(wsUrl);
    this._ws.onmessage = this.onMessage.bind(this);
    this._ws.onclose = this.onClose.bind(this);
    this._ws.onerror = this.onError.bind(this);
    this._ws.onopen = this.onOpen.bind(this);
  }

  discardWsConnection() {
    if (!this._ws) {
      return;
    }
    this._ws.onmessage = () => {};
    this._ws.onclose = () => {};
    this._ws.onerror = () => {};
    this._ws.onopen = () => {};
    this._ws.close();
    this._socketOpened = false;
    this._socketOpenedSubject.next(this._socketOpened);
  }

  private onMessage(e: MessageEvent) {
    const data = JSON.parse(e.data) as ClusterStateMessage;
    this._clusterState = data;
    this._clusterStateSubject.next(this._clusterState);
  }

  private onOpen(e: Event) {
    this._socketOpened = true;
    this._socketOpenedSubject.next(this._socketOpened);
  }

  private onClose(e: CloseEvent) {
    console.warn(e.code, e.reason);
    this._socketOpened = false;
    this._socketOpenedSubject.next(this._socketOpened);
  }

  private onError(e: Event) {
    console.error(e);
    this._socketOpened = false;
    this._socketOpenedSubject.next(this._socketOpened);
  }

  public getClusterStateObservable(): Observable<ClusterStateMessage> {
    return this._clusterStateSubject.asObservable();
  }

  public getSocketOpenedObservable(): Observable<boolean> {
    return this._socketOpenedSubject.asObservable();
  }

}
