export function formatFrequency(inputFreq: string): string {
  const dotCount = (inputFreq.match(/\./g) || []).length;
  if (dotCount === 1) return inputFreq;
  if (dotCount === 2) return inputFreq.substring(0, inputFreq.lastIndexOf('.'));
  return '';
}
