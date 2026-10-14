// Circle against oriented rectangles, with substeps and sliding along obstacles.
// These same colliders are used by desktop and multitouch movement.
export function resolvePosition(x,z,colliders,radius=.22){
  for(let pass=0;pass<4;pass++){
    let touched=false;
    for(const b of colliders){
      const c=Math.cos(b.angle),s=Math.sin(b.angle),dx=x-b.x,dz=z-b.z;
      let lx=c*dx-s*dz,lz=s*dx+c*dz;
      const hx=b.w/2,hz=b.d/2;
      const qx=Math.max(-hx,Math.min(hx,lx)),qz=Math.max(-hz,Math.min(hz,lz));
      let nx=lx-qx,nz=lz-qz,dist=Math.hypot(nx,nz);
      if(dist>=radius)continue;
      if(dist<1e-8){
        const edgeX=hx-Math.abs(lx),edgeZ=hz-Math.abs(lz);
        if(edgeX<edgeZ){nx=lx<0?-1:1;nz=0;dist=-edgeX;}else{nx=0;nz=lz<0?-1:1;dist=-edgeZ;}
      }else{nx/=dist;nz/=dist;}
      const push=radius-dist+.0001;lx+=nx*push;lz+=nz*push;
      x=b.x+c*lx+s*lz;z=b.z-s*lx+c*lz;touched=true;
    }
    if(!touched)break;
  }
  return {x,z};
}
export function movePlayer(player,dx,dz,colliders){
  const n=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.08));
  for(let i=0;i<n;i++)Object.assign(player,resolvePosition(player.x+dx/n,player.z+dz/n,colliders));
  return player;
}
