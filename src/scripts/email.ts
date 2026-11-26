for (const link of document.querySelectorAll<HTMLAnchorElement>('a[data-email-user]')) {
  const address = `${link.dataset.emailUser}@${link.dataset.emailDomain}`;
  link.href = `mailto:${address}`;
  link.textContent = address;
}
