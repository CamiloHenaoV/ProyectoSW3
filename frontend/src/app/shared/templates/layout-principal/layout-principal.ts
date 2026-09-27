import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-layout-principal',
  imports: [RouterOutlet, RouterLink],
  templateUrl: './layout-principal.html',
  styleUrl: './layout-principal.scss'
})
export class LayoutPrincipal {}
