import { BufferGeometry, Float32BufferAttribute, MeshBasicMaterial } from 'three';
import { MarchingCubes } from 'three/addons/objects/MarchingCubes.js';

// A smooth union of ellipsoidal volumes, extracted as a single continuous surface.
// There are no overlapping sphere meshes or seams in the cloud.
function smoothMin(a: number, b: number, k: number) {
  const h = Math.max(k - Math.abs(a - b), 0) / k;
  return Math.min(a, b) - h * h * k * 0.25;
}
export function cloudGeometry() {
  const n = 76, extent = 2.5;
  const material = new MeshBasicMaterial();
  const mc = new MarchingCubes(n, material, false, false, 45000);
  mc.isolation = 0;
  const lobes = [
    [-1.04, -.28, 0, .78, .72, .63],
    [-.62, .34, .05, .61, .77, .65],
    [.32, .60, -.04, .83, .96, .73],
    [1.10, -.20, -.02, .73, .73, .61],
    [0, -.48, .03, 1.25, .54, .70],
  ];
  for (let z = 0; z < n; z++) for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const px = (x / n * 2 - 1) * extent;
    const py = (y / n * 2 - 1) * extent;
    const pz = (z / n * 2 - 1) * extent;
    let d = 10;
    for (const [cx, cy, cz, rx, ry, rz] of lobes) {
      const e = (Math.hypot((px-cx)/rx, (py-cy)/ry, (pz-cz)/rz) - 1) * Math.min(rx, ry, rz);
      d = smoothMin(d, e, .16);
    }
    mc.field[x + y*n + z*n*n] = -d;
  }
  mc.update();
  const geometry = new BufferGeometry();
  for (const key of ['position', 'normal']) {
    const attr = mc.geometry.getAttribute(key);
    geometry.setAttribute(key, new Float32BufferAttribute(attr.array.slice(0, mc.count * 3), 3));
  }
  geometry.scale(extent, extent, extent);
  geometry.normalizeNormals();
  const p=geometry.getAttribute('position'),uv:number[]=[];
  for(let i=0;i<p.count;i++) uv.push(p.getX(i)*.24+.5,p.getY(i)*.24+.5);
  geometry.setAttribute('uv',new Float32BufferAttribute(uv,2));
  mc.geometry.dispose(); material.dispose();
  return geometry;
}

// A crescent swept through space with a plump oval cross section and rounded tips.
export function moonGeometry() {
  const positions: number[] = [], indices: number[] = [], uv:number[]=[];
  const rows = 140, sides = 64;
  for (let i = 0; i <= rows; i++) {
    const t = i / rows;
    const a = .29 * Math.PI + t * 1.42 * Math.PI;
    const round = Math.pow(Math.sin(Math.PI * t), .54);
    const width = .55 * round;
    for (let j = 0; j <= sides; j++) {
      const p = j / sides * Math.PI * 2;
      positions.push((1.12 + width * Math.cos(p))*Math.cos(a) + .25,
        (1.12 + width * Math.cos(p))*Math.sin(a), .55*round*Math.sin(p));
      uv.push(t,j/sides);
      if (i < rows && j < sides) {
        const k = i*(sides+1)+j;
        indices.push(k,k+sides+1,k+1,k+1,k+sides+1,k+sides+2);
      }
    }
  }
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(positions, 3));
  g.setAttribute('uv',new Float32BufferAttribute(uv,2));
  g.setIndex(indices); g.computeVertexNormals();
  return g;
}

// A soft drop, wide at its foot and narrowing organically toward its tip.
export function dropGeometry() {
  const positions: number[] = [], indices: number[] = [];
  const rows = 48, sides = 32;
  for (let i=0; i<=rows; i++) {
    const theta = i/rows*Math.PI;
    const radius = .19*Math.sin(theta)*(1-.48*Math.cos(theta));
    for(let j=0;j<=sides;j++) {
      const a=j/sides*Math.PI*2;
      positions.push(radius*Math.cos(a), .34*Math.cos(theta), radius*Math.sin(a));
      if(i<rows && j<sides) {
        const k=i*(sides+1)+j;
        indices.push(k,k+1,k+sides+1,k+1,k+sides+2,k+sides+1);
      }
    }
  }
  const g=new BufferGeometry(); g.setAttribute('position',new Float32BufferAttribute(positions,3));
  g.setIndex(indices); g.computeVertexNormals(); return g;
}

