import * as _ from 'lodash';

export class AkkaConfigHelper {
  public static parseSeedNodesToWsUrls(seedNodes: string): string[] {
    const wsUrls = _.map(seedNodes.split(','), val => {
      const seedNodeUrl = val.trim();
      const akkaHostAndPort = seedNodeUrl.split('@')[1];
      const clusterPort = akkaHostAndPort.split(':')[1];
      // Note that, according MonitorLib, WebSocket is hosted on the port following this rule: 10000 + cluster_port
      const wsPort = 10000 + Number(clusterPort);
      const wsHostAndPort = akkaHostAndPort.replace(clusterPort, '' + wsPort);
      return `ws://${wsHostAndPort}/ws`;
    });
    return wsUrls;
  }
}
