import { Component, OnInit } from '@angular/core';
import { ModalController, NavParams } from '@ionic/angular';

@Component({
  selector: 'app-agb.modal',
  templateUrl: './agb.modal.html',
  styleUrls: ['./agb.modal.scss'],
})
export class AGBModal implements OnInit {
  type: string;
  isAGB: boolean;
  isDS: boolean;

  constructor(
    private modalCtrl: ModalController,
    private navParams: NavParams,
  ) {
    this.isAGB = false;
    this.isDS = false;
  }

  ngOnInit() {
    this.type = this.navParams.get('type');
    this.isAGB = this.type === 'AGB' ? true : false;
    this.isDS = this.type === 'DS' ? true : false;
    console.log(this.type);
  }

  close() {
    this.modalCtrl.dismiss();
  }

}
