import { Component, ElementRef, ViewChild, AfterViewInit, HostListener } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-bezier-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container">
      <header>
        <h1>Editor de Curvas de Bézier</h1>
        <p>Explora y anima curvas de Bézier con facilidad.</p>
      </header>
      <div class="controls">
        <button (click)="clear()">Limpiar</button>
        <button (click)="addControlPoint()">Añadir Punto</button>
        <button (click)="animateCurve()">Animar Curva</button>
        <div class="color-picker">
          <label>Color de Curva:</label>
          <input type="color" [(ngModel)]="curveColor" (change)="render()">
        </div>
        <div class="color-picker">
          <label>Color de Puntos:</label>
          <input type="color" [(ngModel)]="pointColor" (change)="render()">
        </div>
      </div>
      <canvas #canvas width="800" height="600"></canvas>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      font-family: 'Arial', sans-serif;
      color: #333;
    }
    .container {
      max-width: 900px;
      margin: 0 auto;
      padding: 20px;
      background: #f4f4f9;
      border-radius: 10px;
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
    }
    header {
      text-align: center;
      margin-bottom: 20px;
    }
    header h1 {
      font-size: 2rem;
      color: #0066ff;
    }
    header p {
      font-size: 1rem;
      color: #555;
    }
    .controls {
      display: flex;
      flex-wrap: wrap;
      gap: 15px;
      justify-content: center;
      margin-bottom: 20px;
    }
    button {
      padding: 10px 20px;
      font-size: 1rem;
      color: #fff;
      background: #0066ff;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      transition: background 0.3s ease;
    }
    button:hover {
      background: #0052cc;
    }
    .color-picker {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    canvas {
      display: block;
      margin: 0 auto;
      border: 2px solid #ccc;
      border-radius: 10px;
      background: linear-gradient(135deg, #e0e7ff, #f9f9f9);
    }
  `]
})
export class BezierEditorComponent implements AfterViewInit {
  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  private ctx!: CanvasRenderingContext2D;
  private controlPoints: { x: number, y: number }[] = [];
  private selectedPoint: number | null = null;
  private dragging = false;
  private animating = false;
  private animationProgress = 0;
  private animationFrame: number | null = null;
  
  // Colores configurables
  curveColor = '#0066ff'; 
  pointColor = '#ff6600';

  constructor() {}

  ngAfterViewInit(): void {
    const canvas = this.canvasRef.nativeElement;
    this.ctx = canvas.getContext('2d')!;
    this.render();
  }

  public render(): void {
    const canvas = this.canvasRef.nativeElement;
    this.ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Dibujar líneas entre puntos de control
    if (this.controlPoints.length > 1) {
      this.ctx.beginPath();
      this.ctx.moveTo(this.controlPoints[0].x, this.controlPoints[0].y);
      for (let i = 1; i < this.controlPoints.length; i++) {
        this.ctx.lineTo(this.controlPoints[i].x, this.controlPoints[i].y);
      }
      this.ctx.strokeStyle = '#aaa';
      this.ctx.stroke();
    }
    
    // Dibujar curva de Bézier
    if (this.controlPoints.length >= 2) {
      // Si estamos animando, dibujar solo hasta el progreso actual
      const progress = this.animating ? this.animationProgress : 1;
      
      this.ctx.beginPath();
      
      if (this.controlPoints.length === 2) {
        // Línea recta para 2 puntos
        const startX = this.controlPoints[0].x;
        const startY = this.controlPoints[0].y;
        const endX = this.controlPoints[1].x;
        const endY = this.controlPoints[1].y;
        
        this.ctx.moveTo(startX, startY);
        this.ctx.lineTo(
          startX + (endX - startX) * progress,
          startY + (endY - startY) * progress
        );
      } else if (this.controlPoints.length === 3) {
        // Curva cuadrática para 3 puntos
        this.drawQuadraticBezier(
          this.controlPoints[0],
          this.controlPoints[1],
          this.controlPoints[2],
          progress
        );
      } else if (this.controlPoints.length === 4) {
        // Curva cúbica para 4 puntos
        this.drawCubicBezier(
          this.controlPoints[0],
          this.controlPoints[1],
          this.controlPoints[2],
          this.controlPoints[3],
          progress
        );
      } else {
        // Para más de 4 puntos, dividir en múltiples curvas
        this.drawMultiSegmentBezier(progress);
      }
      
      // Aplicar un efecto de degradado en la curva si está animando
      if (this.animating) {
        const gradient = this.ctx.createLinearGradient(
          this.controlPoints[0].x, this.controlPoints[0].y,
          this.controlPoints[this.controlPoints.length - 1].x, 
          this.controlPoints[this.controlPoints.length - 1].y
        );
        gradient.addColorStop(0, this.curveColor);
        gradient.addColorStop(1, this.shiftHue(this.curveColor, 60));
        this.ctx.strokeStyle = gradient;
      } else {
        this.ctx.strokeStyle = this.curveColor;
      }
      
      this.ctx.lineWidth = 3;
      this.ctx.stroke();
      this.ctx.lineWidth = 1;
    }
    
    // Dibujar puntos de control
    this.controlPoints.forEach((point, index) => {
      // Efecto de brillo para el punto seleccionado
      if (this.selectedPoint === index) {
        this.ctx.beginPath();
        this.ctx.arc(point.x, point.y, 10, 0, Math.PI * 2);
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        this.ctx.fill();
      }
      
      this.ctx.beginPath();
      this.ctx.arc(point.x, point.y, 6, 0, Math.PI * 2);
      
      // Color base para puntos de control o seleccionado
      const baseColor = this.selectedPoint === index ? 
        this.shiftHue(this.pointColor, 180) : 
        this.pointColor;
        
      this.ctx.fillStyle = baseColor;
      this.ctx.fill();
      
      // Borde del punto
      this.ctx.strokeStyle = '#333';
      this.ctx.stroke();
      
      // Numerar los puntos
      this.ctx.fillStyle = '#000';
      this.ctx.fillText(`P${index}`, point.x + 10, point.y - 10);
    });
  }
  
  // Función para cambiar el tono de un color
  private shiftHue(hex: string, shift: number): string {
    // Convertir hex a HSL
    let r = parseInt(hex.slice(1, 3), 16) / 255;
    let g = parseInt(hex.slice(3, 5), 16) / 255;
    let b = parseInt(hex.slice(5, 7), 16) / 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    
    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
        default: h = 0;
      }
      h /= 6;
    }
    
    // Aplicar el cambio de tono
    h = (h * 360 + shift) % 360 / 360;
    
    // Convertir de vuelta a RGB
    let r1, g1, b1;
    if (s === 0) {
      r1 = g1 = b1 = l;
    } else {
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };
      
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r1 = hue2rgb(p, q, h + 1/3);
      g1 = hue2rgb(p, q, h);
      b1 = hue2rgb(p, q, h - 1/3);
    }
    
    // Convertir a hex
    const toHex = (x: number) => {
      const hex = Math.round(x * 255).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    
    return `#${toHex(r1)}${toHex(g1)}${toHex(b1)}`;
  }
  
  private drawQuadraticBezier(p0: any, p1: any, p2: any, t: number): void {
    const points = [];
    const steps = Math.ceil(t * 100);
    
    for (let i = 0; i <= steps; i++) {
      const step = i / steps;
      const x = Math.pow(1 - step, 2) * p0.x + 
                2 * (1 - step) * step * p1.x + 
                Math.pow(step, 2) * p2.x;
      const y = Math.pow(1 - step, 2) * p0.y + 
                2 * (1 - step) * step * p1.y + 
                Math.pow(step, 2) * p2.y;
      points.push({ x, y });
    }
    
    this.ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      this.ctx.lineTo(points[i].x, points[i].y);
    }
  }
  
  private drawCubicBezier(p0: any, p1: any, p2: any, p3: any, t: number): void {
    const points = [];
    const steps = Math.ceil(t * 100);
    
    for (let i = 0; i <= steps; i++) {
      const step = i / steps;
      const x = Math.pow(1 - step, 3) * p0.x + 
                3 * Math.pow(1 - step, 2) * step * p1.x + 
                3 * (1 - step) * Math.pow(step, 2) * p2.x + 
                Math.pow(step, 3) * p3.x;
      const y = Math.pow(1 - step, 3) * p0.y + 
                3 * Math.pow(1 - step, 2) * step * p1.y + 
                3 * (1 - step) * Math.pow(step, 2) * p2.y + 
                Math.pow(step, 3) * p3.y;
      points.push({ x, y });
    }
    
    this.ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      this.ctx.lineTo(points[i].x, points[i].y);
    }
  }
  
  private drawMultiSegmentBezier(t: number): void {
    this.ctx.moveTo(this.controlPoints[0].x, this.controlPoints[0].y);
    
    // Determinar cuántos segmentos se deben dibujar basado en t
    const numSegments = Math.floor((this.controlPoints.length - 1) / 3);
    const lastSegmentPoints = (this.controlPoints.length - 1) % 3;
    const segmentsToRender = t >= 1 ? numSegments : Math.floor(t * numSegments) + (t - Math.floor(t * numSegments) / numSegments > 0 ? 1 : 0);
    
    for (let i = 0; i < segmentsToRender; i++) {
      const isLastSegment = i === numSegments - 1;
      const segmentT = isLastSegment ? 
                       (t * numSegments - i) : 
                       (i < Math.floor(t * numSegments) ? 1 : 0);
      
      if (i * 3 + 3 < this.controlPoints.length) {
        // Segmento completo (curva cúbica)
        this.drawCubicBezier(
          this.controlPoints[i * 3],
          this.controlPoints[i * 3 + 1],
          this.controlPoints[i * 3 + 2],
          this.controlPoints[i * 3 + 3],
          segmentT
        );
      } else if (i * 3 + 2 < this.controlPoints.length) {
        // Segmento para una curva cuadrática
        this.drawQuadraticBezier(
          this.controlPoints[i * 3],
          this.controlPoints[i * 3 + 1],
          this.controlPoints[i * 3 + 2],
          segmentT
        );
      } else if (i * 3 + 1 < this.controlPoints.length) {
        // Segmento para una línea recta
        const p0 = this.controlPoints[i * 3];
        const p1 = this.controlPoints[i * 3 + 1];
        this.ctx.lineTo(p0.x + (p1.x - p0.x) * segmentT, p0.y + (p1.y - p0.y) * segmentT);
      }
    }
  }

  animateCurve(): void {
    if (this.controlPoints.length < 2) return;

    // Detener cualquier animación previa
    if (this.animationFrame !== null) {
      cancelAnimationFrame(this.animationFrame);
    }

    this.animating = true;
    this.animationProgress = 0;

    const animate = () => {
      // Incrementar el progreso de la animación
      this.animationProgress += 0.01;

      // Limitar el progreso al 1 (100%)
      if (this.animationProgress >= 1) {
        this.animationProgress = 1;
        this.animating = false;
      }

      // Renderizar la curva con el progreso actual
      this.render();

      // Continuar la animación si no ha terminado
      if (this.animating) {
        this.animationFrame = requestAnimationFrame(animate);
      } else {
        this.animationFrame = null; // Limpiar el frame de animación
      }
    };

    // Iniciar la animación
    this.animationFrame = requestAnimationFrame(animate);
  }

  addControlPoint(): void {
    const canvas = this.canvasRef.nativeElement;
    this.controlPoints.push({
      x: Math.random() * (canvas.width - 100) + 50,
      y: Math.random() * (canvas.height - 100) + 50
    });
    this.render();
  }

  clear(): void {
    this.controlPoints = [];
    this.selectedPoint = null;
    if (this.animationFrame !== null) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
    this.animating = false;
    this.render();
  }

  @HostListener('mousedown', ['$event'])
  onMouseDown(event: MouseEvent): void {
    if (this.animating) return;
    
    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Verificar si se hizo clic en un punto de control
    for (let i = 0; i < this.controlPoints.length; i++) {
      const point = this.controlPoints[i];
      const distance = Math.sqrt(Math.pow(point.x - x, 2) + Math.pow(point.y - y, 2));
      
      if (distance <= 8) {
        this.selectedPoint = i;
        this.dragging = true;
        this.render();
        return;
      }
    }
    
    // Si no se hizo clic en un punto existente, crear uno nuevo
    this.controlPoints.push({ x, y });
    this.selectedPoint = this.controlPoints.length - 1;
    this.dragging = true;
    this.render();
  }

  @HostListener('mousemove', ['$event'])
  onMouseMove(event: MouseEvent): void {
    if (this.dragging && this.selectedPoint !== null && !this.animating) {
      const rect = this.canvasRef.nativeElement.getBoundingClientRect();
      this.controlPoints[this.selectedPoint].x = event.clientX - rect.left;
      this.controlPoints[this.selectedPoint].y = event.clientY - rect.top;
      this.render();
    }
  }

  @HostListener('mouseup')
  onMouseUp(): void {
    this.dragging = false;
  }

  @HostListener('mouseleave')
  onMouseLeave(): void {
    this.dragging = false;
  }
}