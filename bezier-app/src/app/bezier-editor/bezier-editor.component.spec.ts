import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BezierEditorComponent } from './bezier-editor.component';
import { beforeEach, describe, it } from 'node:test';
import { expect } from 'chai';

describe('BezierEditorComponent', () => {
  let component: BezierEditorComponent;
  let fixture: ComponentFixture<BezierEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BezierEditorComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BezierEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).to.be.true;
  });
}
)
