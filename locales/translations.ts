import type { AppLanguage, ThemePreference } from '@/data/local/app-settings';

export interface AppStrings {
  common: {
    unknownError: string;
    tryAgain: string;
    cancel: string;
    remove: string;
    save: string;
    loading: string;
    appName: string;
    localFirstHint: string;
    linkedIn: string;
    appVersion: (version: string) => string;
    copyright: (year: number) => string;
  };
  tabs: {
    home: string;
    extract: string;
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
    removeExpenseTitle: string;
    removeExpenseDescription: string;
    removeInstallmentDescription: (current: number, total: number) => string;
    removePurchaseTitle: string;
    removePurchaseDescription: string;
    removeSuccess: string;
    removeError: string;
    refreshData: string;
    positive: string;
    negative: string;
    seeExtract: string;
    addFirstEntry: string;
  };
  extract: {
    title: string;
    all: string;
    income: string;
    expense: string;
    balance: string;
    itemSingular: string;
    itemPlural: string;
    card: string;
    recurring: string;
    loadingError: string;
    removeTitle: string;
    removeDescription: string;
    removeInstallmentDescription: (current: number, total: number) => string;
    removeError: string;
    emptyTitle: string;
    emptyFilteredDescription: string;
    emptyDescription: string;
    newEntry: string;
  };
  planning: {
    eyebrow: string;
    title: string;
    subtitle: string;
    loading: string;
    loadError: string;
    budgetTitle: string;
    budgetSubtitle: string;
    budgetEmpty: string;
    budgetSpent: (value: string) => string;
    budgetPercent: (value: number) => string;
    budgetValue: string;
    budgetSave: string;
    budgetClear: string;
    budgetInvalid: string;
    budgetSaveSuccess: string;
    budgetSaveError: string;
    budgetClearSuccess: string;
    budgetClearError: string;
    stateNoGoal: string;
    stateGood: string;
    stateWarning: string;
    stateDanger: string;
    cardTitle: string;
    cardSubtitle: string;
    cardName: string;
    cardClosingDay: string;
    cardDueDay: string;
    cardClosingPlaceholder: string;
    cardDuePlaceholder: string;
    cardSave: string;
    cardRestore: string;
    cardSaveSuccess: string;
    cardSaveError: string;
    cardRestoreSuccess: string;
    cardRestoreError: string;
    recurringTitle: string;
    recurringSubtitle: string;
    recurringAdd: string;
    recurringEmptyTitle: string;
    recurringEmptyDescription: string;
    recurringCreated: string;
    recurringCreateError: string;
    recurringActivated: string;
    recurringDeactivated: string;
    recurringUpdateError: string;
    recurringDeleteTitle: string;
    recurringDeleteMessage: (description: string) => string;
    recurringDeleted: string;
    recurringDeleteError: string;
    recurringDescriptionRequired: string;
    recurringAmountInvalid: string;
    recurringDayInvalid: string;
    recurringCategoryInvalid: string;
    categorySection: string;
    categoryEmptyTitle: string;
    categoryEmptyDescription: string;
    categoryCreateEmptyTitle: string;
    categoryCreateEmptyDescription: string;
    categoryManagementSubtitle: string;
    categoryHidden: string;
    categoryReactivated: string;
    categoryUpdateError: string;
    categorySystemDeleteError: string;
    categoryDeleteTitle: string;
    categoryDeleteMessage: (name: string) => string;
    categoryDeleted: string;
    categoryDeleteError: string;
    income: string;
    fixed: string;
    expense: string;
    incomeMeta: string;
    expenseMeta: string;
    generalMeta: string;
    fixedMeta: string;
    variableMeta: string;
    systemMeta: string;
    customMeta: string;
    description: string;
    amount: string;
    dayOfMonth: string;
    monthlyDay: (day: number) => string;
    inactive: string;
    activate: string;
    deactivate: string;
    hide: string;
    delete: string;
  };
  categoryQuickAdd: {
    trigger: string;
    title: string;
    namePlaceholder: string;
    customTitle: string;
    removeError: string;
    nameRequired: string;
    saveError: string;
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
    recurringShortcutTitle: string;
    recurringShortcutSubtitle: string;
    newFixedTitle: string;
    newFixedSubtitle: string;
    newEntryTitle: string;
    newEntrySubtitle: string;
    amount: string;
    description: string;
    dayOfMonth: string;
    date: string;
    category: string;
    installments: string;
    installmentCurrent: string;
    installmentsPlaceholder: string;
    installmentCurrentPlaceholder: string;
    installmentsHint: string;
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
    validationInstallments: string;
    validationInstallmentCurrent: string;
    saveSuccessFixed: string;
    saveSuccessEntry: string;
    saveSuccessInstallments: (count: number) => string;
    saved: string;
    installmentsAutoHint: string;
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
    sectionQuickPulseTitle: string;
    sectionQuickPulseSubtitle: string;
    sectionIncomeVsExpenseTitle: string;
    sectionIncomeVsExpenseSubtitle: string;
    sectionCategoryTitle: string;
    sectionCategorySubtitle: string;
    sectionFixedVariableTitle: string;
    sectionFixedVariableSubtitle: string;
    sectionPaceTitle: string;
    sectionPaceSubtitle: string;
    sectionTopCategoryTitle: string;
    sectionTopCategorySubtitle: string;
    sectionHistoryTitle: string;
    sectionHistorySubtitle: string;
    sectionPaymentTitle: string;
    sectionPaymentSubtitle: string;
    monthBalanceTitle: string;
    cardShareTitle: string;
    fixedIncomeShareTitle: string;
    dailyAverageTitle: string;
    projectedExpenseTitle: string;
    historyIncomeLabel: string;
    historyExpenseLabel: string;
    historyBalanceLabel: string;
    incomeLabel: string;
    expenseLabel: string;
    fixedLabel: string;
    variableLabel: string;
    noExpenses: string;
    noMovements: string;
    noIncomeBase: string;
    noIncomeBaseShort: string;
    topCategoryEmpty: string;
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
      cancel: 'Cancelar',
      remove: 'Remover',
      save: 'Salvar',
      loading: 'Carregando...',
      appName: 'Clarium',
      localFirstHint: 'Seus dados ficam no seu dispositivo.',
      linkedIn: 'LinkedIn',
      appVersion: (version: string) => `Versão ${version}`,
      copyright: (year: number) => `© ${year} Carlos Gabriel. Todos os direitos reservados.`,
    },
    tabs: {
      home: 'Início',
      extract: 'Extrato',
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
      subtitle: 'Veja seu mês de forma rápida.',
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
      removeExpenseTitle: 'Remover gasto',
      removeExpenseDescription: 'Deseja remover este gasto dos últimos lançamentos?',
      removeInstallmentDescription: (current: number, total: number) =>
        `Deseja remover o parcelamento a partir da parcela ${current} de ${total}?`,
      removePurchaseTitle: 'Remover compra',
      removePurchaseDescription: 'Deseja remover esta compra do cartão?',
      removeSuccess: 'Movimentação removida.',
      removeError: 'Não foi possível remover a movimentação.',
      refreshData: 'Atualizar dados',
      positive: 'positivo',
      negative: 'negativo',
      seeExtract: 'Ver extrato',
      addFirstEntry: 'Adicionar primeiro lançamento',
    },
    extract: {
      title: 'Extrato',
      all: 'Todos',
      income: 'Receitas',
      expense: 'Gastos',
      balance: 'Saldo',
      itemSingular: 'item',
      itemPlural: 'itens',
      card: 'Cartão',
      recurring: 'Recorrente',
      loadingError: 'Erro ao carregar extrato.',
      removeTitle: 'Remover lançamento',
      removeDescription: 'Remover este lançamento?',
      removeInstallmentDescription: (current: number, total: number) =>
        `Remover parcela ${current}/${total} e as seguintes?`,
      removeError: 'Erro ao remover.',
      emptyTitle: 'Nenhum lançamento',
      emptyFilteredDescription: 'Tente mudar o filtro acima',
      emptyDescription: 'Adicione lançamentos com o botão +',
      newEntry: 'Novo lançamento',
    },
    planning: {
      eyebrow: 'Seu mês',
      title: 'Planejamento',
      subtitle: 'Meta, cartão e recorrentes do mês.',
      loading: 'Carregando planejamento...',
      loadError: 'Não foi possível carregar o planejamento.',
      budgetTitle: 'Meta mensal',
      budgetSubtitle: 'Seu limite para este mês',
      budgetEmpty: 'Defina sua meta mensal',
      budgetSpent: (value: string) => `Gasto no mês: ${value}`,
      budgetPercent: (value: number) => `${value}% da meta`,
      budgetValue: 'Valor da meta',
      budgetSave: 'Salvar meta',
      budgetClear: 'Limpar',
      budgetInvalid: 'Informe uma meta mensal válida.',
      budgetSaveSuccess: 'Meta mensal salva.',
      budgetSaveError: 'Não foi possível salvar a meta.',
      budgetClearSuccess: 'Meta mensal removida.',
      budgetClearError: 'Não foi possível remover a meta.',
      stateNoGoal: 'Sem meta',
      stateGood: 'Dentro da meta',
      stateWarning: 'Atenção',
      stateDanger: 'Acima da meta',
      cardTitle: 'Cartão',
      cardSubtitle: 'Fechamento e vencimento',
      cardName: 'Nome do cartão',
      cardClosingDay: 'Dia de fechamento',
      cardDueDay: 'Dia de vencimento',
      cardClosingPlaceholder: 'Fechamento',
      cardDuePlaceholder: 'Vencimento',
      cardSave: 'Salvar cartão',
      cardRestore: 'Restaurar',
      cardSaveSuccess: 'Configuração do cartão salva.',
      cardSaveError: 'Não foi possível salvar as configurações do cartão.',
      cardRestoreSuccess: 'Cartão restaurado para padrão.',
      cardRestoreError: 'Não foi possível restaurar o cartão.',
      recurringTitle: 'Recorrentes',
      recurringSubtitle: 'Cadastre e acompanhe',
      recurringAdd: 'Adicionar recorrência',
      recurringEmptyTitle: 'Sem recorrentes',
      recurringEmptyDescription: 'Cadastre uma recorrência para começar.',
      recurringCreated: 'Recorrência criada.',
      recurringCreateError: 'Não foi possível criar a recorrência.',
      recurringActivated: 'Recorrência ativada.',
      recurringDeactivated: 'Recorrência desativada.',
      recurringUpdateError: 'Não foi possível atualizar a recorrência.',
      recurringDeleteTitle: 'Excluir recorrência',
      recurringDeleteMessage: (description: string) => `Deseja excluir "${description}"?`,
      recurringDeleted: 'Recorrência excluída.',
      recurringDeleteError: 'Não foi possível excluir a recorrência.',
      recurringDescriptionRequired: 'Descrição da recorrência é obrigatória.',
      recurringAmountInvalid: 'Informe um valor válido para a recorrência.',
      recurringDayInvalid: 'Dia do mês inválido para recorrência.',
      recurringCategoryInvalid: 'Selecione uma categoria válida para esta recorrência.',
      categorySection: 'Categorias',
      categoryEmptyTitle: 'Sem categorias',
      categoryEmptyDescription: 'Crie categorias para personalizar o fluxo.',
      categoryCreateEmptyTitle: 'Sem categorias',
      categoryCreateEmptyDescription: 'Crie uma categoria para continuar.',
      categoryManagementSubtitle: 'Organize o que aparece no app',
      categoryHidden: 'Categoria ocultada.',
      categoryReactivated: 'Categoria reativada.',
      categoryUpdateError: 'Não foi possível atualizar a categoria.',
      categorySystemDeleteError: 'Categorias padrão não podem ser excluídas. Use ocultar.',
      categoryDeleteTitle: 'Excluir categoria',
      categoryDeleteMessage: (name: string) => `Deseja excluir "${name}"?`,
      categoryDeleted: 'Categoria removida.',
      categoryDeleteError: 'Não foi possível excluir a categoria.',
      income: 'Receita',
      fixed: 'Fixo',
      expense: 'Gasto',
      incomeMeta: 'Entrada',
      expenseMeta: 'Saída',
      generalMeta: 'geral',
      fixedMeta: 'fixo',
      variableMeta: 'variável',
      systemMeta: 'padrão',
      customMeta: 'custom',
      description: 'Descrição',
      amount: 'Valor',
      dayOfMonth: 'Dia do mês',
      monthlyDay: (day: number) => `Mensal · Dia ${day}`,
      inactive: 'Desativada',
      activate: 'Ativar',
      deactivate: 'Desativar',
      hide: 'Ocultar',
      delete: 'Excluir',
    },
    categoryQuickAdd: {
      trigger: 'Criar categoria',
      title: 'Nova categoria',
      namePlaceholder: 'Nome da categoria',
      customTitle: 'Categorias customizadas',
      removeError: 'Não foi possível remover.',
      nameRequired: 'Nome é obrigatório.',
      saveError: 'Não foi possível salvar agora.',
    },
    launch: {
      eyebrow: 'Novo lançamento',
      title: 'Lançar',
      subtitle: 'Registre uma receita ou gasto.',
      saving: 'Salvando...',
      save: 'Salvar lançamento',
      income: 'Receita',
      expense: 'Gasto',
      fixed: 'Fixo',
      recurringShortcutTitle: '',
      recurringShortcutSubtitle: '',
      newFixedTitle: 'Novo fixo',
      newFixedSubtitle: 'Será repetido mensalmente.',
      newEntryTitle: 'Novo lançamento',
      newEntrySubtitle: 'Preencha os dados para salvar.',
      amount: 'Valor',
      description: 'Descrição',
      dayOfMonth: 'Dia do mês',
      date: 'Data',
      category: 'Categoria',
      installments: 'Parcelas',
      installmentCurrent: 'Parcela atual',
      installmentsPlaceholder: '1',
      installmentCurrentPlaceholder: '1',
      installmentsHint:
        'Para gasto parcelado, informe o total e a parcela atual. Se já estiver na 5ª, o app salva da 5ª até a última.',
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
      validationInstallments: 'Informe de 1 a 36 parcelas para o gasto.',
      validationInstallmentCurrent: 'Informe uma parcela atual válida entre 1 e o total.',
      saveSuccessFixed: 'Fixo salvo no Planejamento.',
      saveSuccessEntry: 'Lançamento salvo.',
      saveSuccessInstallments: (count: number) => `${count} parcelas salvas.`,
      saved: 'Salvo',
      installmentsAutoHint: 'As parcelas restantes serão criadas automaticamente.',
      saveError: 'Não foi possível salvar agora.',
    },
    insights: {
      eyebrow: 'Leitura analítica',
      title: 'Insights',
      subtitle: 'Acompanhe seus números do mês.',
      loading: 'Carregando insights...',
      loadError: (message: string) => `Não foi possível carregar os insights (${message}).`,
      loadFailedTitle: 'Falha ao carregar',
      loadFailedDescription: 'Não foi possível montar os insights neste momento.',
      noDataTitle: 'Sem dados suficientes',
      noDataDescription: 'Registre receitas e gastos na aba Lançar para liberar estes insights.',
      staleData: 'Dados podem estar desatualizados.',
      sectionQuickPulseTitle: 'Pulso do mês',
      sectionQuickPulseSubtitle: 'Leituras rápidas para decisão',
      sectionIncomeVsExpenseTitle: 'Receitas vs gastos',
      sectionIncomeVsExpenseSubtitle: 'Equilíbrio mensal',
      sectionCategoryTitle: 'Gastos por categoria',
      sectionCategorySubtitle: 'Categorias com maior peso',
      sectionFixedVariableTitle: 'Fixos vs variáveis',
      sectionFixedVariableSubtitle: 'Composição dos gastos',
      sectionPaceTitle: 'Ritmo de gasto',
      sectionPaceSubtitle: 'Média diária e projeção de fechamento',
      sectionTopCategoryTitle: 'Maior pressão do mês',
      sectionTopCategorySubtitle: 'Categoria que mais puxou o orçamento',
      sectionHistoryTitle: 'Histórico do ano',
      sectionHistorySubtitle: 'Entradas, gastos e saldo por mês',
      sectionPaymentTitle: 'Forma de pagamento',
      sectionPaymentSubtitle: 'Onde você mais concentra gastos',
      monthBalanceTitle: 'Saldo do mês',
      cardShareTitle: 'Peso da fatura',
      fixedIncomeShareTitle: 'Fixos / receita',
      dailyAverageTitle: 'Média por dia',
      projectedExpenseTitle: 'Projeção do mês',
      historyIncomeLabel: 'Entradas',
      historyExpenseLabel: 'Gastos',
      historyBalanceLabel: 'Saldo',
      incomeLabel: 'Receitas',
      expenseLabel: 'Gastos',
      fixedLabel: 'Fixos',
      variableLabel: 'Variáveis',
      noExpenses: 'Sem gastos no mês.',
      noMovements: 'Sem movimentações no mês.',
      noIncomeBase: 'Sem receita registrada para calcular comprometimento fixo.',
      noIncomeBaseShort: 'Sem base',
      topCategoryEmpty: 'Sem categoria dominante no mês.',
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
      cancel: 'Cancel',
      remove: 'Remove',
      save: 'Save',
      loading: 'Loading...',
      appName: 'Clarium',
      localFirstHint: 'Your data stays on your device.',
      linkedIn: 'LinkedIn',
      appVersion: (version: string) => `Version ${version}`,
      copyright: (year: number) => `© ${year} Carlos Gabriel. All rights reserved.`,
    },
    tabs: {
      home: 'Home',
      extract: 'Extract',
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
      removeExpenseTitle: 'Remove expense',
      removeExpenseDescription: 'Do you want to remove this expense from recent entries?',
      removeInstallmentDescription: (current: number, total: number) =>
        `Do you want to remove this installment plan starting at installment ${current} of ${total}?`,
      removePurchaseTitle: 'Remove purchase',
      removePurchaseDescription: 'Do you want to remove this card purchase?',
      removeSuccess: 'Movement removed.',
      removeError: 'Could not remove the movement.',
      refreshData: 'Refresh data',
      positive: 'positive',
      negative: 'negative',
      seeExtract: 'View extract',
      addFirstEntry: 'Add first entry',
    },
    extract: {
      title: 'Extract',
      all: 'All',
      income: 'Income',
      expense: 'Expenses',
      balance: 'Balance',
      itemSingular: 'item',
      itemPlural: 'items',
      card: 'Card',
      recurring: 'Recurring',
      loadingError: 'Could not load extract.',
      removeTitle: 'Remove entry',
      removeDescription: 'Remove this entry?',
      removeInstallmentDescription: (current: number, total: number) =>
        `Remove installment ${current}/${total} and the following ones?`,
      removeError: 'Could not remove.',
      emptyTitle: 'No entries',
      emptyFilteredDescription: 'Try changing the filter above',
      emptyDescription: 'Add entries with the + button',
      newEntry: 'New entry',
    },
    planning: {
      eyebrow: 'Your month',
      title: 'Planning',
      subtitle: 'Goal, card, and recurring entries for the month.',
      loading: 'Loading planning...',
      loadError: 'Could not load planning.',
      budgetTitle: 'Monthly goal',
      budgetSubtitle: 'Your limit for this month',
      budgetEmpty: 'Set your monthly goal',
      budgetSpent: (value: string) => `Spent this month: ${value}`,
      budgetPercent: (value: number) => `${value}% of goal`,
      budgetValue: 'Goal amount',
      budgetSave: 'Save goal',
      budgetClear: 'Clear',
      budgetInvalid: 'Enter a valid monthly goal.',
      budgetSaveSuccess: 'Monthly goal saved.',
      budgetSaveError: 'Could not save the goal.',
      budgetClearSuccess: 'Monthly goal removed.',
      budgetClearError: 'Could not remove the goal.',
      stateNoGoal: 'No goal',
      stateGood: 'On track',
      stateWarning: 'Attention',
      stateDanger: 'Over goal',
      cardTitle: 'Card',
      cardSubtitle: 'Closing and due dates',
      cardName: 'Card name',
      cardClosingDay: 'Closing day',
      cardDueDay: 'Due day',
      cardClosingPlaceholder: 'Closing',
      cardDuePlaceholder: 'Due',
      cardSave: 'Save card',
      cardRestore: 'Restore',
      cardSaveSuccess: 'Card settings saved.',
      cardSaveError: 'Could not save card settings.',
      cardRestoreSuccess: 'Card restored to default.',
      cardRestoreError: 'Could not restore the card.',
      recurringTitle: 'Recurring',
      recurringSubtitle: 'Create and track',
      recurringAdd: 'Add recurring entry',
      recurringEmptyTitle: 'No recurring entries',
      recurringEmptyDescription: 'Create a recurring entry to start.',
      recurringCreated: 'Recurring entry created.',
      recurringCreateError: 'Could not create the recurring entry.',
      recurringActivated: 'Recurring entry activated.',
      recurringDeactivated: 'Recurring entry deactivated.',
      recurringUpdateError: 'Could not update the recurring entry.',
      recurringDeleteTitle: 'Delete recurring entry',
      recurringDeleteMessage: (description: string) => `Delete "${description}"?`,
      recurringDeleted: 'Recurring entry deleted.',
      recurringDeleteError: 'Could not delete the recurring entry.',
      recurringDescriptionRequired: 'Recurring description is required.',
      recurringAmountInvalid: 'Enter a valid amount for the recurring entry.',
      recurringDayInvalid: 'Invalid day of month for recurrence.',
      recurringCategoryInvalid: 'Select a valid category for this recurrence.',
      categorySection: 'Categories',
      categoryEmptyTitle: 'No categories',
      categoryEmptyDescription: 'Create categories to customize the flow.',
      categoryCreateEmptyTitle: 'No categories',
      categoryCreateEmptyDescription: 'Create a category to continue.',
      categoryManagementSubtitle: 'Organize what appears in the app',
      categoryHidden: 'Category hidden.',
      categoryReactivated: 'Category reactivated.',
      categoryUpdateError: 'Could not update the category.',
      categorySystemDeleteError: 'Default categories cannot be deleted. Use hide.',
      categoryDeleteTitle: 'Delete category',
      categoryDeleteMessage: (name: string) => `Delete "${name}"?`,
      categoryDeleted: 'Category removed.',
      categoryDeleteError: 'Could not delete the category.',
      income: 'Income',
      fixed: 'Fixed',
      expense: 'Expense',
      incomeMeta: 'Income',
      expenseMeta: 'Expense',
      generalMeta: 'general',
      fixedMeta: 'fixed',
      variableMeta: 'variable',
      systemMeta: 'default',
      customMeta: 'custom',
      description: 'Description',
      amount: 'Amount',
      dayOfMonth: 'Day of month',
      monthlyDay: (day: number) => `Monthly · Day ${day}`,
      inactive: 'Inactive',
      activate: 'Activate',
      deactivate: 'Deactivate',
      hide: 'Hide',
      delete: 'Delete',
    },
    categoryQuickAdd: {
      trigger: 'Create category',
      title: 'New category',
      namePlaceholder: 'Category name',
      customTitle: 'Custom categories',
      removeError: 'Could not remove.',
      nameRequired: 'Name is required.',
      saveError: 'Could not save right now.',
    },
    launch: {
      eyebrow: 'New entry',
      title: 'Add',
      subtitle: 'Add an income or expense.',
      saving: 'Saving...',
      save: 'Save entry',
      income: 'Income',
      expense: 'Expense',
      fixed: 'Fixed',
      recurringShortcutTitle: '',
      recurringShortcutSubtitle: '',
      newFixedTitle: 'New fixed expense',
      newFixedSubtitle: 'It will repeat monthly.',
      newEntryTitle: 'New entry',
      newEntrySubtitle: 'Fill in the details to save it.',
      amount: 'Amount',
      description: 'Description',
      dayOfMonth: 'Day of month',
      date: 'Date',
      category: 'Category',
      installments: 'Installments',
      installmentCurrent: 'Current installment',
      installmentsPlaceholder: '1',
      installmentCurrentPlaceholder: '1',
      installmentsHint:
        'For split expenses, enter the total and the current installment. If you are already on the 5th, Clarium saves from the 5th onward.',
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
      validationInstallments: 'Enter 1 to 36 installments for the expense.',
      validationInstallmentCurrent: 'Enter a valid current installment between 1 and the total.',
      saveSuccessFixed: 'Fixed expense saved in Planning.',
      saveSuccessEntry: 'Entry saved.',
      saveSuccessInstallments: (count: number) => `${count} installments saved.`,
      saved: 'Saved',
      installmentsAutoHint: 'The remaining installments will be created automatically.',
      saveError: 'Could not save right now.',
    },
    insights: {
      eyebrow: 'Analytical view',
      title: 'Insights',
      subtitle: 'Track your numbers for the month.',
      loading: 'Loading insights...',
      loadError: (message: string) => `Could not load insights (${message}).`,
      loadFailedTitle: 'Failed to load',
      loadFailedDescription: 'Could not build insights right now.',
      noDataTitle: 'Not enough data',
      noDataDescription: 'Add income and expenses in Add to unlock insights.',
      staleData: 'Data may be outdated.',
      sectionQuickPulseTitle: 'Month pulse',
      sectionQuickPulseSubtitle: 'Fast readings for decisions',
      sectionIncomeVsExpenseTitle: 'Income vs expenses',
      sectionIncomeVsExpenseSubtitle: 'Monthly balance',
      sectionCategoryTitle: 'Expenses by category',
      sectionCategorySubtitle: 'Highest-impact categories',
      sectionFixedVariableTitle: 'Fixed vs variable',
      sectionFixedVariableSubtitle: 'Expense composition',
      sectionPaceTitle: 'Spending pace',
      sectionPaceSubtitle: 'Daily average and month-end projection',
      sectionTopCategoryTitle: 'Main pressure point',
      sectionTopCategorySubtitle: 'Category with the biggest budget pull',
      sectionHistoryTitle: 'Year history',
      sectionHistorySubtitle: 'Income, expenses, and balance by month',
      sectionPaymentTitle: 'Payment method',
      sectionPaymentSubtitle: 'Where spending is concentrated',
      monthBalanceTitle: 'Month balance',
      cardShareTitle: 'Invoice weight',
      fixedIncomeShareTitle: 'Fixed / income',
      dailyAverageTitle: 'Daily average',
      projectedExpenseTitle: 'Month projection',
      historyIncomeLabel: 'Income',
      historyExpenseLabel: 'Expenses',
      historyBalanceLabel: 'Balance',
      incomeLabel: 'Income',
      expenseLabel: 'Expenses',
      fixedLabel: 'Fixed',
      variableLabel: 'Variable',
      noExpenses: 'No expenses this month.',
      noMovements: 'No movements this month.',
      noIncomeBase: 'No income recorded to calculate fixed commitment.',
      noIncomeBaseShort: 'No base',
      topCategoryEmpty: 'No dominant category this month.',
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
      cancel: 'Cancelar',
      remove: 'Eliminar',
      save: 'Guardar',
      loading: 'Cargando...',
      appName: 'Clarium',
      localFirstHint: 'Tus datos permanecen en tu dispositivo.',
      linkedIn: 'LinkedIn',
      appVersion: (version: string) => `Versión ${version}`,
      copyright: (year: number) => `© ${year} Carlos Gabriel. Todos los derechos reservados.`,
    },
    tabs: {
      home: 'Inicio',
      extract: 'Extracto',
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
      removeExpenseTitle: 'Eliminar gasto',
      removeExpenseDescription: '¿Deseas eliminar este gasto de los últimos registros?',
      removeInstallmentDescription: (current: number, total: number) =>
        `¿Deseas eliminar este plan en cuotas desde la cuota ${current} de ${total}?`,
      removePurchaseTitle: 'Eliminar compra',
      removePurchaseDescription: '¿Deseas eliminar esta compra de la tarjeta?',
      removeSuccess: 'Movimiento eliminado.',
      removeError: 'No se pudo eliminar el movimiento.',
      refreshData: 'Actualizar datos',
      positive: 'positivo',
      negative: 'negativo',
      seeExtract: 'Ver extracto',
      addFirstEntry: 'Agregar primer registro',
    },
    extract: {
      title: 'Extracto',
      all: 'Todos',
      income: 'Ingresos',
      expense: 'Gastos',
      balance: 'Saldo',
      itemSingular: 'ítem',
      itemPlural: 'ítems',
      card: 'Tarjeta',
      recurring: 'Recurrente',
      loadingError: 'No se pudo cargar el extracto.',
      removeTitle: 'Eliminar registro',
      removeDescription: '¿Eliminar este registro?',
      removeInstallmentDescription: (current: number, total: number) =>
        `¿Eliminar la cuota ${current}/${total} y las siguientes?`,
      removeError: 'No se pudo eliminar.',
      emptyTitle: 'Sin registros',
      emptyFilteredDescription: 'Intenta cambiar el filtro superior',
      emptyDescription: 'Agrega registros con el botón +',
      newEntry: 'Nuevo registro',
    },
    planning: {
      eyebrow: 'Tu mes',
      title: 'Planificación',
      subtitle: 'Meta, tarjeta y recurrentes del mes.',
      loading: 'Cargando planificación...',
      loadError: 'No se pudo cargar la planificación.',
      budgetTitle: 'Meta mensual',
      budgetSubtitle: 'Tu límite para este mes',
      budgetEmpty: 'Define tu meta mensual',
      budgetSpent: (value: string) => `Gasto del mes: ${value}`,
      budgetPercent: (value: number) => `${value}% de la meta`,
      budgetValue: 'Valor de la meta',
      budgetSave: 'Guardar meta',
      budgetClear: 'Limpiar',
      budgetInvalid: 'Ingresa una meta mensual válida.',
      budgetSaveSuccess: 'Meta mensual guardada.',
      budgetSaveError: 'No se pudo guardar la meta.',
      budgetClearSuccess: 'Meta mensual eliminada.',
      budgetClearError: 'No se pudo eliminar la meta.',
      stateNoGoal: 'Sin meta',
      stateGood: 'Dentro de la meta',
      stateWarning: 'Atención',
      stateDanger: 'Sobre la meta',
      cardTitle: 'Tarjeta',
      cardSubtitle: 'Cierre y vencimiento',
      cardName: 'Nombre de la tarjeta',
      cardClosingDay: 'Día de cierre',
      cardDueDay: 'Día de vencimiento',
      cardClosingPlaceholder: 'Cierre',
      cardDuePlaceholder: 'Vencimiento',
      cardSave: 'Guardar tarjeta',
      cardRestore: 'Restaurar',
      cardSaveSuccess: 'Configuración de tarjeta guardada.',
      cardSaveError: 'No se pudo guardar la configuración de la tarjeta.',
      cardRestoreSuccess: 'Tarjeta restaurada al valor predeterminado.',
      cardRestoreError: 'No se pudo restaurar la tarjeta.',
      recurringTitle: 'Recurrentes',
      recurringSubtitle: 'Crea y acompaña',
      recurringAdd: 'Agregar recurrente',
      recurringEmptyTitle: 'Sin recurrentes',
      recurringEmptyDescription: 'Crea una recurrente para comenzar.',
      recurringCreated: 'Recurrente creada.',
      recurringCreateError: 'No se pudo crear la recurrente.',
      recurringActivated: 'Recurrente activada.',
      recurringDeactivated: 'Recurrente desactivada.',
      recurringUpdateError: 'No se pudo actualizar la recurrente.',
      recurringDeleteTitle: 'Eliminar recurrente',
      recurringDeleteMessage: (description: string) => `¿Deseas eliminar "${description}"?`,
      recurringDeleted: 'Recurrente eliminada.',
      recurringDeleteError: 'No se pudo eliminar la recurrente.',
      recurringDescriptionRequired: 'La descripción de la recurrente es obligatoria.',
      recurringAmountInvalid: 'Ingresa un valor válido para la recurrente.',
      recurringDayInvalid: 'Día del mes inválido para recurrencia.',
      recurringCategoryInvalid: 'Selecciona una categoría válida para esta recurrencia.',
      categorySection: 'Categorías',
      categoryEmptyTitle: 'Sin categorías',
      categoryEmptyDescription: 'Crea categorías para personalizar el flujo.',
      categoryCreateEmptyTitle: 'Sin categorías',
      categoryCreateEmptyDescription: 'Crea una categoría para continuar.',
      categoryManagementSubtitle: 'Organiza lo que aparece en la app',
      categoryHidden: 'Categoría ocultada.',
      categoryReactivated: 'Categoría reactivada.',
      categoryUpdateError: 'No se pudo actualizar la categoría.',
      categorySystemDeleteError: 'Las categorías predeterminadas no se pueden eliminar. Usa ocultar.',
      categoryDeleteTitle: 'Eliminar categoría',
      categoryDeleteMessage: (name: string) => `¿Deseas eliminar "${name}"?`,
      categoryDeleted: 'Categoría eliminada.',
      categoryDeleteError: 'No se pudo eliminar la categoría.',
      income: 'Ingreso',
      fixed: 'Fijo',
      expense: 'Gasto',
      incomeMeta: 'Ingreso',
      expenseMeta: 'Gasto',
      generalMeta: 'general',
      fixedMeta: 'fijo',
      variableMeta: 'variable',
      systemMeta: 'predeterminada',
      customMeta: 'custom',
      description: 'Descripción',
      amount: 'Valor',
      dayOfMonth: 'Día del mes',
      monthlyDay: (day: number) => `Mensual · Día ${day}`,
      inactive: 'Desactivada',
      activate: 'Activar',
      deactivate: 'Desactivar',
      hide: 'Ocultar',
      delete: 'Eliminar',
    },
    categoryQuickAdd: {
      trigger: 'Crear categoría',
      title: 'Nueva categoría',
      namePlaceholder: 'Nombre de la categoría',
      customTitle: 'Categorías customizadas',
      removeError: 'No se pudo eliminar.',
      nameRequired: 'El nombre es obligatorio.',
      saveError: 'No se pudo guardar ahora.',
    },
    launch: {
      eyebrow: 'Nuevo registro',
      title: 'Registrar',
      subtitle: 'Registra un ingreso o gasto.',
      saving: 'Guardando...',
      save: 'Guardar registro',
      income: 'Ingreso',
      expense: 'Gasto',
      fixed: 'Fijo',
      recurringShortcutTitle: '',
      recurringShortcutSubtitle: '',
      newFixedTitle: 'Nuevo fijo',
      newFixedSubtitle: 'Se repetirá mensualmente.',
      newEntryTitle: 'Nuevo registro',
      newEntrySubtitle: 'Completa los datos para guardar.',
      amount: 'Valor',
      description: 'Descripción',
      dayOfMonth: 'Día del mes',
      date: 'Fecha',
      category: 'Categoría',
      installments: 'Cuotas',
      installmentCurrent: 'Cuota actual',
      installmentsPlaceholder: '1',
      installmentCurrentPlaceholder: '1',
      installmentsHint:
        'Para gastos en cuotas, ingresa el total y la cuota actual. Si ya estás en la 5ª, Clarium guarda desde la 5ª en adelante.',
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
      validationInstallments: 'Ingresa de 1 a 36 cuotas para el gasto.',
      validationInstallmentCurrent: 'Ingresa una cuota actual válida entre 1 y el total.',
      saveSuccessFixed: 'Fijo guardado en Planificación.',
      saveSuccessEntry: 'Registro guardado.',
      saveSuccessInstallments: (count: number) => `${count} cuotas guardadas.`,
      saved: 'Guardado',
      installmentsAutoHint: 'Las cuotas restantes se crearán automáticamente.',
      saveError: 'No se pudo guardar ahora.',
    },
    insights: {
      eyebrow: 'Lectura analítica',
      title: 'Insights',
      subtitle: 'Sigue tus números del mes.',
      loading: 'Cargando insights...',
      loadError: (message: string) => `No se pudieron cargar los insights (${message}).`,
      loadFailedTitle: 'Error al cargar',
      loadFailedDescription: 'No fue posible generar insights ahora.',
      noDataTitle: 'Sin datos suficientes',
      noDataDescription: 'Registra ingresos y gastos en Registrar para liberar estos insights.',
      staleData: 'Los datos pueden estar desactualizados.',
      sectionQuickPulseTitle: 'Pulso del mes',
      sectionQuickPulseSubtitle: 'Lecturas rápidas para decidir',
      sectionIncomeVsExpenseTitle: 'Ingresos vs gastos',
      sectionIncomeVsExpenseSubtitle: 'Equilibrio mensual',
      sectionCategoryTitle: 'Gastos por categoría',
      sectionCategorySubtitle: 'Categorías con mayor impacto',
      sectionFixedVariableTitle: 'Fijos vs variables',
      sectionFixedVariableSubtitle: 'Composición de gastos',
      sectionPaceTitle: 'Ritmo de gasto',
      sectionPaceSubtitle: 'Promedio diario y proyección de cierre',
      sectionTopCategoryTitle: 'Mayor presión del mes',
      sectionTopCategorySubtitle: 'Categoría que más empujó el presupuesto',
      sectionHistoryTitle: 'Histórico del año',
      sectionHistorySubtitle: 'Ingresos, gastos y saldo por mes',
      sectionPaymentTitle: 'Método de pago',
      sectionPaymentSubtitle: 'Dónde concentras más gastos',
      monthBalanceTitle: 'Saldo del mes',
      cardShareTitle: 'Peso de la factura',
      fixedIncomeShareTitle: 'Fijos / ingresos',
      dailyAverageTitle: 'Promedio por día',
      projectedExpenseTitle: 'Proyección del mes',
      historyIncomeLabel: 'Ingresos',
      historyExpenseLabel: 'Gastos',
      historyBalanceLabel: 'Saldo',
      incomeLabel: 'Ingresos',
      expenseLabel: 'Gastos',
      fixedLabel: 'Fijos',
      variableLabel: 'Variables',
      noExpenses: 'Sin gastos en el mes.',
      noMovements: 'Sin movimientos en el mes.',
      noIncomeBase: 'Sin ingresos registrados para calcular el compromiso fijo.',
      noIncomeBaseShort: 'Sin base',
      topCategoryEmpty: 'Sin categoría dominante en el mes.',
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
