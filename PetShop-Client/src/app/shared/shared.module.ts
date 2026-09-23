import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { HeaderComponent } from './components/header.component';
import { NavbarComponent } from './components/navbar.component';
import { FooterComponent } from './components/footer.component';
import { ProductCardComponent } from './components/product-card.component';
import { PetCardComponent } from './components/pet-card.component';
import { PaginationComponent } from './components/pagination.component';
import { RatingStarsComponent } from './components/rating-stars.component';

@NgModule({
  declarations: [
    HeaderComponent,
    NavbarComponent,
    FooterComponent,
    ProductCardComponent,
    PetCardComponent,
    PaginationComponent,
    RatingStarsComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule
  ],
  exports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    HeaderComponent,
    NavbarComponent,
    FooterComponent,
    ProductCardComponent,
    PetCardComponent,
    PaginationComponent,
    RatingStarsComponent
  ]
})
export class SharedModule {}
