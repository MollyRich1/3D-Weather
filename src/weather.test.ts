import test from 'node:test';
import assert from 'node:assert/strict';
import {sceneForWeather, conditionLabel, parseWeather, fetchWeather} from './weather.ts';
import {cloudGeometry,moonGeometry,dropGeometry} from './geometry.ts';

test('clear skies follow API day/night; clouds stay clouds at night',()=>{
  assert.equal(sceneForWeather(0,true),'sunny');assert.equal(sceneForWeather(0,false),'night');
  assert.equal(sceneForWeather(1,false),'night');
  for(const code of [2,3,45,48,999])assert.equal(sceneForWeather(code,false),'cloudy');
});
test('every precipitation code takes priority over night',()=>{
  for(const code of [51,53,55,56,57,61,63,65,66,67,71,73,75,77,80,81,82,85,86,95,96,99]) {
    assert.equal(sceneForWeather(code,false),'rainy');
    assert.notEqual(conditionLabel(code,false),'Weather unavailable');
  }
  assert.equal(conditionLabel(75,false),'Heavy snow');
});
const sample={current:{temperature_2m:41.7,weather_code:61,is_day:0,time:'2026-11-20T00:15'},daily:{time:['2026-11-19','2026-11-20'],temperature_2m_max:[66,47],temperature_2m_min:[45,30]},timezone:'America/Detroit'};
test('forecast is matched to the location date, including midnight',()=>{
  const result=parseWeather(sample);assert.equal(result.high,47);assert.equal(result.low,30);assert.equal(result.isDay,false);assert.equal(result.temperature,41.7);
});
test('missing, null, and invalid live data fail instead of displaying invented values',()=>{
  for(const value of [{},null,{...sample,current:{...sample.current,temperature_2m:null}},{...sample,current:{...sample.current,is_day:5}},{...sample,daily:{...sample.daily,time:['2026-11-18']}}])assert.throws(()=>parseWeather(value));
});
test('weather request uses Fahrenheit, API day/night and local daily forecast; HTTP errors surface',async()=>{
  const original=globalThis.fetch;
  try {
    globalThis.fetch=async(input)=>{
      const url=new URL(String(input));assert.equal(url.hostname,'api.open-meteo.com');assert.equal(url.searchParams.get('temperature_unit'),'fahrenheit');assert.equal(url.searchParams.get('timezone'),'auto');assert.match(url.searchParams.get('current')!,/is_day/);
      return new Response(JSON.stringify(sample),{status:200});
    };
    assert.equal((await fetchWeather(42.2808,-83.743,new AbortController().signal)).code,61);
    globalThis.fetch=async()=>new Response('',{status:503});
    await assert.rejects(()=>fetchWeather(42,-83,new AbortController().signal),/503/);
  }finally{globalThis.fetch=original;}
});
test('procedural sculptures have finite vertices and outward-facing closed surfaces',()=>{
  for(const make of [cloudGeometry,moonGeometry,dropGeometry]){
    const g=make(),p=g.getAttribute('position'),index=g.getIndex();let volume=0;
    const count=index?index.count:p.count;
    for(let j=0;j<count;j+=3){
      const a=index?index.getX(j):j,b=index?index.getX(j+1):j+1,c=index?index.getX(j+2):j+2;
      volume+=(p.getX(a)*(p.getY(b)*p.getZ(c)-p.getZ(b)*p.getY(c))+p.getY(a)*(p.getZ(b)*p.getX(c)-p.getX(b)*p.getZ(c))+p.getZ(a)*(p.getX(b)*p.getY(c)-p.getY(b)*p.getX(c)))/6;
    }
    assert.ok(volume>0,`${make.name}: winding must face outward`);
    assert.ok([...p.array].every(Number.isFinite));g.dispose();
  }
});
