import { TestBed } from '@angular/core/testing';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render the Lain Software landing page', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Sites e sistemas que geram resultado');
    expect(compiled.querySelector('.nav-links a[href="#inicio"]')?.textContent).toContain('Início');
    expect(compiled.textContent).toContain('Quero meu orçamento');
    expect(compiled.textContent).toContain('Porque escolher a Lain Software');
    expect(compiled.textContent).toContain('Quanto tempo leva para receber uma proposta?');
    expect(compiled.querySelector('form.quote-form input[name="email"]')).toBeTruthy();
    expect(compiled.querySelectorAll('input[name="projects"]').length).toBeGreaterThan(1);
    expect(compiled.querySelector('a[href^="https://wa.me/5547988805984"]')).toBeTruthy();
  });
});
