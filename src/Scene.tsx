import { Component, useEffect, useMemo, useRef, type ReactNode, type RefObject } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { ContactShadows } from '@react-three/drei';
import { Group, MathUtils, DataTexture, RedFormat, RepeatWrapping, MeshStandardMaterial } from 'three';
import { cloudGeometry, moonGeometry, dropGeometry } from './geometry';
import type { SceneKind } from './weather';

export type Gesture = { x:number; y:number; dragX:number; dragY:number; dragging:boolean };
export const palettes:Record<SceneKind,string>={sunny:'#bad8d8',cloudy:'#b8cfd6',rainy:'#adbfcc',night:'#718497'};

function useClay() {
  const texture = useMemo(()=>{
    const data=new Uint8Array(128*128); let seed=79;
    for(let i=0;i<data.length;i++){seed=(seed*16807)%2147483647;data[i]=100+seed%55;}
    const tex=new DataTexture(data,128,128,RedFormat); tex.wrapS=tex.wrapT=RepeatWrapping;tex.repeat.set(6,6);tex.needsUpdate=true;return tex;
  },[]);
  useEffect(()=>()=>texture.dispose(),[texture]);
  return texture;
}
function Sculptures({kind,reduced}:{kind:SceneKind;reduced:boolean}) {
  const cloud=useMemo(cloudGeometry,[]),moon=useMemo(moonGeometry,[]),drop=useMemo(dropGeometry,[]);
  const texture=useClay();
  const cream=useMemo(()=>new MeshStandardMaterial({color:'#fff0d2',roughness:.88,metalness:0,bumpMap:texture,bumpScale:.012}),[texture]);
  const gold=useMemo(()=>new MeshStandardMaterial({color:'#ffac24',roughness:.84,metalness:0,bumpMap:texture,bumpScale:.018}),[texture]);
  const ivory=useMemo(()=>new MeshStandardMaterial({color:'#ffe6a8',roughness:.8,metalness:0,emissive:'#e9ae50',emissiveIntensity:.035,bumpMap:texture,bumpScale:.008}),[texture]);
  const blue=useMemo(()=>new MeshStandardMaterial({color:'#78b4cf',roughness:.7,metalness:0}),[]);
  const sun=useRef<Group>(null), drops=useRef<Group>(null);
  useEffect(()=>()=>{cloud.dispose();moon.dispose();drop.dispose();cream.dispose();gold.dispose();ivory.dispose();blue.dispose();},[cloud,moon,drop,cream,gold,ivory,blue]);
  useFrame(({clock})=>{
    const t=reduced ? 0 : clock.elapsedTime;
    if(sun.current) sun.current.rotation.z=t*.022;
    drops.current?.children.forEach((child,i)=>{
      const phase=(t*.29+i*.213)%1;
      child.position.y=-.55-phase*1.55;
      const scale=reduced ? .75 : Math.min(1,phase*8,(1-phase)*8);
      child.scale.setScalar(scale*(i%2===0?.85:.7));
    });
  });
  return <>
    {kind==='sunny' && <group ref={sun} rotation={[0,0,.1]}>
      <mesh material={gold} scale={[1,1,.79]}><sphereGeometry args={[1.17,96,64]}/></mesh>
      {Array.from({length:9},(_,i)=>{const a=i/9*Math.PI*2; return <group key={i} position={[Math.sin(a)*1.47,Math.cos(a)*1.47,-.07]} rotation={[0,0,-a]}><mesh material={gold} scale={[.205+(i%3)*.012,.43+(i%2)*.045,.22]}><sphereGeometry args={[1,40,32]}/></mesh></group>;})}
    </group>}
    {(kind==='cloudy'||kind==='rainy') && <mesh geometry={cloud} material={cream} scale={kind==='cloudy'?1.12:1} position={[0,kind==='rainy'?.48:0,0]} rotation={[0,-.08,-.04]}/>}
    {kind==='rainy' && <group ref={drops}>{[-1.12,-.56,0,.58,1.12].map((x,i)=><mesh key={i} geometry={drop} material={blue} position={[x,-1-i*.15,.15]} rotation={[0,0,-.13]}/>)}</group>}
    {kind==='night' && <group rotation={[0,-.10,-.20]}>
      <mesh geometry={moon} material={ivory}/>
      <mesh material={ivory} position={[1.30,.64,-.1]} rotation={[0,0,.14]} scale={[.10,.15,.10]}><octahedronGeometry args={[1,2]}/></mesh>
      <mesh material={ivory} position={[.77,1.48,-.25]} scale={[.06,.09,.06]}><octahedronGeometry args={[1,2]}/></mesh>
    </group>}
  </>;
}
function Stage({kind,reduced,gesture}:{kind:SceneKind;reduced:boolean;gesture:RefObject<Gesture>}) {
  const root=useRef<Group>(null), appeared=useRef(0);
  const viewport=useThree(s=>s.viewport);
  const fit=Math.min(viewport.width/5.1,viewport.height/5.0,1.12);
  useEffect(()=>{appeared.current=reduced?1:0;},[kind,reduced]);
  useFrame(({clock},delta)=>{
    if(!root.current)return;
    const dt=Math.min(delta,.05),g=gesture.current;
    appeared.current=MathUtils.damp(appeared.current,1,6,dt);
    root.current.scale.setScalar(fit*(.92+.08*appeared.current));
    const t=reduced?0:clock.elapsedTime;
    root.current.position.y=(kind==='rainy'?.20:0)+Math.sin(t*.65)*.055;
    if(!g.dragging){g.dragX=MathUtils.damp(g.dragX,0,3,dt);g.dragY=MathUtils.damp(g.dragY,0,3,dt);}
    root.current.rotation.y=MathUtils.damp(root.current.rotation.y,.08+g.dragX+(reduced?0:g.x*.085),5,dt);
    root.current.rotation.x=MathUtils.damp(root.current.rotation.x,.04+g.dragY+(reduced?0:-g.y*.045),5,dt);
    root.current.rotation.z=reduced?0:Math.sin(t*.32)*.018;
  });
  return <>
    <ambientLight intensity={.45}/>
    <hemisphereLight args={['#fff7e8','#6c8e9c',1.1]}/>
    <directionalLight position={[-3,5,5]} intensity={2.7} color="#fff0d7"/>
    <directionalLight position={[4,1,2]} intensity={.65} color="#dcefff"/>
    <directionalLight position={[1,4,-4]} intensity={1.1} color="#fff9e9"/>
    <group ref={root}><Sculptures kind={kind} reduced={reduced}/></group>
    <ContactShadows key={`${kind}-${reduced}`} position={[0,(kind==='cloudy'?-1.55:-2.15)*fit,0]} opacity={.20} scale={9} blur={3.7} far={4.6} resolution={256} color="#284b58" frames={reduced?2:Infinity}/>
  </>;
}
class RenderBoundary extends Component<{children:ReactNode},{failed:boolean}> {
  state={failed:false};
  static getDerivedStateFromError(){return {failed:true};}
  render(){return this.state.failed?<p className="render-fallback">The sculpture needs WebGL. Your weather is still available below.</p>:this.props.children;}
}
export default function Scene(props:{kind:SceneKind;reduced:boolean;gesture:RefObject<Gesture>}) {
  return <RenderBoundary><Canvas camera={{position:[0,.2,8],fov:36}} dpr={[1,1.75]} gl={{antialias:true,alpha:true}} fallback={<p className="render-fallback">Enable WebGL to see the weather sculpture.</p>}><Stage {...props}/></Canvas></RenderBoundary>;
}
