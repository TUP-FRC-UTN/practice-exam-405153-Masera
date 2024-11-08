import { Component, inject, OnDestroy, OnInit, Pipe } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ApiProductService } from '../services/api-product.service';
import { Order } from '../models/Order';
import { Subscription } from 'rxjs';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-list-order',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterLink],
  templateUrl: './list-order.component.html',
  styleUrl: './list-order.component.css'
})
export class ListOrderComponent implements OnInit, OnDestroy {

  private readonly apiService = inject(ApiProductService);
  private readonly router = inject(Router);
  subscription: Subscription = new Subscription();

  formControl : FormControl = new FormControl();

  orders: Order[] = [];

  ngOnInit(): void {
    this.loadOrders();
    this.formControl.valueChanges.subscribe({
      next: (value) => {
        this.orders = this.filterOrders(value);
      }
    });
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  loadOrders(): void {
    this.subscription = this.apiService.getAllOrders().subscribe({
      next: (orders) => {
        this.orders = orders;
      },
      error: (error) => {
        console.error('Error loading orders', error);
      }
    });
  }

  filterOrders(value : string): Order[] {
    if (!value) {
       this.loadOrders();
    }

    return this.orders.filter(order =>
      order.customerName.toLowerCase().includes(value ?? '') ||
      order.email.toLowerCase().includes(value ?? '')
    );
  }
}
