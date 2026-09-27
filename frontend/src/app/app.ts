import { Component } from '@angular/core';
import { LayoutPrincipal } from './shared/templates/layout-principal/layout-principal';

@Component({
  selector: 'app-root',
  imports: [LayoutPrincipal],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {}
