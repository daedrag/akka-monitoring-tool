export interface ClusterWithSeedNodes {
  alias: string;
  seedNodes: string;
}

export interface ClusterSettings {
  clusters: ClusterWithSeedNodes[];
  default: string;
}
