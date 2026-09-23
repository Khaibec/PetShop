import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PetsComponent } from './pets.component';
import { PetDetailComponent } from './pet-detail.component';

const routes: Routes = [
  { path: '', component: PetsComponent },
  { path: ':id', component: PetDetailComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PetsRoutingModule {}
