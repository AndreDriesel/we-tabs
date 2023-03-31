import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { VerificationModalPage } from './verification-modal.page';


@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule
  ],
  declarations: [
    VerificationModalPage
  ],
  entryComponents: [
    VerificationModalPage
  ]
})
export class VerificationModalPageModule {}
