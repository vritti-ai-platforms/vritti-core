export const getInitials = (name?: string | null) => {
  const trimmedName = name?.trim();

  if (!trimmedName) {
    return 'AC';
  }

  const parts = trimmedName.split(/\s+/).filter(Boolean);
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
};

export const formatDateTime = (value?: string | null) => {
  if (!value) return undefined;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return undefined;
  }

  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
};
