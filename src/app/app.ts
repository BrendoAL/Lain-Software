import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-root',
  imports: [],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('lain-software');
  protected readonly copiedPhone = signal(false);

  private copyFeedbackTimeout?: ReturnType<typeof setTimeout>;

  protected async copyPhone(): Promise<void> {
    const phone = '+5547988805984';

    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(phone);
    } else {
      const input = document.createElement('input');
      input.value = phone;
      input.style.position = 'fixed';
      input.style.opacity = '0';
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      input.remove();
    }

    this.copiedPhone.set(true);
    clearTimeout(this.copyFeedbackTimeout);
    this.copyFeedbackTimeout = setTimeout(() => this.copiedPhone.set(false), 1800);
  }
}
