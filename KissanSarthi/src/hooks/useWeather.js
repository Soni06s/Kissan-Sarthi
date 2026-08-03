import { useState, useEffect } from "react";

const API_KEY = process.env.ea671697861c6f5a3939616764dd0610;
const BASE = "https://api.openweathermap.org/data/2.5";

export const useWeather = (city) => {
    const [weather, setWeather] = useState(null);
    const [forecast, setForecast] = useState([]);
    const [hourly, setHourly] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!city) return;

        const load = async () => {
            try {
                setLoading(true);
                setError(null);

                const [wRes, fRes] = await Promise.all([
                    fetch(`${BASE}/weather?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`),
                    fetch(`${BASE}/forecast?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric&cnt=40`),
                ]);

                if (!wRes.ok) {
                    throw new Error(
                        wRes.status === 404
                            ? `City "${city}" not found. Try "Jammu" or "Srinagar".`
                            : wRes.status === 401
                                ? "Invalid API key. Please check your .env file."
                                : "Failed to fetch weather. Try again."
                    );
                }

                const wData = await wRes.json();
                const fData = await fRes.json();

                setWeather(wData);

                // ── One entry per day (pick noon slot closest) ──
                const daily = [];
                const seen = new Set();
                for (const item of fData.list) {
                    const date = item.dt_txt.split(" ")[0];
                    if (!seen.has(date) && daily.length < 7) {
                        seen.add(date);
                        daily.push(item);
                    }
                }
                setForecast(daily);

                // ── Next 9 slots = ~27 hours ──
                setHourly(fData.list.slice(0, 9));

            } catch (e) {
                setError(e.message);
            } finally {
                setLoading(false);
            }
        };

        load();
    }, [city]);

    return { weather, forecast, hourly, loading, error };
};