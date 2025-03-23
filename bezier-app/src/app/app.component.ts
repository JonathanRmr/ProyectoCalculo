import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BezierEditorComponent } from './bezier-editor/bezier-editor.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, BezierEditorComponent],
  template: `
    <div class="container">
      <h1>Editor de Curvas de Bézier</h1>
      <p>
        Crea y manipula curvas de Bézier arrastrando los puntos de control.
        Puedes añadir nuevos puntos haciendo clic en el canvas o usando el botón.
      </p>
      <app-bezier-editor></app-bezier-editor>
    </div>
  `,
  styles: [`
    .container {
      max-width: 1000px;
      margin: 0 auto;
      padding: 20px;
      font-family: Arial, sans-serif;
    }
    h1 {
      color: #333;
    }
  `]
})
export class AppComponent {}