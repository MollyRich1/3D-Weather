import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { createRoot } from 'react-dom/client';
import Scene, { palettes, type Gesture } from './Scene';
import { conditionLabel, sceneForWeather, type SceneKind } from './weather';
import { useWeather } from './useWeather';
import './style.css';

function App() {
  const {place,weather,loading,error,updated,refresh}=useWeather();
  const [preview,setPreview]=useState<SceneKind|'live'>('live');
  const [reduced,setReduced]=useState(()=>matchMedia('(prefers-reduced-motion: reduce)').matches);
  const gesture=useRef<Gesture>({x:0,y:0,dragX:0,dragY:0,dragging:false});
  const previous=useRef({x:0,y:0});
  useEffect(()=>{const query=matchMedia('(prefers-reduced-motion: reduce)');const change=()=>setReduced(query.matches);query.addEventListener('change',change);return()=>query.removeEventListener('change',change);},[]);
  const kind=preview==='live'?(weather?sceneForWeather(weather.code,weather.isDay):'cloudy'):preview;
  const release=()=>{gesture.current.dragging=false;};
  return <main className={`experience ${kind}`} style={{'--sky':palettes[kind]} as CSSProperties}>
    <header><span className="wordmark">a little weather<span className="wordmark-dot">.</span></span><span className="edition">A small moment with the sky</span></header>
    <section className="composition" aria-label="Current weather">
      <div className="sculpture" role="img" aria-label={`${kind} clay sculpture. Drag gently to turn it.`}
        onPointerDown={e=>{gesture.current.dragging=true;previous.current={x:e.clientX,y:e.clientY};e.currentTarget.setPointerCapture(e.pointerId);}}
        onPointerMove={e=>{const g=gesture.current,rect=e.currentTarget.getBoundingClientRect();g.x=(e.clientX-rect.left)/rect.width*2-1;g.y=(e.clientY-rect.top)/rect.height*2-1;if(g.dragging){g.dragX=Math.max(-.55,Math.min(.55,g.dragX+(e.clientX-previous.current.x)*.006));g.dragY=Math.max(-.3,Math.min(.3,g.dragY+(e.clientY-previous.current.y)*.006));previous.current={x:e.clientX,y:e.clientY};}}}
        onPointerUp={release} onPointerCancel={release} onLostPointerCapture={release} onPointerLeave={()=>{gesture.current.x=gesture.current.y=0;}}>
        <Scene kind={kind} reduced={reduced} gesture={gesture}/>
      </div>
      <div className="weather-copy" aria-live="polite" aria-atomic="true">
        <div className="weather-card">
          <p className="location">{place?.name??'Finding your little corner of the world'}</p>
          <h1 aria-label={weather?`${Math.round(weather.temperature)} degrees Fahrenheit`:'Temperature unavailable'}>{weather?Math.round(weather.temperature):'—'}<span className="degree">°</span></h1>
          <p className="condition">{weather?conditionLabel(weather.code,weather.isDay):error?'Weather unavailable':loading?'Watching the sky…':'Waiting for the weather'}</p>
          <div className="card-divider" aria-hidden="true"/>
          <p className="range">{weather?<><span>H: {Math.round(weather.high)}°</span><span>L: {Math.round(weather.low)}°</span></>:'Current conditions · °F'}</p>
        </div>
        {place?.fallback&&<p className="location-note">Using default location · Ann Arbor, Michigan</p>}
        {place?.labelUnavailable&&<p className="location-note">Local weather · city name unavailable</p>}
        {error&&<p className="error">{weather?'Showing the last update. ':''}{error} <button onClick={()=>void refresh()}>Retry</button></p>}
      </div>
    </section>
    <footer>
      <div className="source"><a href="https://open-meteo.com/" target="_blank" rel="noreferrer">Weather by Open-Meteo</a><span>{updated?`${error?'Last update':'Updated'} ${updated.toLocaleTimeString([],{hour:'numeric',minute:'2-digit'})} · °F`:'Live weather · °F'}</span></div>
      <span className="drag-hint">A little movement. A little wonder.</span>
      <button className="refresh" onClick={()=>void refresh()} disabled={loading||!place} aria-label="Refresh weather"><svg className={loading?'spinning':''} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20 10a8 8 0 1 0-2 8M20 4v6h-6"/></svg><span>{loading?'Updating':'Refresh'}</span></button>
    </footer>
    {import.meta.env.DEV&&<aside className="preview" aria-label="Development scene preview"><span className="preview-label">SCENE STUDY</span><div className="preview-options">{(['live','sunny','cloudy','rainy','night'] as const).map(value=><button key={value} aria-pressed={value===preview} onClick={()=>setPreview(value)}>{value==='live'?'Live weather':value.charAt(0).toUpperCase()+value.slice(1)}</button>)}</div>{preview!=='live'&&<span className="preview-note">Sculpture preview · weather readings stay live</span>}</aside>}
  </main>;
}
createRoot(document.getElementById('root')!).render(<App/>);
