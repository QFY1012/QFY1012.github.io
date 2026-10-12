import fs from 'fs';
import zlib from 'zlib';
function decode(file){
  const buf=fs.readFileSync(file);
  let p=8, w=0,h=0,bd=0,ct=0, idat=[];
  while(p<buf.length){
    const len=buf.readUInt32BE(p); const type=buf.toString('ascii',p+4,p+8);
    const data=buf.subarray(p+8,p+8+len);
    if(type==='IHDR'){w=data.readUInt32BE(0);h=data.readUInt32BE(4);bd=data[8];ct=data[9];}
    else if(type==='IDAT') idat.push(data);
    else if(type==='IEND') break;
    p+=12+len;
  }
  const raw=zlib.inflateSync(Buffer.concat(idat));
  const ch = ct===6?4:ct===2?3:ct===0?1:4;
  const stride=w*ch;
  const out=Buffer.alloc(w*h*ch);
  let pos=0;
  for(let y=0;y<h;y++){
    const ft=raw[pos++]; const line=raw.subarray(pos,pos+stride); pos+=stride;
    const cur=out.subarray(y*stride,(y+1)*stride);
    const prev=y>0?out.subarray((y-1)*stride,y*stride):Buffer.alloc(stride);
    for(let i=0;i<stride;i++){
      const a=i>=ch?cur[i-ch]:0, b=prev[i], c=i>=ch?prev[i-ch]:0; let v=line[i];
      if(ft===1)v+=a; else if(ft===2)v+=b; else if(ft===3)v+=(a+b)>>1;
      else if(ft===4){const pa=Math.abs(b-c),pb=Math.abs(a-c),pc=Math.abs(a+b-2*c);v+= (pa<=pb&&pa<=pc)?a:(pb<=pc?b:c);}
      cur[i]=v&255;
    }
  }
  return {w,h,ch,data:out};
}
const img=decode(process.argv[2]);
const y0=+process.argv[3], y1=+process.argv[4];
// find bounding boxes of non-white content, print per-row ink counts summary
let rows=[];
for(let y=y0;y<Math.min(y1,img.h);y++){
  let count=0, minx=1e9, maxx=-1;
  for(let x=0;x<img.w;x++){
    const i=(y*img.w+x)*img.ch;
    const r=img.data[i],g=img.data[i+1],b=img.data[i+2];
    if(r<245||g<245||b<245){count++; if(x<minx)minx=x; if(x>maxx)maxx=x;}
  }
  rows.push({y,count,minx,maxx});
}
// print compressed: ranges where count>0
let start=null;
for(const r of rows){
  if(r.count>0 && start===null) start=r;
  if((r.count===0||r.y===rows[rows.length-1].y) && start!==null){
    console.log(`ink band y ${start.y}..${r.count>0?r.y:r.y-1}  x ${Math.min(...rows.filter(q=>q.y>=start.y&&q.y<=r.y&&q.count>0).map(q=>q.minx))}..${Math.max(...rows.filter(q=>q.y>=start.y&&q.y<=r.y&&q.count>0).map(q=>q.maxx))}`);
    start=null;
  }
}
