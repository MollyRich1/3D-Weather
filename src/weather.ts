export type SceneKind = 'sunny' | 'cloudy' | 'rainy' | 'night';
export type Weather = { temperature: number; high: number; low: number; code: number; isDay: boolean; observedAt: string; timezone: string };
const descriptions: Record<number,string> = {
  0:'Clear skies',1:'Mostly clear',2:'Partly cloudy',3:'Overcast',45:'Foggy',48:'Rime fog',
  51:'Light drizzle',53:'Drizzle',55:'Heavy drizzle',56:'Light freezing drizzle',57:'Freezing drizzle',
  61:'Light rain',63:'Rain',65:'Heavy rain',66:'Light freezing rain',67:'Freezing rain',
  71:'Light snow',73:'Snow',75:'Heavy snow',77:'Snow grains',80:'Light rain showers',81:'Rain showers',
  82:'Heavy rain showers',85:'Light snow showers',86:'Heavy snow showers',95:'Thunderstorm',96:'Thunderstorm with hail',99:'Thunderstorm with heavy hail',
};
export function conditionLabel(code:number, isDay:boolean) { return code===0 && isDay ? 'Sunny' : descriptions[code] ?? 'Weather unavailable'; }
export function sceneForWeather(code:number, isDay:boolean):SceneKind {
  if ([51,53,55,56,57,61,63,65,66,67,71,73,75,77,80,81,82,85,86,95,96,99].includes(code)) return 'rainy';
  if(code===0 || code===1) return isDay ? 'sunny' : 'night';
  return 'cloudy';
}
export function parseWeather(data:any):Weather {
  const current = data?.current, daily = data?.daily;
  const dayIndex = daily?.time?.indexOf(current?.time?.slice(0,10));
  if (!current || !daily || dayIndex < 0 || ![current.temperature_2m,current.weather_code,daily.temperature_2m_max?.[dayIndex],daily.temperature_2m_min?.[dayIndex]].every(v=>typeof v==='number' && Number.isFinite(v)) || ![0,1].includes(current.is_day)) throw new Error('Incomplete weather response');
  return {temperature:current.temperature_2m, code:current.weather_code, isDay:current.is_day===1, high:daily.temperature_2m_max[dayIndex], low:daily.temperature_2m_min[dayIndex], observedAt:current.time, timezone:data.timezone};
}
export async function fetchWeather(latitude:number,longitude:number,signal:AbortSignal) {
  const params = new URLSearchParams({latitude:String(latitude),longitude:String(longitude),current:'temperature_2m,weather_code,is_day',daily:'temperature_2m_max,temperature_2m_min',temperature_unit:'fahrenheit',timezone:'auto',forecast_days:'2'});
  const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`,{signal});
  if(!response.ok) throw new Error(`Weather service returned ${response.status}`);
  return parseWeather(await response.json());
}
