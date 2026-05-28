const config = {
  AppTitle: 'HamLog',
  ApiBaseUrl: process.env.REACT_APP_API_URL || '/api',
  InputBoxClassName: 'w-full px-3 py-2 bg-[var(--color-card-bg)] border border-[var(--color-card-border)] rounded-lg text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors',
  ButtonClassNameBlue: 'inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500/20 active:bg-primary-800 transition-colors shadow-sm',
  ButtonClassNameGreen: 'inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-accent-600 text-white text-sm font-medium rounded-lg hover:bg-accent-700 focus:outline-none focus:ring-2 focus:ring-accent-500/20 active:bg-accent-800 transition-colors shadow-sm',
  ButtonClassNameRed: 'inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-danger-600 text-white text-sm font-medium rounded-lg hover:bg-danger-700 focus:outline-none focus:ring-2 focus:ring-danger-500/20 active:bg-danger-800 transition-colors shadow-sm',
  ButtonClassNameOutline: 'inline-flex items-center justify-center gap-1.5 px-3 py-2 border border-[var(--color-card-border)] text-[var(--color-text-secondary)] text-sm font-medium rounded-lg hover:bg-[var(--color-surface-100)] focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-colors',
  ButtonClassNameGhost: 'inline-flex items-center justify-center gap-1.5 px-2 py-1.5 text-[var(--color-text-muted)] text-sm rounded-lg hover:bg-[var(--color-surface-100)] hover:text-[var(--color-text-secondary)] focus:outline-none transition-colors',
  ButtonClassNameDashed: 'inline-flex items-center justify-center gap-1.5 px-3 py-2 border border-dashed border-[var(--color-surface-300)] text-[var(--color-text-muted)] text-sm font-medium rounded-lg hover:border-primary-400 hover:text-primary-600 focus:outline-none transition-colors w-full',
  TableStyle1: 'min-w-full divide-y divide-[var(--color-card-border)]',
  TableBodyStyle1: 'bg-[var(--color-card-bg)] divide-y divide-[var(--color-surface-100)]',
  TableHeadStyle1: 'bg-[var(--color-nav-bg)]',
  TableHeadStyle2: 'bg-accent-600',
  TableHeadStyle3: 'bg-primary-600',
  TableHeading1: 'py-2.5 px-4 text-xs font-semibold tracking-wide text-left uppercase text-[var(--color-surface-400)]',
  TableHeading2: 'py-2.5 px-4 text-xs font-semibold tracking-wide text-left uppercase text-white',
  TableCell1: 'py-2.5 px-4 text-sm text-[var(--color-text-primary)]',
  InputLabel1: 'block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5',
};

export default config;
