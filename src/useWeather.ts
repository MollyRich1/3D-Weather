import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchWeather, type Weather } from './weather';
type Place={latitude:number;longitude:number;name:string;fallback:boolean;labelUnavailable?:boolean};
const defaultPlace:Place={latitude:42.2808,longitude:-83.7430,name:'Ann Arbor',fallback:true};
export function useWeather() {
  const [place,setPlace]=useState<Place|null>(null),[weather,setWeather]=useState<Weather|null>(null);
  const [loading,setLoading]=useState(true),[error,setError]=useState(''),[updated,setUpdated]=useState<Date|null>(null);
  const request=useRef<AbortController|null>(null);
  useEffect(()=>{
    let cancelled=false; const geocode=new AbortController();
    const fallback=()=>{if(!cancelled)setPlace(defaultPlace);};
    // An explicit timer also covers browsers that leave a permission prompt unanswered.
    const timer=window.setTimeout(fallback,12000);
    if(!navigator.geolocation){clearTimeout(timer);fallback();return;}
    navigator.geolocation.getCurrentPosition(async position=>{
      clearTimeout(timer); if(cancelled)return;
      const {latitude,longitude}=position.coords;
      setPlace({latitude,longitude,name:'Your location',fallback:false});
      try {
        const response=await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`,{signal:AbortSignal.any([geocode.signal,AbortSignal.timeout(8000)])});
        if(!response.ok)throw new Error('Location lookup unavailable');
        const data=await response.json(); const name=data.city||data.locality||data.principalSubdivision;
        if(!name)throw new Error('No location label');
        if(!cancelled)setPlace({latitude,longitude,name,fallback:false});
      }catch{if(!cancelled)setPlace({latitude,longitude,name:'Your location',fallback:false,labelUnavailable:true});}
    },()=>{clearTimeout(timer);fallback();},{timeout:10000,maximumAge:300000,enableHighAccuracy:false});
    return()=>{cancelled=true;clearTimeout(timer);geocode.abort();};
  },[]);
  const latitude=place?.latitude,longitude=place?.longitude;
  const refresh=useCallback(async()=>{
    if(latitude===undefined||longitude===undefined)return;
    request.current?.abort();const controller=new AbortController();request.current=controller;
    setLoading(true);setError('');
    try {
      const next=await fetchWeather(latitude,longitude,AbortSignal.any([controller.signal,AbortSignal.timeout(12000)]));
      if(!controller.signal.aborted){setWeather(next);setUpdated(new Date());}
    }catch {if(!controller.signal.aborted)setError('Weather could not be refreshed. Please try again.');}
    finally{if(!controller.signal.aborted)setLoading(false);}
  },[latitude,longitude]);
  useEffect(()=>{setWeather(null);setUpdated(null);void refresh();const id=setInterval(refresh,15*60*1000);return()=>{clearInterval(id);request.current?.abort();};},[refresh]);
  return {place,weather,loading,error,updated,refresh};
}
