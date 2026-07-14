import { AfterViewInit, Component, OnDestroy, signal } from '@angular/core';

type ActiveView = 'home' | 'budget';
type LegalSectionId = 'termos-de-uso' | 'politica-de-privacidade';
type SectionId = 'inicio' | 'servicos' | 'diferenciais' | 'processo' | 'orcamento' | 'duvidas';

@Component({
  selector: 'app-root',
  imports: [],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements AfterViewInit, OnDestroy {
  protected readonly title = signal('lain-software');
  protected readonly copiedPhone = signal(false);
  protected readonly quoteError = signal('');
  protected readonly activeView = signal<ActiveView>('home');
  protected readonly activeSection = signal<SectionId>('inicio');
  protected readonly activeLegalSection = signal<LegalSectionId | null>(null);

  private readonly sectionIds: SectionId[] = ['inicio', 'servicos', 'diferenciais', 'processo', 'orcamento', 'duvidas'];
  private copyFeedbackTimeout?: ReturnType<typeof setTimeout>;
  private activeSectionFrame?: number;
  private readonly scheduleActiveSectionSync = (): void => {
    if (typeof window === 'undefined' || this.activeSectionFrame !== undefined) {
      return;
    }

    this.activeSectionFrame = window.requestAnimationFrame(() => {
      this.activeSectionFrame = undefined;
      this.syncActiveSection();
    });
  };

  ngAfterViewInit(): void {
    if (typeof window === 'undefined') {
      return;
    }

    this.afterViewChange(() => this.syncActiveSection());
    window.addEventListener('scroll', this.scheduleActiveSectionSync, { passive: true });
    window.addEventListener('resize', this.scheduleActiveSectionSync, { passive: true });
  }

  ngOnDestroy(): void {
    clearTimeout(this.copyFeedbackTimeout);

    if (typeof window === 'undefined') {
      return;
    }

    window.removeEventListener('scroll', this.scheduleActiveSectionSync);
    window.removeEventListener('resize', this.scheduleActiveSectionSync);

    if (this.activeSectionFrame !== undefined) {
      window.cancelAnimationFrame(this.activeSectionFrame);
    }
  }

  protected syncActiveSection(): void {
    if (typeof document === 'undefined') {
      return;
    }

    if (this.activeView() !== 'home') {
      return;
    }

    const header = document.querySelector<HTMLElement>('.site-header');
    const headerOffset = Math.round((header?.getBoundingClientRect().height ?? 130) + 44);
    let currentSection: SectionId = 'inicio';

    for (const sectionId of this.sectionIds) {
      const section = document.getElementById(sectionId);

      if (!section) {
        continue;
      }

      const rect = section.getBoundingClientRect();

      if (rect.top <= headerOffset && rect.bottom > headerOffset) {
        currentSection = sectionId;
        break;
      }

      if (rect.top <= headerOffset) {
        currentSection = sectionId;
      }
    }

    this.activeSection.set(currentSection);
  }

  protected async copyPhone(): Promise<void> {
    const phone = '+5547988805984';

    await this.copyText(phone);

    this.copiedPhone.set(true);
    clearTimeout(this.copyFeedbackTimeout);
    this.copyFeedbackTimeout = setTimeout(() => this.copiedPhone.set(false), 1800);
  }

  protected showHomeSection(event: Event, sectionId: SectionId): void {
    event.preventDefault();
    this.activeView.set('home');
    this.activeSection.set(sectionId);
    this.activeLegalSection.set(null);
    this.quoteError.set('');

    this.afterViewChange(() => {
      const target = document.getElementById(sectionId);

      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }

      history.replaceState(null, '', sectionId === 'inicio' ? location.pathname : `#${sectionId}`);
      this.syncActiveSection();
    });
  }

  protected showBudgetTab(event: Event): void {
    event.preventDefault();
    this.activeView.set('budget');
    this.activeSection.set('orcamento');
    this.activeLegalSection.set(null);
    this.quoteError.set('');

    this.afterViewChange(() => {
      document.getElementById('orcamento-tab')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      history.replaceState(null, '', '#orcamento-tab');
    });
  }

  protected showLegalSection(event: Event, sectionId: LegalSectionId): void {
    event.preventDefault();
    event.stopPropagation();
    this.activeLegalSection.set(sectionId);
    this.quoteError.set('');

    this.afterViewChange(() => {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      history.replaceState(null, '', `#${sectionId}`);
    });
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

    window.open(`https://wa.me/5547988805984?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
  }

  private afterViewChange(callback: () => void): void {
    setTimeout(callback);
  }

  private async copyText(text: string): Promise<void> {
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        return;
      } catch {
        // Fall back to the hidden input copy path below.
      }
    }

    const input = document.createElement('input');
    input.value = text;
    input.style.position = 'fixed';
    input.style.opacity = '0';
    document.body.appendChild(input);
    input.select();
    document.execCommand('copy');
    input.remove();
  }
}
