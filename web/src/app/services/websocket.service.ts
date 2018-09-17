import { BehaviorSubject, Observable } from 'rxjs';
import { ClusterStateMessage } from '../models/socket/cluster-state-message';

export enum SocketNotificationType {
  Error,
  Warn,
  Info
}
export interface SocketNotification {
  type: SocketNotificationType;
  message: string;
}

export class WebsocketService {

  private _ws: WebSocket;

  private _clusterState: ClusterStateMessage;
  private _clusterStateSubject = new BehaviorSubject<ClusterStateMessage>(this._clusterState);

  private _socketOpened: boolean;
  private _socketOpenedSubject = new BehaviorSubject<boolean>(this._socketOpened);

  private _socketNotification: SocketNotification;
  private _socketNotificationSubject = new BehaviorSubject<SocketNotification>(this._socketNotification);

  constructor() {
  }

  establishWsConnection(wsUrl: string) {
    this.discardWsConnection();
    try {
      this._ws = new WebSocket(wsUrl);
    } catch (e) {
      console.log(e);
      this.setSocketStatus(false);
      this.setSocketNotification(SocketNotificationType.Error, e);
      this._ws = undefined;
      return;
    }

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
    this.setSocketStatus(false);
  }

  private onMessage(e: MessageEvent) {
    const data = JSON.parse(e.data) as ClusterStateMessage;
    this._clusterState = data;
    this._clusterStateSubject.next(this._clusterState);
  }

  private onOpen(e: Event) {
    this.setSocketStatus(true);
    this.setSocketNotification(SocketNotificationType.Info, 'Socket opened');
  }

  private onClose(e: CloseEvent) {
    console.warn(e.code, e.reason);
    this.setSocketStatus(false);
    this.setSocketNotification(SocketNotificationType.Warn, 'Socket closed' + (e.reason ? ', Reason: ' + e.reason : ''));
  }

  private onError(e: Event) {
    console.error(e);
    this.setSocketStatus(false);
    this.setSocketNotification(SocketNotificationType.Error, 'Socket error encountered');
  }

  private setSocketStatus(opened: boolean) {
    this._socketOpened = opened;
    this._socketOpenedSubject.next(this._socketOpened);
  }

  private setSocketNotification(type: SocketNotificationType, message: string) {
    this._socketNotification = {
      type: type,
      message: message
    };
    this._socketNotificationSubject.next(this._socketNotification);
  }

  public getClusterStateObservable(): Observable<ClusterStateMessage> {
    return this._clusterStateSubject.asObservable();
  }

  public getSocketOpenedObservable(): Observable<boolean> {
    return this._socketOpenedSubject.asObservable();
  }

  public getSocketNotificationObservable(): Observable<SocketNotification> {
    return this._socketNotificationSubject.asObservable();
  }

}
