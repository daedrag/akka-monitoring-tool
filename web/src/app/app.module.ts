import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { MaterialModule } from './modules/material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FlexLayoutModule } from '@angular/flex-layout';
import { AgGridModule } from 'ag-grid-angular';
import { AmChartsModule } from '@amcharts/amcharts3-angular';
import { MonitorContainerComponent, RowActionCellComponent } from './views/monitor-container/monitor-container.component';
import { SettingDialogComponent } from './views/setting-dialog/setting-dialog.component';

@NgModule({
  declarations: [
    AppComponent,
    MonitorContainerComponent,
    RowActionCellComponent,
    SettingDialogComponent
  ],
  entryComponents: [
    SettingDialogComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    ReactiveFormsModule,
    MaterialModule,
    FlexLayoutModule,
    AgGridModule.withComponents([RowActionCellComponent]),
    AmChartsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
