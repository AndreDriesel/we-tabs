import { Component, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { HttpClient } from '@angular/common/http';
import { Subscription } from 'rxjs';

@Component({
  selector: 'countries-modal',
  templateUrl: './countries-modal.page.html',
  styleUrls: ['./countries-modal.page.scss'],
})
export class CountriesModalPage implements OnInit {
  countries: Country[];
  countriesSp: Subscription;
  listData: Country[];
  showSpinner: boolean;
  localCountry: any;

  constructor(
    private modalCtrl: ModalController,
    private httpClient: HttpClient
    ) {
      this.showSpinner = true;
    }

  ngOnInit() {
    this.countriesSp = this.httpClient.get<Country[]>('/assets/country.json')
    .subscribe(countries => {
      this.countries = countries;
      this.listData = this.countries.slice(0, 20);
      this.showSpinner = false;
      this.getLocation();
    });
  }

  getLocation(): void{
    const locationCode = Intl.DateTimeFormat().resolvedOptions().locale;
    this.localCountry = this.countries.filter(country => country.alphaCode === locationCode)[0];
    console.log(this.localCountry);
  }

  ionViewWillLeave() {
    this.countriesSp.unsubscribe();
  }

  close(selected?) {
    this.modalCtrl.dismiss(selected);
  }

  loadData(event: any) {
    setTimeout(() => {
      this.listData = this.countries;
      event.target.complete();
    });
  }

  search(event: any) {
    const searchText = event.target.value || '';
    this.listData = this.countries.filter(
      country => JSON.stringify(country).toLowerCase().indexOf(searchText.toLowerCase().trim()) > -1);
  }

}

export interface Country {
  name?: string;
  nativeName?: string;
  code?: string;
  alphaCode?: string;
}
