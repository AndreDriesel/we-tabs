import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { CountriesModalPage } from './countries-modal.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule
  ],
  declarations: [
    CountriesModalPage
  ],
  entryComponents: [
    CountriesModalPage
  ]
})
export class CountriesModalPageModule {}
