export interface MemberRow {
    Role: string;
    Host: string;
    Port: number;
    Status: string;
    UniqueId: number;
    LastUpdated: Date;
}

export const UnknownStatus = 'Unknown';

export const MemberColumnDef = [
    // this col shows the row index, doesn't use any data from the row
    { headerName: '#', width: 20, cellRenderer: 'rowIdRenderer' },
    { headerName: 'Role', width: 100, field: 'Role' },
    { headerName: 'Status', width: 50, field: 'Status' },
    { headerName: 'Host', width: 100, field: 'Host' },
    { headerName: 'Port', width: 50, field: 'Port' },
    { headerName: 'LastUpdated', width: 100, field: 'LastUpdated', cellRenderer: 'dateRenderer' },
    { headerName: 'UniqueId', width: 50, field: 'UniqueId' }
];
