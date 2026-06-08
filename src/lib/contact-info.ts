export const CONTACT_INFO = {
  phone: '0868663667',
  email: 'trietminhpham79@gmail.com',
  address: 'HUTECH University - Thu Duc Campus',
} as const

export function getContactPhoneHref(phone: string = CONTACT_INFO.phone): string {
  return `tel:${phone.replace(/\D/g, '')}`
}

export function getContactEmailHref(email: string = CONTACT_INFO.email): string {
  return `mailto:${email}`
}

export function getContactSupportLine(): string {
  return `Hotline: ${CONTACT_INFO.phone} | ${CONTACT_INFO.email}`
}
