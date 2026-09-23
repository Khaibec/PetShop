import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PetsRoutingModule } from './pets-routing.module';
import { PetsComponent } from './pets.component';
import { PetDetailComponent } from './pet-detail.component';
import { SharedModule } from '../../shared/shared.module';

@NgModule({
  declarations: [
    PetsComponent,
    PetDetailComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    PetsRoutingModule,
    SharedModule
  ]
})
export class PetsModule {}
