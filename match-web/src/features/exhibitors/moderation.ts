import { type Exhibitor } from '@/domain/exhibitor';

export const APPROVAL_ITEMS = [
  { key: 'company', label: 'Empresa' },
  { key: 'logo', label: 'Logo' },
  { key: 'about', label: 'Descrição' },
  { key: 'industry', label: 'Setor' },
  { key: 'contact', label: 'Contato' },
  { key: 'products', label: 'Produtos' },
  { key: 'stand', label: 'Estande' },
] as const;

export function getExhibitorApprovalChecklist(item: Exhibitor) {
  return APPROVAL_ITEMS.map((approvalItem) => {
    let done = false;
    switch (approvalItem.key) {
      case 'company':
        done = Boolean(item.company.trim());
        break;
      case 'logo':
        done = Boolean(item.logoUrl || item.logo);
        break;
      case 'about':
        done = Boolean(item.about.trim());
        break;
      case 'industry':
        done = Boolean(item.industry.trim());
        break;
      case 'contact':
        done = Boolean(item.contactEmail?.trim() || item.contactPhone?.trim() || item.contactName?.trim());
        break;
      case 'products':
        done = item.products.some((product) => product.trim().length > 0);
        break;
      case 'stand':
        done = Boolean(item.stand.trim());
        break;
    }
    return { ...approvalItem, done };
  });
}

export function isExhibitorReadyForPublication(item: Exhibitor) {
  return getExhibitorApprovalChecklist(item).every((approvalItem) => approvalItem.done);
}

export function splitList(value: string): string[] {
  return [...new Set(value.split(/[\n,;]/).map((item) => item.trim()).filter(Boolean))];
}
