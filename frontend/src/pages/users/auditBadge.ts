export function actionBadgeLabel(action: string) {
  const normalized = action.toLowerCase();

  if (normalized.includes('login') && normalized.includes('inv')) return 'Acesso negado';
  if (normalized.includes('login')) return 'Login';
  if (normalized.includes('criad')) return 'Criação';
  if (normalized.includes('atualiz') || normalized.includes('editad')) return 'Edição';
  if (normalized.includes('cancelad')) return 'Cancelamento';
  if (normalized.includes('inativ')) return 'Inativação';
  if (normalized.includes('exclu')) return 'Exclusão';

  return 'Ação';
}

export function actionBadgeClass(action: string) {
  const normalized = action.toLowerCase();

  if (normalized.includes('login') && normalized.includes('inv')) return 'bg-red-500/10 text-red-300 border-red-500/30';
  if (normalized.includes('login')) return 'bg-sky-500/10 text-sky-300 border-sky-500/30';
  if (normalized.includes('criad')) return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30';
  if (normalized.includes('atualiz') || normalized.includes('editad')) return 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30';
  if (normalized.includes('cancelad')) return 'bg-amber-500/10 text-amber-300 border-amber-500/30';
  if (normalized.includes('inativ')) return 'bg-orange-500/10 text-orange-300 border-orange-500/30';
  if (normalized.includes('exclu')) return 'bg-red-500/10 text-red-300 border-red-500/30';

  return 'bg-gray-500/10 text-gray-300 border-gray-500/30';
}
