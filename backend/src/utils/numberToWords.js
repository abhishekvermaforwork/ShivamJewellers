/**
 * Indian English number to words (integer rupees) — mirrors Django invoices/services.number_to_words.
 */
export function numberToWords(n) {
  const num = Math.floor(Math.abs(Number(n)));
  if (num === 0) return 'Zero';

  const ones = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen',
  ];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function below1000(x) {
    if (x === 0) return '';
    if (x < 20) return `${ones[x]} `;
    if (x < 100) {
      return `${tens[Math.floor(x / 10)]}${x % 10 ? ` ${ones[x % 10]}` : ''} `;
    }
    return `${ones[Math.floor(x / 100)]} Hundred ${below1000(x % 100)}`;
  }

  let rest = num;
  let result = '';

  if (rest >= 10000000) {
    result += `${below1000(Math.floor(rest / 10000000))}Crore `;
    rest %= 10000000;
  }
  if (rest >= 100000) {
    result += `${below1000(Math.floor(rest / 100000))}Lakh `;
    rest %= 100000;
  }
  if (rest >= 1000) {
    result += `${below1000(Math.floor(rest / 1000))}Thousand `;
    rest %= 1000;
  }
  result += below1000(rest);
  return `${result.trim()} Only`;
}
