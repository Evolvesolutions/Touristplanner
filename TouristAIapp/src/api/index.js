// api.js
import axios from 'axios';

export const getTouristRecommendations = async (startCity, endCity) => {
  try {
    const response = await axios.post(
      "http://127.0.0.1:8000/api/recommendations/",
      {
        start_city: startCity,
        end_city: endCity,
      }
    );
    return response.data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};



