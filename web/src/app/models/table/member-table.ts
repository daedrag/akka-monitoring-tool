import { ColDef } from 'ag-grid-community';

export interface MemberRow {
    Role: string;
    Host: string;
    Port: number;
    Status: string;
    UniqueId: number;
    LastUpdated: Date;
}

export const UnknownStatus = 'Unknown';

export const MemberColumnDef: ColDef[] = [
    // this col shows the row index, doesn't use any data from the row
    { headerName: '#', width: 20, cellRenderer: 'rowIdRenderer' },
    { headerName: 'Role', width: 100, field: 'Role' },
    { headerName: 'Status', width: 70, field: 'Status' },
    { headerName: 'Host', width: 100, field: 'Host' },
    { headerName: 'Port', width: 50, field: 'Port' },
    { headerName: 'LastUpdated', width: 100, field: 'LastUpdated', cellRenderer: 'dateRenderer' },
    { headerName: 'UniqueId', width: 70, field: 'UniqueId' },
    {
      headerName: 'Action',
      field: 'Status',
      cellRenderer: 'actionCellRenderer',
      width: 200,
      suppressSorting: true,
      suppressFilter: true,
      suppressSizeToFit: true
    }
];
