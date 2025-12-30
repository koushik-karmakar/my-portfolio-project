import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import useCurrentLocation from "../utils/Weather-app/getCurrentLocation.jsx";
import { AlertBox } from "../components/AlertBox.jsx";

const WeatherApp = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { coords, error } = useCurrentLocation();

  const [weatherData, setWeatherData] = useState({
    location: "New York, NY",
    temperature: 72,
    condition: "Sunny",
    humidity: 65,
    windSpeed: 8,
    precipitation: 10,
    feelsLike: 74,
    high: 76,
    low: 68,
    sunrise: "6:45 AM",
    sunset: "7:20 PM",
    forecast: [
      { day: "Mon", condition: "sunny", high: 75, low: 68 },
      { day: "Tue", condition: "partly-cloudy", high: 73, low: 67 },
      { day: "Wed", condition: "rainy", high: 70, low: 65 },
      { day: "Thu", condition: "cloudy", high: 71, low: 66 },
      { day: "Fri", condition: "sunny", high: 74, low: 67 },
    ],
    hourly: [
      { time: "Now", temp: 72, condition: "sunny" },
      { time: "1 PM", temp: 73, condition: "sunny" },
      { time: "2 PM", temp: 74, condition: "sunny" },
      { time: "3 PM", temp: 75, condition: "partly-cloudy" },
      { time: "4 PM", temp: 74, condition: "partly-cloudy" },
      { time: "5 PM", temp: 73, condition: "partly-cloudy" },
      { time: "6 PM", temp: 71, condition: "cloudy" },
    ],
    airQuality: "Good",
    uvIndex: "Moderate",
    weather: [], // Add this to store API weather data
  });

  const [isCelsius, setIsCelsius] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [apiWeatherData, setApiWeatherData] = useState(null); // Store raw API data

  const toCelsius = (f) => Math.round(((f - 32) * 5) / 9);

  const getWeatherIcon = () => {
    const data = apiWeatherData || weatherData;

    if (!data || !data.weather || data.weather.length === 0) {
      return renderCustomWeatherIcon("clear", "clear sky");
    }

    const condition = data.weather[0].main.toLowerCase();
    const description = data.weather[0].description.toLowerCase();

    return renderCustomWeatherIcon(condition, description);
  };
  const additionalStyles = `
  @keyframes drizzle {
    0% { transform: translateY(-15px); opacity: 0.5; }
    100% { transform: translateY(15px); opacity: 0; }
  }
  @keyframes heavyRain {
    0% { transform: translateY(-25px); opacity: 1; }
    100% { transform: translateY(25px); opacity: 0; }
  }
  @keyframes rain {
    0% { transform: translateY(-20px); opacity: 1; }
    100% { transform: translateY(20px); opacity: 0; }
  }
  @keyframes snow {
    0% { transform: translateY(-20px) rotate(0deg); opacity: 1; }
    100% { transform: translateY(40px) rotate(360deg); opacity: 0; }
  }
`;

  // Update your style tag to include these
  <style>{`
  @keyframes rain {
    0% { transform: translateY(-20px); opacity: 1; }
    100% { transform: translateY(20px); opacity: 0; }
  }
  @keyframes snow {
    0% { transform: translateY(-20px) rotate(0deg); opacity: 1; }
    100% { transform: translateY(40px) rotate(360deg); opacity: 0; }
  }
  @keyframes drizzle {
    0% { transform: translateY(-15px); opacity: 0.5; }
    100% { transform: translateY(15px); opacity: 0; }
  }
  @keyframes heavyRain {
    0% { transform: translateY(-25px); opacity: 1; }
    100% { transform: translateY(25px); opacity: 0; }
  }
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
`}</style>;
  // Function to render custom weather icons
  const renderCustomWeatherIcon = (condition, description) => {
    switch (condition) {
      case "clear":
        return (
          <div className="relative flex items-center justify-center">
            {/* Sun with subtle glow effect */}
            <div className="relative">
              <div className="w-32 h-32 bg-linear-to-br from-yellow-300 to-orange-400 rounded-full shadow-lg shadow-yellow-200/50"></div>
              <div className="absolute top-0 left-0 w-full h-full animate-pulse">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-2 h-10 bg-linear-to-b from-yellow-400 to-orange-300 rounded-full"
                    style={{
                      top: "50%",
                      left: "50%",
                      transform: `translate(-50%, -50%) rotate(${
                        i * 30
                      }deg) translateY(-70px)`,
                    }}
                  ></div>
                ))}
              </div>
            </div>
          </div>
        );

      case "haze":
      case "mist":
      case "fog":
        return (
          <div className="relative flex items-center justify-center">
            <div className="w-36 h-36 bg-linear-to-br from-gray-100 to-gray-300 rounded-full opacity-80 shadow-lg">
              {/* Fog layers */}
              <div className="absolute top-8 left-1/2 transform -translate-x-1/2 w-32 h-8 bg-white/40 rounded-full blur-md"></div>
              <div className="absolute top-16 left-1/2 transform -translate-x-1/2 w-28 h-6 bg-white/30 rounded-full blur-md"></div>
              <div className="absolute top-24 left-1/2 transform -translate-x-1/2 w-24 h-5 bg-white/20 rounded-full blur-md"></div>
            </div>
          </div>
        );

      case "clouds":
        if (description.includes("few") || description.includes("scattered")) {
          // Scattered clouds - much better design
          return (
            <div className="relative flex items-center justify-center">
              <div className="relative w-40 h-40">
                {/* Sun peeking through clouds */}
                <div className="absolute top-6 left-6 w-20 h-20 bg-linear-to-br from-yellow-300 to-orange-300 rounded-full shadow-lg"></div>

                {/* Cloud 1 - behind sun */}
                <div className="absolute top-10 left-2 w-32 h-20 bg-linear-to-b from-gray-100 to-gray-200 rounded-full shadow-lg opacity-90"></div>
                <div className="absolute top-8 left-4 w-24 h-16 bg-linear-to-b from-gray-200 to-gray-300 rounded-full shadow-md opacity-95"></div>

                {/* Cloud 2 - top right */}
                <div className="absolute top-4 right-6 w-28 h-16 bg-linear-to-b from-gray-100 to-gray-200 rounded-full shadow-lg opacity-80">
                  <div className="absolute -bottom-2 left-4 w-24 h-12 bg-linear-to-b from-gray-200 to-gray-300 rounded-full"></div>
                </div>

                {/* Cloud 3 - bottom left */}
                <div className="absolute bottom-8 left-10 w-24 h-14 bg-linear-to-b from-gray-150 to-gray-250 rounded-full shadow-md opacity-85">
                  <div className="absolute -bottom-1 left-6 w-20 h-10 bg-linear-to-b from-gray-250 to-gray-350 rounded-full"></div>
                </div>
              </div>
            </div>
          );
        } else if (description.includes("broken")) {
          // Broken clouds
          return (
            <div className="relative flex items-center justify-center">
              <div className="relative w-40 h-40">
                {/* Large cloud */}
                <div className="absolute top-12 left-1/2 transform -translate-x-1/2 w-36 h-24 bg-linear-to-b from-gray-100 to-gray-200 rounded-full shadow-lg">
                  <div className="absolute -bottom-3 left-8 w-28 h-16 bg-linear-to-b from-gray-200 to-gray-300 rounded-full"></div>
                  <div className="absolute -bottom-2 right-8 w-24 h-14 bg-linear-to-b from-gray-250 to-gray-350 rounded-full"></div>
                </div>

                {/* Smaller clouds around */}
                <div className="absolute top-6 left-6 w-20 h-12 bg-linear-to-b from-gray-150 to-gray-250 rounded-full shadow-md opacity-90"></div>
                <div className="absolute top-20 right-8 w-24 h-14 bg-linear-to-b from-gray-120 to-gray-220 rounded-full shadow-md opacity-95"></div>
                <div className="absolute bottom-10 left-10 w-20 h-10 bg-linear-to-b from-gray-180 to-gray-280 rounded-full shadow-sm opacity-85"></div>
              </div>
            </div>
          );
        } else {
          // Overcast clouds
          return (
            <div className="relative flex items-center justify-center">
              <div className="relative w-40 h-40">
                {/* Dark cloud layer */}
                <div className="absolute top-12 left-1/2 transform -translate-x-1/2 w-40 h-28 bg-linear-to-b from-gray-400 to-gray-600 rounded-full shadow-xl">
                  <div className="absolute -bottom-4 left-6 w-32 h-20 bg-linear-to-b from-gray-500 to-gray-700 rounded-full"></div>
                  <div className="absolute -bottom-3 right-6 w-28 h-18 bg-linear-to-b from-gray-550 to-gray-750 rounded-full"></div>
                </div>

                {/* Light rain effect for overcast */}
                <div className="absolute -bottom-2 left-0 w-full h-12">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div
                      key={i}
                      className="absolute w-1 h-4 bg-gray-400 opacity-60"
                      style={{
                        left: `${i * 14}%`,
                        animation: `drizzle 3s linear ${i * 0.4}s infinite`,
                      }}
                    ></div>
                  ))}
                </div>
              </div>
            </div>
          );
        }

      case "rain":
        return (
          <div className="relative flex items-center justify-center">
            <div className="relative w-40 h-40">
              {/* Rain cloud */}
              <div className="absolute top-12 left-1/2 transform -translate-x-1/2 w-40 h-28 bg-linear-to-b from-gray-500 to-gray-700 rounded-full shadow-xl">
                <div className="absolute -bottom-4 left-8 w-30 h-20 bg-linear-to-b from-gray-600 to-gray-800 rounded-full"></div>
                <div className="absolute -bottom-3 right-8 w-26 h-18 bg-linear-to-b from-gray-650 to-gray-850 rounded-full"></div>
              </div>

              {/* Rain drops */}
              <div className="absolute -bottom-4 left-0 w-full h-20">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-1.5 h-8 bg-linear-to-b from-blue-400 to-blue-600 rounded-full"
                    style={{
                      left: `${i * 9}%`,
                      animation: `rain 1.2s linear ${i * 0.1}s infinite`,
                    }}
                  ></div>
                ))}
              </div>
            </div>
          </div>
        );

      case "thunderstorm":
        return (
          <div className="relative flex items-center justify-center">
            <div className="relative w-40 h-40">
              {/* Storm cloud */}
              <div className="absolute top-12 left-1/2 transform -translate-x-1/2 w-40 h-28 bg-linear-to-b from-gray-700 to-gray-900 rounded-full shadow-2xl">
                <div className="absolute -bottom-4 left-6 w-34 h-20 bg-linear-to-b from-gray-800 to-black rounded-full"></div>
              </div>

              {/* Lightning */}
              <div className="absolute top-16 left-1/2 transform -translate-x-1/2">
                <div className="relative">
                  <div className="w-6 h-12 bg-linear-to-b from-yellow-300 to-yellow-500 transform -skew-x-12 shadow-lg shadow-yellow-400/50"></div>
                  <div className="absolute top-8 -right-1 w-6 h-8 bg-linear-to-b from-yellow-400 to-yellow-600 transform skew-x-12"></div>
                </div>
              </div>

              {/* Rain */}
              <div className="absolute -bottom-4 left-0 w-full h-16">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-1.5 h-10 bg-linear-to-b from-gray-400 to-gray-600 rounded-full"
                    style={{
                      left: `${i * 11}%`,
                      animation: `heavyRain 0.8s linear ${i * 0.08}s infinite`,
                    }}
                  ></div>
                ))}
              </div>
            </div>
          </div>
        );

      case "snow":
        return (
          <div className="relative flex items-center justify-center">
            <div className="relative w-40 h-40">
              {/* Snow cloud */}
              <div className="absolute top-12 left-1/2 transform -translate-x-1/2 w-36 h-24 bg-linear-to-b from-gray-200 to-gray-300 rounded-full shadow-lg">
                <div className="absolute -bottom-3 left-8 w-28 h-16 bg-linear-to-b from-gray-250 to-gray-350 rounded-full"></div>
              </div>

              {/* Snowflakes */}
              <div className="absolute -bottom-2 left-0 w-full h-24">
                {Array.from({ length: 15 }).map((_, i) => (
                  <div
                    key={i}
                    className="absolute text-xl text-blue-100 font-bold"
                    style={{
                      left: `${i * 7}%`,
                      top: `${Math.sin(i) * 5}px`,
                      animation: `snow 4s linear ${i * 0.2}s infinite`,
                    }}
                  >
                    ❄
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case "drizzle":
        return (
          <div className="relative flex items-center justify-center">
            <div className="relative w-40 h-40">
              {/* Light cloud with drizzle */}
              <div className="absolute top-14 left-1/2 transform -translate-x-1/2 w-36 h-22 bg-linear-to-b from-gray-300 to-gray-400 rounded-full shadow-lg opacity-90">
                <div className="absolute -bottom-2 left-10 w-24 h-12 bg-linear-to-b from-gray-350 to-gray-450 rounded-full"></div>
              </div>

              {/* Light drizzle */}
              <div className="absolute -bottom-2 left-0 w-full h-16">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-1 h-6 bg-linear-to-b from-blue-300 to-blue-400 opacity-70"
                    style={{
                      left: `${i * 10}%`,
                      animation: `drizzle 2.5s linear ${i * 0.2}s infinite`,
                    }}
                  ></div>
                ))}
              </div>
            </div>
          </div>
        );

      default:
        // Fallback to a nice cloud icon
        return (
          <div className="relative flex items-center justify-center">
            <div className="w-36 h-36 bg-linear-to-b from-gray-100 to-gray-300 rounded-full shadow-lg">
              <div className="absolute top-10 left-1/2 transform -translate-x-1/2 w-28 h-18 bg-linear-to-b from-white to-gray-200 rounded-full">
                <div className="absolute -bottom-2 left-6 w-20 h-10 bg-linear-to-b from-gray-200 to-gray-300 rounded-full"></div>
              </div>
              <div className="absolute top-14 left-8 w-20 h-12 bg-linear-to-b from-gray-150 to-gray-250 rounded-full opacity-80"></div>
              <div className="absolute top-16 right-10 w-22 h-10 bg-linear-to-b from-gray-180 to-gray-280 rounded-full opacity-90"></div>
            </div>
          </div>
        );
    }
  };

  // Simple component for OpenWeatherMap icons
  const WeatherIconSimple = () => {
    const data = apiWeatherData || weatherData;

    if (!data?.weather?.[0]?.icon) {
      return (
        <div className="w-32 h-32 bg-gray-200 rounded-full flex items-center justify-center">
          <span className="text-4xl">☁️</span>
        </div>
      );
    }

    const iconCode = data.weather[0].icon;

    return (
      <img
        src={`https://openweathermap.org/img/wn/${iconCode}@4x.png`}
        alt={data.weather[0].description}
        className="w-48 h-48 object-contain"
      />
    );
  };

  useEffect(() => {
    if (error) {
      AlertBox("error", "Failed to get location. Using default location.");
      console.error("Location error:", error);
    }
  }, [error]);

  useEffect(() => {
    if (!coords) {
      // console.log("Waiting for coords...");
      return;
    }

    const fetchWeather = async () => {
      setLoading(true);
      const API_key = import.meta.env.VITE_API_KEY;

      if (!API_key) {
        AlertBox(
          "error",
          "API key is missing. Please configure your API key to continue.",
          500
        );
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get(
          `https://api.openweathermap.org/data/2.5/weather`,
          {
            params: {
              lat: coords.lat,
              lon: coords.lon,
              appid: API_key,
              units: "imperial",
            },
          }
        );

        if (!response || !response.data) {
          AlertBox("error", "Failed to fetch weather data.");
          setLoading(false);
          return;
        }

        console.log("Weather API response:", response.data);

        // Store raw API data
        setApiWeatherData(response.data);

        // Format time function
        const formatTime = (timestamp) => {
          return new Date(timestamp * 1000).toLocaleTimeString("en-IN", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          });
        };

        // Update weatherData with API response
        setWeatherData((prev) => ({
          ...prev,
          location: response.data?.name || "Unknown Location",
          temperature: response.data?.main?.temp || prev.temperature,
          condition: response.data?.weather[0]?.description || prev.condition,
          humidity: response.data?.main?.humidity || prev.humidity,
          windSpeed: Math.floor(response.data?.wind?.speed) || prev.windSpeed,
          precipitation:
            response.data?.rain?.["1h"] || response.data?.snow?.["1h"] || 0,
          feelsLike:
            Math.floor(response.data?.main?.feels_like) || prev.feelsLike,
          high: Math.floor(response.data?.main?.temp_max) || prev.high,
          low: Math.floor(response.data?.main?.temp_min) || prev.low,
          sunrise: formatTime(response.data?.sys?.sunrise) || prev.sunrise,
          sunset: formatTime(response.data?.sys?.sunset) || prev.sunset,
          weather: response.data?.weather || [], // Store weather array
        }));
      } catch (err) {
        console.error("Weather API error:", err);
        AlertBox("error", `Failed to fetch weather data: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
  }, [coords]);

  // Handle search
  const handleSearch = async (e) => {
    e?.preventDefault();
    if (!searchQuery.trim()) return;

    const API_key = import.meta.env.VITE_API_KEY;

    if (!API_key) {
      AlertBox("error", "API key is missing.");
      return;
    }

    setLoading(true);

    try {
      const response = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather`,
        {
          params: {
            q: searchQuery,
            appid: API_key,
            units: "imperial",
          },
        }
      );

      if (response.data) {
        setApiWeatherData(response.data);

        const formatTime = (timestamp) => {
          return new Date(timestamp * 1000).toLocaleTimeString("en-IN", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          });
        };

        setWeatherData((prev) => ({
          ...prev,
          location: response.data.name,
          temperature: response.data.main.temp,
          condition: response.data.weather[0].description,
          humidity: response.data.main.humidity,
          windSpeed: Math.floor(response.data.wind.speed),
          precipitation:
            response.data.rain?.["1h"] || response.data.snow?.["1h"] || 0,
          feelsLike: Math.floor(response.data.main.feels_like),
          high: Math.floor(response.data.main.temp_max),
          low: Math.floor(response.data.main.temp_min),
          sunrise: formatTime(response.data.sys.sunrise),
          sunset: formatTime(response.data.sys.sunset),
          weather: response.data.weather,
        }));
      }
    } catch (err) {
      console.error("Search error:", err);
      AlertBox("error", `City not found: ${searchQuery}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle Enter key press in search
  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-b from-blue-50 to-gray-100 p-4 md:p-8">
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-700">Loading weather data...</p>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-center content-center mb-5">
          <div className="flex justify-center text-center content-center">
            <h1 className="text-3xl font-bold text-gray-800 mb-4 md:mb-0">
              WeatherSphere
            </h1>
          </div>

          <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-4 w-full md:w-auto">
            {/* Search Bar */}
            <div className="relative w-full md:w-64">
              <input
                type="text"
                placeholder="Search city or location..."
                className="w-full p-3 pl-10 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onClick={handleKeyPress}
              />
              <div className="absolute left-3 top-3.5 text-gray-400">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <button
                onClick={handleSearch}
                className="absolute right-3 top-3 bg-blue-500 text-white p-1 rounded hover:bg-blue-600"
              >
                Search
              </button>
            </div>

            {/* Temperature Toggle */}
            <div className="flex items-center space-x-2 bg-white rounded-lg p-1 shadow-sm">
              <button
                className={`px-3 py-1.5 rounded-md text-sm font-medium ${
                  !isCelsius ? "bg-blue-500 text-white" : "text-gray-700"
                }`}
                onClick={() => setIsCelsius(false)}
              >
                °F
              </button>
              <button
                className={`px-3 py-1.5 rounded-md text-sm font-medium ${
                  isCelsius ? "bg-blue-500 text-white" : "text-gray-700"
                }`}
                onClick={() => setIsCelsius(true)}
              >
                °C
              </button>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Weather Card - Left Column */}
          <div className="lg:col-span-2">
            <div className="bg-linear-to-r from-blue-500 to-blue-600 rounded-2xl shadow-xl p-6 text-white mb-6">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold">{weatherData.location}</h2>
                  <p className="text-blue-100">
                    Today,{" "}
                    {new Date().toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <button className="bg-white/20 hover:bg-white/30 p-2 rounded-full transition">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="flex flex-col md:flex-row items-center mt-8">
                <div className="mb-6 md:mb-0 md:mr-10 text-center md:text-left">
                  <div className="flex items-center justify-center md:justify-start">
                    <span className="text-7xl font-bold">
                      {isCelsius
                        ? toCelsius(weatherData.temperature)
                        : Math.round(weatherData.temperature)}
                    </span>
                    <span className="text-4xl mt-2">
                      °{isCelsius ? "C" : "F"}
                    </span>
                  </div>
                  <p className="text-xl mt-2 capitalize">
                    {weatherData.condition}
                  </p>
                  <p className="text-blue-100 mt-1">
                    Feels like{" "}
                    {isCelsius
                      ? toCelsius(weatherData.feelsLike)
                      : Math.round(weatherData.feelsLike)}
                    °
                  </p>
                </div>

                <div className="flex-1 flex justify-center">
                  {/* Weather Icon */}
                  <div className="w-48 h-48 flex items-center justify-center">
                    {getWeatherIcon()}
                  </div>
                </div>
              </div>

              {/* Weather Details */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-6 border-t border-white/20">
                <div className="text-center">
                  <p className="text-blue-100 text-sm">Humidity</p>
                  <p className="text-xl font-semibold mt-1">
                    {weatherData.humidity}%
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-blue-100 text-sm">Wind</p>
                  <p className="text-xl font-semibold mt-1">
                    {weatherData.windSpeed} mph
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-blue-100 text-sm">Precipitation</p>
                  <p className="text-xl font-semibold mt-1">
                    {weatherData.precipitation}%
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-blue-100 text-sm">High / Low</p>
                  <p className="text-xl font-semibold mt-1">
                    {isCelsius
                      ? toCelsius(weatherData.high)
                      : Math.round(weatherData.high)}
                    ° /{" "}
                    {isCelsius
                      ? toCelsius(weatherData.low)
                      : Math.round(weatherData.low)}
                    °
                  </p>
                </div>
              </div>
            </div>

            {/* Hourly Forecast */}
            {/* <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                Hourly Forecast
              </h3>
              <div className="flex overflow-x-auto pb-4 space-x-6 scrollbar-hide">
                {weatherData.hourly.map((hour, index) => (
                  <div
                    key={index}
                    className="flex flex-col items-center min-w-[70px]"
                  >
                    <p className="text-gray-600 font-medium">{hour.time}</p>
                    <div className="my-3 text-3xl">
                      {hour.condition === "sunny" && "☀️"}
                      {hour.condition === "partly-cloudy" && "⛅"}
                      {hour.condition === "cloudy" && "☁️"}
                      {hour.condition === "rainy" && "🌧️"}
                    </div>
                    <p className="text-xl font-bold text-gray-800">
                      {isCelsius ? toCelsius(hour.temp) : hour.temp}°
                    </p>
                  </div>
                ))}
              </div>
            </div> */}
          </div>

          {/* Right Column - Additional Info */}
          <div className="lg:col-span-1">
            {/* Sunrise & Sunset */}
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                Sunrise & Sunset
              </h3>
              <div className="space-y-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center mr-4">
                    <span className="text-2xl">🌅</span>
                  </div>
                  <div>
                    <p className="text-gray-600">Sunrise</p>
                    <p className="text-xl font-bold">{weatherData.sunrise}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center mr-4">
                    <span className="text-2xl">🌇</span>
                  </div>
                  <div>
                    <p className="text-gray-600">Sunset</p>
                    <p className="text-xl font-bold">{weatherData.sunset}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Air Quality */}
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-800">Air Quality</h3>
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                  {weatherData.airQuality}
                </span>
              </div>
              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Good</span>
                  <span>Moderate</span>
                  <span>Unhealthy</span>
                </div>
                <div className="h-3 bg-linear-to-r from-green-400 via-yellow-400 to-red-500 rounded-full"></div>
              </div>
              <p className="text-gray-600 text-sm">
                Air quality is satisfactory, and air pollution poses little or
                no risk.
              </p>
            </div>

            {/* UV Index */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-800">UV Index</h3>
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                  {weatherData.uvIndex}
                </span>
              </div>
              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Low</span>
                  <span>Moderate</span>
                  <span>High</span>
                </div>
                <div className="h-3 bg-linear-to-r from-green-400 via-yellow-400 to-red-500 rounded-full"></div>
              </div>
              <p className="text-gray-600 text-sm">
                Medium risk of harm from unprotected sun exposure.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-8 text-center text-gray-500 text-sm">
          <p>Weather data provided by OpenWeatherMap API</p>
          <p className="mt-1">
            © {new Date().getFullYear()} WeatherSphere. All rights reserved.
          </p>
        </footer>
      </div>

      {/* Add CSS animations */}
      <style>{`
        @keyframes rain {
          0% { transform: translateY(-20px); opacity: 1; }
          100% { transform: translateY(20px); opacity: 0; }
        }
        @keyframes snow {
          0% { transform: translateY(-20px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(40px) rotate(360deg); opacity: 0; }
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
};

export default WeatherApp;
