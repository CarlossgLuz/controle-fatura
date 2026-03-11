import type { AppLanguage, ThemePreference } from '@/data/local/app-settings';

export interface AppStrings {
  common: {
    unknownError: string;
    tryAgain: string;
    loading: string;
    appName: string;
    localFirstHint: string;
    linkedIn: string;
    appVersion: (version: string) => string;
    copyright: (year: number) => string;
  };
  tabs: {
    home: string;
    launch: string;
    planning: string;
    insights: string;
  };
  boot: {
    preparing: string;
    subtitle: string;
    loadingDatabase: string;
    loadingOnboarding: string;
    loadingPreferences: string;
    finishing: string;
  };
  layout: {
    databaseInitError: (error: string) => string;
    databaseInitErrorGeneric: string;
  };
  appearance: {
    sectionTitle: string;
    sectionSubtitle: string;
    themeLabel: string;
    languageLabel: string;
    themeOptions: Record<ThemePreference, string>;
    languageOptions: Record<AppLanguage, string>;
  };
  onboarding: {
    subtitle: string;
    bullets: string[];
    start: string;
  };
  home: {
    eyebrow: string;
    title: string;
    subtitle: string;
    loading: string;
    loadFailedTitle: string;
    loadFailedDescription: string;
    loadError: (message: string) => string;
    monthBalanceLabel: (monthLabel: string) => string;
    income: string;
    expense: string;
    fixedMonth: string;
    currentInvoice: string;
    cardCycleTitle: string;
    cardCycleSubtitle: string;
    closing: string;
    due: string;
    budgetTitle: string;
    budgetNoTarget: string;
    budgetProgress: (spent: string, target: string) => string;
    recentTitle: string;
    recentSubtitle: string;
    emptyMovementsTitle: string;
    emptyMovementsDescription: string;
    refreshData: string;
  };
  launch: {
    eyebrow: string;
    title: string;
    subtitle: string;
    saving: string;
    save: string;
    income: string;
    expense: string;
    fixed: string;
    newFixedTitle: string;
    newFixedSubtitle: string;
    newEntryTitle: string;
    newEntrySubtitle: string;
    amount: string;
    description: string;
    dayOfMonth: string;
    date: string;
    category: string;
    valuePlaceholder: string;
    descriptionPlaceholder: string;
    dayPlaceholder: string;
    loadingCategories: string;
    noCategoriesTitle: string;
    noCategoriesDescription: string;
    categoryLoadError: string;
    validationDescription: string;
    validationAmount: string;
    validationCategory: string;
    validationDay: string;
    saveSuccessFixed: string;
    saveSuccessEntry: string;
    saveError: string;
  };
  insights: {
    eyebrow: string;
    title: string;
    subtitle: string;
    loading: string;
    loadError: (message: string) => string;
    loadFailedTitle: string;
    loadFailedDescription: string;
    noDataTitle: string;
    noDataDescription: string;
    staleData: string;
    sectionIncomeVsExpenseTitle: string;
    sectionIncomeVsExpenseSubtitle: string;
    sectionCategoryTitle: string;
    sectionCategorySubtitle: string;
    sectionFixedVariableTitle: string;
    sectionFixedVariableSubtitle: string;
    sectionPaymentTitle: string;
    sectionPaymentSubtitle: string;
    incomeLabel: string;
    expenseLabel: string;
    fixedLabel: string;
    variableLabel: string;
    noExpenses: string;
    noMovements: string;
    budgetTitle: string;
    budgetNoTarget: string;
    budgetProgress: (spent: string, target: string) => string;
    linkedinError: string;
    aboutTitle: string;
    aboutSubtitle: string;
    developedBy: string;
  };
  datePicker: {
    weekDays: string[];
    selectDate: string;
    close: string;
    today: string;
  };
}

export const translations: Record<AppLanguage, AppStrings> = {
  'pt-BR': {
    common: {
      unknownError: 'erro desconhecido',
      tryAgain: 'Tentar novamente',
      loading: 'Carregando...',
      appName: 'Clarium',
      localFirstHint: 'Seus dados ficam no seu dispositivo.',
      linkedIn: 'LinkedIn',
      appVersion: (version: string) => `Versão ${version}`,
      copyright: (year: number) => `© ${year} Carlos Gabriel. Todos os direitos reservados.`,
    },
    tabs: {
      home: 'Início',
      launch: 'Lançar',
      planning: 'Planejamento',
      insights: 'Insights',
    },
    boot: {
      preparing: 'Preparando o Clarium',
      subtitle: 'Ambiente local seguro e rápido.',
      loadingDatabase: 'Inicializando banco local',
      loadingOnboarding: 'Validando onboarding',
      loadingPreferences: 'Carregando preferências',
      finishing: 'Finalizando inicialização',
    },
    layout: {
      databaseInitError: (error: string) => `Não foi possível inicializar o banco local (${error}).`,
      databaseInitErrorGeneric: 'Não foi possível inicializar o app agora. Tente abrir novamente.',
    },
    appearance: {
      sectionTitle: 'Aparência e idioma',
      sectionSubtitle: 'Preferências do app',
      themeLabel: 'Tema',
      languageLabel: 'Idioma',
      themeOptions: {
        system: 'Sistema',
        light: 'Claro',
        dark: 'Escuro',
      },
      languageOptions: {
        'pt-BR': 'Português',
        en: 'English',
        es: 'Español',
      },
    },
    onboarding: {
      subtitle: 'Bem-vindo ao Clarium: 1 cartão, receitas, gastos fixos e meta mensal, tudo local.',
      bullets: [
        '• 1 cartão principal',
        '• Sem saldo de conta',
        '• Lançamentos avulsos e recorrentes',
        '• Meta mensal para controle',
      ],
      start: 'Começar',
    },
    home: {
      eyebrow: 'Visão mensal',
      title: 'Início',
      subtitle: 'Resumo direto do mês, sem ruído visual.',
      loading: 'Carregando dados...',
      loadFailedTitle: 'Falha ao carregar',
      loadFailedDescription: 'Não conseguimos buscar os dados do mês agora.',
      loadError: (message: string) => `Não foi possível carregar os dados de início (${message}).`,
      monthBalanceLabel: (monthLabel: string) => `Saldo de ${monthLabel}`,
      income: 'Entradas',
      expense: 'Saídas',
      fixedMonth: 'Fixos do mês',
      currentInvoice: 'Fatura atual',
      cardCycleTitle: 'Ciclo do cartão',
      cardCycleSubtitle: 'Cartão principal',
      closing: 'Fechamento',
      due: 'Vencimento',
      budgetTitle: 'Meta mensal',
      budgetNoTarget: 'Defina uma meta no Planejamento para acompanhar.',
      budgetProgress: (spent: string, target: string) => `${spent} de ${target}`,
      recentTitle: 'Últimos lançamentos',
      recentSubtitle: 'Movimentações recentes do mês',
      emptyMovementsTitle: 'Sem movimentações',
      emptyMovementsDescription: 'Use a aba Lançar para registrar a primeira receita ou gasto.',
      refreshData: 'Atualizar dados',
    },
    launch: {
      eyebrow: 'Fluxo guiado',
      title: 'Lançar',
      subtitle: 'Escolha o tipo e preencha só o necessário.',
      saving: 'Salvando...',
      save: 'Salvar lançamento',
      income: 'Receita',
      expense: 'Gasto',
      fixed: 'Fixo',
      newFixedTitle: 'Novo fixo',
      newFixedSubtitle: 'Será repetido mensalmente.',
      newEntryTitle: 'Novo lançamento',
      newEntrySubtitle: 'Entra no mês atual.',
      amount: 'Valor',
      description: 'Descrição',
      dayOfMonth: 'Dia do mês',
      date: 'Data',
      category: 'Categoria',
      valuePlaceholder: '0,00',
      descriptionPlaceholder: 'Ex: Mercado, salário, aluguel',
      dayPlaceholder: 'Ex: 10',
      loadingCategories: 'Carregando categorias...',
      noCategoriesTitle: 'Sem categorias',
      noCategoriesDescription: 'Crie uma categoria para esse tipo e continue o lançamento.',
      categoryLoadError: 'Não foi possível carregar categorias.',
      validationDescription: 'Descrição é obrigatória.',
      validationAmount: 'Informe um valor válido.',
      validationCategory: 'Selecione uma categoria válida.',
      validationDay: 'Dia do mês inválido para lançamento fixo.',
      saveSuccessFixed: 'Fixo salvo no Planejamento.',
      saveSuccessEntry: 'Lançamento salvo.',
      saveError: 'Não foi possível salvar agora.',
    },
    insights: {
      eyebrow: 'Leitura analítica',
      title: 'Insights',
      subtitle: 'Comparativos simples para decidir próximos ajustes.',
      loading: 'Carregando insights...',
      loadError: (message: string) => `Não foi possível carregar os insights (${message}).`,
      loadFailedTitle: 'Falha ao carregar',
      loadFailedDescription: 'Não foi possível montar os insights neste momento.',
      noDataTitle: 'Sem dados suficientes',
      noDataDescription: 'Registre receitas e gastos na aba Lançar para liberar estes insights.',
      staleData: 'Dados podem estar desatualizados.',
      sectionIncomeVsExpenseTitle: 'Receitas vs gastos',
      sectionIncomeVsExpenseSubtitle: 'Equilíbrio mensal',
      sectionCategoryTitle: 'Gastos por categoria',
      sectionCategorySubtitle: 'Categorias com maior peso',
      sectionFixedVariableTitle: 'Fixos vs variáveis',
      sectionFixedVariableSubtitle: 'Composição dos gastos',
      sectionPaymentTitle: 'Forma de pagamento',
      sectionPaymentSubtitle: 'Onde você mais concentra gastos',
      incomeLabel: 'Receitas',
      expenseLabel: 'Gastos',
      fixedLabel: 'Fixos',
      variableLabel: 'Variáveis',
      noExpenses: 'Sem gastos no mês.',
      noMovements: 'Sem movimentações no mês.',
      budgetTitle: 'Progresso da meta',
      budgetNoTarget: 'Meta mensal não definida no Planejamento.',
      budgetProgress: (spent: string, target: string) => `${spent} de ${target}`,
      linkedinError: 'Não foi possível abrir o LinkedIn agora.',
      aboutTitle: 'Sobre',
      aboutSubtitle: 'Autoria e licença',
      developedBy: 'Desenvolvido por Carlos Gabriel',
    },
    datePicker: {
      weekDays: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'],
      selectDate: 'Selecionar data',
      close: 'Fechar',
      today: 'Hoje',
    },
  },
  en: {
    common: {
      unknownError: 'unknown error',
      tryAgain: 'Try again',
      loading: 'Loading...',
      appName: 'Clarium',
      localFirstHint: 'Your data stays on your device.',
      linkedIn: 'LinkedIn',
      appVersion: (version: string) => `Version ${version}`,
      copyright: (year: number) => `© ${year} Carlos Gabriel. All rights reserved.`,
    },
    tabs: {
      home: 'Home',
      launch: 'Add',
      planning: 'Planning',
      insights: 'Insights',
    },
    boot: {
      preparing: 'Preparing Clarium',
      subtitle: 'Secure and fast local environment.',
      loadingDatabase: 'Initializing local database',
      loadingOnboarding: 'Checking onboarding',
      loadingPreferences: 'Loading preferences',
      finishing: 'Finishing startup',
    },
    layout: {
      databaseInitError: (error: string) => `Could not initialize local database (${error}).`,
      databaseInitErrorGeneric: 'Could not initialize the app right now. Please try reopening it.',
    },
    appearance: {
      sectionTitle: 'Appearance and language',
      sectionSubtitle: 'App preferences',
      themeLabel: 'Theme',
      languageLabel: 'Language',
      themeOptions: {
        system: 'System',
        light: 'Light',
        dark: 'Dark',
      },
      languageOptions: {
        'pt-BR': 'Português',
        en: 'English',
        es: 'Español',
      },
    },
    onboarding: {
      subtitle: 'Welcome to Clarium: 1 card, income, fixed expenses, and a monthly goal, all local.',
      bullets: ['• 1 main card', '• No account balance', '• One-time and recurring entries', '• Monthly goal tracking'],
      start: 'Start',
    },
    home: {
      eyebrow: 'Monthly overview',
      title: 'Home',
      subtitle: 'Direct month summary with no visual noise.',
      loading: 'Loading data...',
      loadFailedTitle: 'Failed to load',
      loadFailedDescription: 'We could not fetch this month data right now.',
      loadError: (message: string) => `Could not load home data (${message}).`,
      monthBalanceLabel: (monthLabel: string) => `Balance for ${monthLabel}`,
      income: 'Income',
      expense: 'Expenses',
      fixedMonth: 'Fixed expenses',
      currentInvoice: 'Current invoice',
      cardCycleTitle: 'Card cycle',
      cardCycleSubtitle: 'Main card',
      closing: 'Closing',
      due: 'Due',
      budgetTitle: 'Monthly goal',
      budgetNoTarget: 'Set a goal in Planning to track progress.',
      budgetProgress: (spent: string, target: string) => `${spent} of ${target}`,
      recentTitle: 'Recent entries',
      recentSubtitle: 'Latest month movements',
      emptyMovementsTitle: 'No movements yet',
      emptyMovementsDescription: 'Use the Add tab to register your first income or expense.',
      refreshData: 'Refresh data',
    },
    launch: {
      eyebrow: 'Guided flow',
      title: 'Add',
      subtitle: 'Choose the type and fill only what is needed.',
      saving: 'Saving...',
      save: 'Save entry',
      income: 'Income',
      expense: 'Expense',
      fixed: 'Fixed',
      newFixedTitle: 'New fixed expense',
      newFixedSubtitle: 'It will repeat monthly.',
      newEntryTitle: 'New entry',
      newEntrySubtitle: 'It goes into the current month.',
      amount: 'Amount',
      description: 'Description',
      dayOfMonth: 'Day of month',
      date: 'Date',
      category: 'Category',
      valuePlaceholder: '0.00',
      descriptionPlaceholder: 'Ex: Groceries, salary, rent',
      dayPlaceholder: 'Ex: 10',
      loadingCategories: 'Loading categories...',
      noCategoriesTitle: 'No categories',
      noCategoriesDescription: 'Create a category for this type to continue.',
      categoryLoadError: 'Could not load categories.',
      validationDescription: 'Description is required.',
      validationAmount: 'Enter a valid amount.',
      validationCategory: 'Select a valid category.',
      validationDay: 'Invalid day of month for fixed entry.',
      saveSuccessFixed: 'Fixed expense saved in Planning.',
      saveSuccessEntry: 'Entry saved.',
      saveError: 'Could not save right now.',
    },
    insights: {
      eyebrow: 'Analytical view',
      title: 'Insights',
      subtitle: 'Simple comparisons to guide next adjustments.',
      loading: 'Loading insights...',
      loadError: (message: string) => `Could not load insights (${message}).`,
      loadFailedTitle: 'Failed to load',
      loadFailedDescription: 'Could not build insights right now.',
      noDataTitle: 'Not enough data',
      noDataDescription: 'Add income and expenses in Add to unlock insights.',
      staleData: 'Data may be outdated.',
      sectionIncomeVsExpenseTitle: 'Income vs expenses',
      sectionIncomeVsExpenseSubtitle: 'Monthly balance',
      sectionCategoryTitle: 'Expenses by category',
      sectionCategorySubtitle: 'Highest-impact categories',
      sectionFixedVariableTitle: 'Fixed vs variable',
      sectionFixedVariableSubtitle: 'Expense composition',
      sectionPaymentTitle: 'Payment method',
      sectionPaymentSubtitle: 'Where spending is concentrated',
      incomeLabel: 'Income',
      expenseLabel: 'Expenses',
      fixedLabel: 'Fixed',
      variableLabel: 'Variable',
      noExpenses: 'No expenses this month.',
      noMovements: 'No movements this month.',
      budgetTitle: 'Goal progress',
      budgetNoTarget: 'Monthly goal not set in Planning.',
      budgetProgress: (spent: string, target: string) => `${spent} of ${target}`,
      linkedinError: 'Could not open LinkedIn right now.',
      aboutTitle: 'About',
      aboutSubtitle: 'Author and license',
      developedBy: 'Developed by Carlos Gabriel',
    },
    datePicker: {
      weekDays: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      selectDate: 'Select date',
      close: 'Close',
      today: 'Today',
    },
  },
  es: {
    common: {
      unknownError: 'error desconocido',
      tryAgain: 'Intentar de nuevo',
      loading: 'Cargando...',
      appName: 'Clarium',
      localFirstHint: 'Tus datos permanecen en tu dispositivo.',
      linkedIn: 'LinkedIn',
      appVersion: (version: string) => `Versión ${version}`,
      copyright: (year: number) => `© ${year} Carlos Gabriel. Todos los derechos reservados.`,
    },
    tabs: {
      home: 'Inicio',
      launch: 'Registrar',
      planning: 'Planificación',
      insights: 'Insights',
    },
    boot: {
      preparing: 'Preparando Clarium',
      subtitle: 'Entorno local seguro y rápido.',
      loadingDatabase: 'Inicializando base local',
      loadingOnboarding: 'Validando onboarding',
      loadingPreferences: 'Cargando preferencias',
      finishing: 'Finalizando inicio',
    },
    layout: {
      databaseInitError: (error: string) => `No se pudo inicializar la base local (${error}).`,
      databaseInitErrorGeneric: 'No se pudo inicializar la app ahora. Intenta abrirla nuevamente.',
    },
    appearance: {
      sectionTitle: 'Apariencia e idioma',
      sectionSubtitle: 'Preferencias de la app',
      themeLabel: 'Tema',
      languageLabel: 'Idioma',
      themeOptions: {
        system: 'Sistema',
        light: 'Claro',
        dark: 'Oscuro',
      },
      languageOptions: {
        'pt-BR': 'Português',
        en: 'English',
        es: 'Español',
      },
    },
    onboarding: {
      subtitle: 'Bienvenido a Clarium: 1 tarjeta, ingresos, gastos fijos y meta mensual, todo local.',
      bullets: [
        '• 1 tarjeta principal',
        '• Sin saldo de cuenta',
        '• Registros puntuales y recurrentes',
        '• Meta mensual para control',
      ],
      start: 'Comenzar',
    },
    home: {
      eyebrow: 'Vista mensual',
      title: 'Inicio',
      subtitle: 'Resumen directo del mes, sin ruido visual.',
      loading: 'Cargando datos...',
      loadFailedTitle: 'Error al cargar',
      loadFailedDescription: 'No pudimos obtener los datos del mes ahora.',
      loadError: (message: string) => `No se pudo cargar el inicio (${message}).`,
      monthBalanceLabel: (monthLabel: string) => `Saldo de ${monthLabel}`,
      income: 'Ingresos',
      expense: 'Gastos',
      fixedMonth: 'Fijos del mes',
      currentInvoice: 'Factura actual',
      cardCycleTitle: 'Ciclo de tarjeta',
      cardCycleSubtitle: 'Tarjeta principal',
      closing: 'Cierre',
      due: 'Vencimiento',
      budgetTitle: 'Meta mensual',
      budgetNoTarget: 'Define una meta en Planificación para seguirla.',
      budgetProgress: (spent: string, target: string) => `${spent} de ${target}`,
      recentTitle: 'Últimos registros',
      recentSubtitle: 'Movimientos recientes del mes',
      emptyMovementsTitle: 'Sin movimientos',
      emptyMovementsDescription: 'Usa la pestaña Registrar para crear tu primer ingreso o gasto.',
      refreshData: 'Actualizar datos',
    },
    launch: {
      eyebrow: 'Flujo guiado',
      title: 'Registrar',
      subtitle: 'Elige el tipo y completa solo lo necesario.',
      saving: 'Guardando...',
      save: 'Guardar registro',
      income: 'Ingreso',
      expense: 'Gasto',
      fixed: 'Fijo',
      newFixedTitle: 'Nuevo fijo',
      newFixedSubtitle: 'Se repetirá mensualmente.',
      newEntryTitle: 'Nuevo registro',
      newEntrySubtitle: 'Se agrega al mes actual.',
      amount: 'Valor',
      description: 'Descripción',
      dayOfMonth: 'Día del mes',
      date: 'Fecha',
      category: 'Categoría',
      valuePlaceholder: '0,00',
      descriptionPlaceholder: 'Ej: Supermercado, salario, alquiler',
      dayPlaceholder: 'Ej: 10',
      loadingCategories: 'Cargando categorías...',
      noCategoriesTitle: 'Sin categorías',
      noCategoriesDescription: 'Crea una categoría para este tipo y continúa.',
      categoryLoadError: 'No se pudieron cargar las categorías.',
      validationDescription: 'La descripción es obligatoria.',
      validationAmount: 'Ingresa un valor válido.',
      validationCategory: 'Selecciona una categoría válida.',
      validationDay: 'Día del mes inválido para un registro fijo.',
      saveSuccessFixed: 'Fijo guardado en Planificación.',
      saveSuccessEntry: 'Registro guardado.',
      saveError: 'No se pudo guardar ahora.',
    },
    insights: {
      eyebrow: 'Lectura analítica',
      title: 'Insights',
      subtitle: 'Comparaciones simples para decidir próximos ajustes.',
      loading: 'Cargando insights...',
      loadError: (message: string) => `No se pudieron cargar los insights (${message}).`,
      loadFailedTitle: 'Error al cargar',
      loadFailedDescription: 'No fue posible generar insights ahora.',
      noDataTitle: 'Sin datos suficientes',
      noDataDescription: 'Registra ingresos y gastos en Registrar para liberar estos insights.',
      staleData: 'Los datos pueden estar desactualizados.',
      sectionIncomeVsExpenseTitle: 'Ingresos vs gastos',
      sectionIncomeVsExpenseSubtitle: 'Equilibrio mensual',
      sectionCategoryTitle: 'Gastos por categoría',
      sectionCategorySubtitle: 'Categorías con mayor impacto',
      sectionFixedVariableTitle: 'Fijos vs variables',
      sectionFixedVariableSubtitle: 'Composición de gastos',
      sectionPaymentTitle: 'Método de pago',
      sectionPaymentSubtitle: 'Dónde concentras más gastos',
      incomeLabel: 'Ingresos',
      expenseLabel: 'Gastos',
      fixedLabel: 'Fijos',
      variableLabel: 'Variables',
      noExpenses: 'Sin gastos en el mes.',
      noMovements: 'Sin movimientos en el mes.',
      budgetTitle: 'Progreso de la meta',
      budgetNoTarget: 'Meta mensual no definida en Planificación.',
      budgetProgress: (spent: string, target: string) => `${spent} de ${target}`,
      linkedinError: 'No se pudo abrir LinkedIn ahora.',
      aboutTitle: 'Acerca de',
      aboutSubtitle: 'Autoría y licencia',
      developedBy: 'Desarrollado por Carlos Gabriel',
    },
    datePicker: {
      weekDays: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
      selectDate: 'Seleccionar fecha',
      close: 'Cerrar',
      today: 'Hoy',
    },
  },
};

export function getStrings(language: AppLanguage): AppStrings {
  return translations[language];
}
