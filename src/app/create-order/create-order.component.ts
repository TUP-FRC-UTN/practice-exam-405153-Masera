import { Component, inject, OnInit } from '@angular/core';
import { AbstractControl, AsyncValidatorFn, FormArray, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { ApiProductService } from '../services/api-product.service';
import { Product } from '../models/Product';
import { CommonModule } from '@angular/common';
import { catchError, map, Observable, of } from 'rxjs';
import { Order } from '../models/Order';
import { Router } from '@angular/router';

@Component({
  selector: 'app-create-order',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './create-order.component.html',
  styleUrl: './create-order.component.css'
})
export class CreateOrderComponent implements OnInit {

  private readonly apiService = inject(ApiProductService);
  private readonly router = inject(Router);

  products : Product[] = [];
  productsSelected: Product[] = [];
  total: number = 0;
  hasDicount: boolean = false;


  formOrder: FormGroup = new FormGroup({
    name: new FormControl('', [Validators.required, Validators.minLength(3)]),
    email: new FormControl('', [Validators.required, Validators.email], [this.emailOrderLimitValidator()]),
    products: new FormArray([], [Validators.required, this.productUniqueValidator()])
  });

  ngOnInit(): void {
    this.loadProducts();
  }

  //Metodos para el array de productos
  // Devolvemos el array de productos
  get productsForm(): FormArray{
    return this.formOrder.get('products') as FormArray;
  }

  //Agregamos un formulario que representa al producto al array
  addProducts(): void{
    const formProduct: FormGroup = new FormGroup({
      productId: new FormControl(''), //Este seria el select
      quantity: new FormControl(1,[Validators.required, Validators.min(1)]),
      price: new FormControl(0),
      stock: new FormControl(0)
    });

    formProduct.get('productId')?.valueChanges.subscribe({
      next: (productId) => {
        const product = this.products.find(p => p.id === productId);

        if(product){
          formProduct.patchValue({
            price: product.price,
            stock: product.stock
          });

          formProduct.get('quantity')?.addValidators(Validators.max(product.stock));
          this.calcularTotal();
          this.productsSelected.push(product as Product);
        }
      }
    });

    formProduct.get('quantity')?.valueChanges.subscribe({
      next: () => {
        this.calcularTotal();
      }
    });

    this.productsForm.push(formProduct);
  }

  removeProduct(index: number): void{
    this.productsForm.removeAt(index);
    this.productsSelected.splice(index, 1);
    this.calcularTotal();
  }

  loadProducts(): void{
    this.apiService.getAllProducts().subscribe({
      next: (products) => {
        this.products = products;
      },
      error: (error) => {
        console.log("Error al cargar los productos", error);
      }
    });
  }

  //Validadores
  productUniqueValidator(): ValidatorFn{
    return (control: AbstractControl): ValidationErrors | null => {
      
      const formArray  = control as FormArray;
      const ids = formArray.controls.map(control => control.get('productId')?.value as Number);
      const hasDuplicates = ids.some((id, index) => ids.indexOf(id) !== index);
      return hasDuplicates ? { duplicateProduct: true } : null;
    }
  }

  emailOrderLimitValidator(): AsyncValidatorFn{
    return (control: AbstractControl): Observable<ValidationErrors | null> => {

      if(!control.value){
        return of(null);
      }

      return this.apiService.getOrdersByEmail(control.value).pipe(
        map(orders => {
          const now = new Date();
          const recentOrders = orders.filter(order => {
            const orderDate = order.timestamp ? new Date(order.timestamp) : new Date();
            const differenceInMilliseconds = now.getTime() - orderDate.getTime();
            console.log('Diferencia en milisegundos:', differenceInMilliseconds);
            // Convertimos la diferencia a horas diviendo por 1000 milisegundos, 
            //60 segundos y 60 minutos
            const differenceInHours = differenceInMilliseconds / (1000 * 60 * 60);
            console.log('Diferencia en horas:', differenceInHours);
            return differenceInHours <= 24;
          });

          // Si hay más de 3 pedidos en las últimas 24 horas, retornamos el error
          if (recentOrders.length >= 3) {
            console.log('Error al validar el límite de pedidos:', recentOrders);
            return { errorPedido: true };
          }

          return null;
        }),
        catchError((error) => {
          console.error('Error al validar el límite de pedidos:', error);
          return of(null);
        })
      );

    }
  }

  calcularTotal(): void{
    this.total = this.productsForm.controls.reduce((total, formGroup) => {
      const quantity = formGroup.get('quantity')?.value as number;
      const price = formGroup.get('price')?.value as number;
      return total + (quantity * price);
    }, 0);

    this.hasDicount = this.total > 1000;

    this.total = this.hasDicount ? this.total * 0.9 : this.total;
  }

  private generateOrderCode(name: string, email: string): string {
    const firstLetter = name.charAt(0).toUpperCase();
    const emailSuffix = email.slice(-4);
    const timestamp = new Date().toJSON();
    return `${firstLetter}${emailSuffix}${timestamp}`;
  }

  onSubmit(): void {
    if (this.formOrder.valid) {
      const orderData = this.formOrder.value;

      // Crear objeto de orden
      const order: Order = {
        customerName: orderData.customerName,
        email: orderData.email,
        products: orderData.products,
        total: parseFloat(this.total.toFixed(2)),
        orderCode: this.generateOrderCode(orderData.customerName, orderData.email),
        timestamp: new Date().toISOString()
      };

      this.apiService.postOrder(order).subscribe({
        next: () => {
          this.router.navigate(['/orders']);
        },
        error: () => {
          alert('Error al crear la orden');
        }
      });
    } else this.formOrder.markAllAsTouched();
  }
}
