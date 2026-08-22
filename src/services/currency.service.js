async function convertCurrency(amount, fromCurrency, toCurrency) {
  if (fromCurrency === toCurrency) return amount;
  
  const apiKey = process.env.EXCHANGE_RATE_API_KEY;
  if (!apiKey) {
    console.warn('EXCHANGE_RATE_API_KEY not set. Falling back to 1:1 conversion.');
    return amount;
  }
  
  try {
    const res = await fetch(`https://v6.exchangerate-api.com/v6/${apiKey}/pair/${fromCurrency}/${toCurrency}/${amount}`);
    const data = await res.json();
    if (data.result === 'success') {
      return data.conversion_result;
    }
    return amount;
  } catch (error) {
    console.error('Currency conversion failed:', error);
    return amount;
  }
}

module.exports = { convertCurrency };
