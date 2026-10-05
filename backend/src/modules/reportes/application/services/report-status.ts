export const displayReportStatus = (status: string | null | undefined): string => {
  if (status === 'on_time') return 'puntual';
  if (status === 'late') return 'tardanza';
  if (status === 'absent') return 'ausente';
  if (status === 'justified') return 'justificado';
  return status || 'puntual';
};
