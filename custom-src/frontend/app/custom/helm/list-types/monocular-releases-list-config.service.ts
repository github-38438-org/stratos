import { DatePipe } from '@angular/common';
import { Injectable } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';

import { AppState } from '../../../../../store/src/app-state';
import { ITableColumn } from '../../../shared/components/list/list-table/table.types';
import {
  TableCellEndpointNameComponent,
} from '../../../shared/components/list/list-types/endpoint/table-cell-endpoint-name/table-cell-endpoint-name.component';
import { IListConfig, ListViewTypes } from '../../../shared/components/list/list.component.types';
import { HelmRelease } from '../store/helm.types';
import { HelmReleasesDataSource } from './monocular-releases-list-source';

@Injectable()
export class HelmReleasesListConfig implements IListConfig<HelmRelease> {
  isLocal = true;
  dataSource: HelmReleasesDataSource;
  viewType = ListViewTypes.TABLE_ONLY;
  text = {
    title: '',
    filter: 'Filter Releases',
    noEntries: 'There are no releases'
  };
  pageSizeOptions = [9, 45, 90];
  enableTextFilter = true;
  tableFixedRowHeight = true;
  columns = [
    {
      columnId: 'name',
      headerCell: () => 'Name',
      cellDefinition: {
        valuePath: 'name',
        getLink: (row: HelmRelease) => row.guid,
        newTab: false,
        externalLink: false,
        showShortLink: false
      },
      sort: {
        type: 'sort',
        orderKey: 'name',
        field: 'name'
      },
      cellFlex: '2'
    },
    {
      columnId: 'cluster',
      headerCell: () => 'Cluster',
      cellComponent: TableCellEndpointNameComponent,
      cellFlex: '2'
    },
    {
      columnId: 'namespace',
      headerCell: () => 'Namespace',
      cellDefinition: {
        getValue: (row) => `${row.namespace}`
      },
      sort: {
        type: 'sort',
        orderKey: 'namespace',
        field: 'namespace'
      },
      cellFlex: '1'
    },
    {
      columnId: 'status',
      headerCell: () => 'Status',
      cellDefinition: {
        getValue: (row) => `${row.status}`
      },
      sort: {
        type: 'sort',
        orderKey: 'status',
        field: 'status'
      },
      cellFlex: '2'
    },
    {
      columnId: 'version',
      headerCell: () => 'Version',
      cellDefinition: {
        getValue: (row) => `${row.version}`
      },
      sort: {
        type: 'sort',
        orderKey: 'version',
        field: 'version'
      },
      cellFlex: '1'
    },
    {
      columnId: 'last_Deployed',
      headerCell: () => 'Last Deployed',
      cellDefinition: {
        getValue: (row) => `${this.datePipe.transform(row.lastDeployed, 'medium')}`
      },
      sort: {
        type: 'sort',
        orderKey: 'lastDeployed',
        field: 'lastDeployed'
      },
      cellFlex: '3'
    },
  ] as ITableColumn<HelmRelease>[];

  constructor(
    private store: Store<AppState>,
    public activatedRoute: ActivatedRoute,
    private datePipe: DatePipe,
  ) {
    this.dataSource = new HelmReleasesDataSource(this.store, this);
  }

  public getColumns = () => this.columns;
  public getGlobalActions = () => [];
  public getMultiActions = () => [];
  public getSingleActions = () => [];
  public getMultiFiltersConfigs = () => [];
  public getDataSource = () => this.dataSource;
}
