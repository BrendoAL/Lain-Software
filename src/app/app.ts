import { AfterViewInit, Component, OnDestroy, signal } from '@angular/core';

type ActiveView = 'home' | 'budget';
type LegalSectionId = 'termos-de-uso' | 'politica-de-privacidade';
type SectionId = 'inicio' | 'servicos' | 'diferenciais' | 'processo' | 'clientes' | 'orcamento' | 'duvidas';
type ClientWork = {
  name: string;
  url: string;
  image: string;
  imageWidth: number;
  imageHeight: number;
  alt: string;
};

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
  protected readonly selectedClient = signal<ClientWork | null>(null);
  protected readonly clientWorks: ClientWork[] = [
    {
      name: 'Artisticamente Egberto',
      url: 'https://artisticamenteegberto.com.br/',
      image: 'artisticamente-egberto.webp',
      imageWidth: 1400,
      imageHeight: 788,
      alt: 'Página inicial do site Artisticamente Egberto'
    },
    {
      name: 'Casa de Jairo',
      url: 'https://casadejairo.online/',
      image: 'casa-de-jairo.webp',
      imageWidth: 1200,
      imageHeight: 877,
      alt: 'Página inicial do site Casa de Jairo'
    }
  ];

  private readonly sectionIds: SectionId[] = ['inicio', 'servicos', 'diferenciais', 'processo', 'clientes', 'orcamento', 'duvidas'];
  private copyFeedbackTimeout?: ReturnType<typeof setTimeout>;
  private activeSectionFrame?: number;
  private topBarResizeObserver?: ResizeObserver;
  private readonly scheduleActiveSectionSync = (): void => {
    if (typeof window === 'undefined' || this.activeSectionFrame !== undefined) {
      return;
    }

    this.activeSectionFrame = window.requestAnimationFrame(() => {
      this.activeSectionFrame = undefined;
      this.syncActiveSection();
    });
  };
  private readonly closeClientOnEscape = (event: KeyboardEvent): void => {
    if (event.key === 'Escape' && this.selectedClient()) {
      this.closeClientPreview();
    }
  };

  ngAfterViewInit(): void {
    if (typeof window === 'undefined') {
      return;
    }

    this.afterViewChange(() => {
      this.syncTopBarHeight();
      this.watchTopBarHeight();
      this.syncActiveSection();
    });
    window.addEventListener('scroll', this.scheduleActiveSectionSync, { passive: true });
    window.addEventListener('resize', this.scheduleActiveSectionSync, { passive: true });
    document.addEventListener('keydown', this.closeClientOnEscape);
  }

  ngOnDestroy(): void {
    clearTimeout(this.copyFeedbackTimeout);

    if (typeof window === 'undefined') {
      return;
    }

    window.removeEventListener('scroll', this.scheduleActiveSectionSync);
    window.removeEventListener('resize', this.scheduleActiveSectionSync);
    document.removeEventListener('keydown', this.closeClientOnEscape);
    this.topBarResizeObserver?.disconnect();
    document.documentElement.style.removeProperty('--top-bar-height');

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

    const topBar = document.querySelector<HTMLElement>('.top-contact-bar');
    const header = document.querySelector<HTMLElement>('.site-header');
    const topBarHeight = topBar?.getBoundingClientRect().height ?? 0;
    const headerOffset = Math.round(topBarHeight + (header?.getBoundingClientRect().height ?? 130) + 44);
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
    this.selectedClient.set(null);
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
    this.selectedClient.set(null);
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
    this.selectedClient.set(null);
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

  protected openClientPreview(client: ClientWork): void {
    this.selectedClient.set(client);
  }

  protected closeClientPreview(): void {
    this.selectedClient.set(null);
  }

  private watchTopBarHeight(): void {
    if (typeof ResizeObserver === 'undefined' || this.topBarResizeObserver) {
      return;
    }

    const topBar = document.querySelector<HTMLElement>('.top-contact-bar');

    if (!topBar) {
      return;
    }

    this.topBarResizeObserver = new ResizeObserver(() => {
      this.syncTopBarHeight();
      this.scheduleActiveSectionSync();
    });
    this.topBarResizeObserver.observe(topBar);
  }

  private syncTopBarHeight(): void {
    if (typeof document === 'undefined') {
      return;
    }

    const topBar = document.querySelector<HTMLElement>('.top-contact-bar');
    const topBarHeight = Math.ceil(topBar?.getBoundingClientRect().height ?? 0);
    document.documentElement.style.setProperty('--top-bar-height', `${topBarHeight}px`);
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
