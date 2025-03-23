import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms'; // <-- Agrega esta línea
import { AppComponent } from './app.component';

@NgModule({
  declarations: [
    // Tus componentes aquí (ej: BezierEditorComponent, AppComponent, etc.)
  ],
  imports: [
    BrowserModule,
    FormsModule // <-- Agrega esto al array de imports
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }