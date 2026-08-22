async function searchHotels(city, checkIn, checkOut, guests) {
  const serpapiKey = process.env.SERPAPI_KEY;

  if (serpapiKey && serpapiKey !== 'your_serpapi_key_here' && !serpapiKey.startsWith('http')) {
    const hotels = await searchHotelsSerpApi(city, checkIn, checkOut, guests, serpapiKey);
    if (hotels && hotels.length > 0) return hotels;
    console.log('SerpApi returned no hotels or failed. Falling back to AI...');
  }
  
  console.log('Using AI Fallback for hotel estimates...');
  return await searchHotelsAI(city, checkIn, checkOut, guests);
}

async function searchHotelsSerpApi(city, checkIn, checkOut, guests, apiKey) {
  // SerpApi Google Hotels Integration
  let url = `https://serpapi.com/search.json?engine=google_hotels&q=${city}&check_in_date=${checkIn}&check_out_date=${checkOut}&adults=${guests}&currency=USD&hl=en&api_key=${apiKey}`;

  try {
    const res = await fetch(url);
    const data = await res.json();
    
    if (!data.properties || data.properties.length === 0) {
      return [];
    }

    return data.properties.slice(0, 5).map((hotel, index) => ({
      id: hotel.id || `hotel-${index}`,
      name: hotel.name || 'Unknown Hotel',
      type: 'Hotel',
      pricePerNight: hotel.rate_per_night?.lowest ? parseInt(hotel.rate_per_night.lowest.replace(/[^0-9]/g, '')) : 0,
      totalPrice: hotel.total_rate?.lowest ? parseInt(hotel.total_rate.lowest.replace(/[^0-9]/g, '')) : 0,
      rating: hotel.overall_rating || 4.0,
      currency: 'USD',
      bookingUrl: hotel.link || `https://www.booking.com/searchresults.html?ss=${city}&checkin=${checkIn}&checkout=${checkOut}&group_adults=${guests}`
    }));
  } catch (err) {
    console.error('SerpApi Hotel Error:', err);
    return [];
  }
}

async function searchHotelsAI(city, checkIn, checkOut, guests) {
  const openRouterKey = process.env.OPENROUTER_API_KEY;
  if (!openRouterKey) {
    throw new Error('No API keys configured for hotel search.');
  }

  const prompt = `You are a travel agent. The user is looking for accommodation in ${city} from ${checkIn} to ${checkOut} for ${guests} guests.
Provide 3 highly realistic accommodation options:
1. A Budget/Mid-Range Hotel
2. A Luxury Hotel
3. An Airbnb (Whole Apartment)

Respond ONLY with a valid JSON array. Each object must have:
- "name": string (e.g., "Ibis Styles Paris", "The Ritz", "Charming Montmartre Apartment")
- "type": string (must be either "Hotel" or "Airbnb")
- "pricePerNight": number (realistic estimate in USD)
- "totalPrice": number (pricePerNight * total nights)
- "rating": number (e.g., 4.5)`;

  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'openai/gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const aiData = await res.json();
    const content = aiData.choices[0].message.content.trim();
    const cleanContent = content.replace(/^```json/i, '').replace(/```$/i, '').trim();
    const hotels = JSON.parse(cleanContent);

    // Map AI results and dynamically inject the Google Flights search URL!
    return hotels.map((h, i) => {
      // Dynamically construct booking URLs
      let bookingUrl = '';
      if (h.type.toLowerCase().includes('airbnb')) {
        bookingUrl = `https://www.airbnb.com/s/${city}/homes?checkin=${checkIn}&checkout=${checkOut}&adults=${guests}`;
      } else {
        bookingUrl = `https://www.booking.com/searchresults.html?ss=${city}&checkin=${checkIn}&checkout=${checkOut}&group_adults=${guests}`;
      }

      return {
        id: `ai-hotel-${i}`,
        name: h.name,
        type: h.type,
        pricePerNight: h.pricePerNight,
        totalPrice: h.totalPrice,
        rating: h.rating,
        currency: 'USD',
        bookingUrl: bookingUrl,
        isAiEstimate: true
      };
    });

  } catch (err) {
    console.error('AI Hotel Error:', err);
    return [];
  }
}

module.exports = { searchHotels };
