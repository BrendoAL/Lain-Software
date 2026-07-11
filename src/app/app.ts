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
  protected readonly quoteError = signal('');

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

  protected submitQuote(event: SubmitEvent): void {
    event.preventDefault();

    const form = event.currentTarget as HTMLFormElement;
    const selectedProjects = Array.from(form.querySelectorAll<HTMLInputElement>('input[name="projects"]:checked'))
      .map((input) => input.value);

    if (!form.reportValidity()) {
      this.quoteError.set('Preencha todos os campos obrigatórios antes de solicitar o orçamento.');
      return;
    }

    if (selectedProjects.length === 0) {
      this.quoteError.set('Selecione pelo menos uma opção de projeto.');
      return;
    }

    this.quoteError.set('');

    const data = new FormData(form);
    const message = [
      'Ola, quero solicitar um orçamento com a Lain Software.',
      '',
      `Nome: ${data.get('name')}`,
      `Telefone: ${data.get('phone')}`,
      `Email: ${data.get('email')}`,
      `Empresa: ${data.get('company')}`,
      `Cidade: ${data.get('city')}`,
      `Projetos: ${selectedProjects.join(', ')}`,
      `Resumo: ${data.get('message')}`,
      `Prazo estimado: ${data.get('estimatedTime')}`,
      `Orçamento estimado: ${data.get('budget')}`,
      'Aceite: Li e aceito os Termos de Uso e a Politica de privacidade'
    ].join('\n');

    window.open(`https://wa.me/5547988805984?text=${encodeURIComponent(message)}`, '_blank', 'noopener');
  }
}
