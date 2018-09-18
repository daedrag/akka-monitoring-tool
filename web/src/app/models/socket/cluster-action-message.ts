export interface ClusterActionMessage {
  Action: string;
  Member: {
    UniqueId: number;
    Host: string;
    Port: number;
  };
}
