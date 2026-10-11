import fs from 'fs'; import zlib from 'zlib';
let crcTable=null;
function crc32(buf){ if(!crcTable){ crcTable=[]; for(let n=0;n<256;n++){ let c=n; for(let k=0;k<8;k++) c = c&1? 0xEDB88320^(c>>>1): c>>>1; crcTable[n]=c>>>0; } } let c=0xFFFFFFFF; for(let i=0;i<buf.length;i++) c = crcTable[(c^buf[i])&0xFF]^(c>>>8); return (c^0xFFFFFFFF)>>>0; }
function decode(file){ const buf=fs.readFileSync(file); let pos=8,width,height,colorType; const idat=[];
  while(pos<buf.length){ const len=buf.readUInt32BE(pos); const type=buf.toString('ascii',pos+4,pos+8); const data=buf.subarray(pos+8,pos+8+len);
    if(type==='IHDR'){width=data.readUInt32BE(0);height=data.readUInt32BE(4);colorType=data[9];} if(type==='IDAT')idat.push(data); pos+=12+len; }
  const raw=zlib.inflateSync(Buffer.concat(idat)); const channels=colorType===2?3:colorType===6?4:1; const bpp=channels; const stride=width*bpp;
  const out=Buffer.alloc(height*stride); let rp=0;
  for(let y=0;y<height;y++){ const ft=raw[rp++]; const line=raw.subarray(rp,rp+stride); rp+=stride;
    const prev=y>0?out.subarray((y-1)*stride,y*stride):Buffer.alloc(stride); const cur=out.subarray(y*stride,(y+1)*stride);
    for(let x=0;x<stride;x++){ const a=x>=bpp?cur[x-bpp]:0; const b=prev[x]; const c=x>=bpp?prev[x-bpp]:0; let v=line[x];
      if(ft===1)v=(v+a)&255; else if(ft===2)v=(v+b)&255; else if(ft===3)v=(v+((a+b)>>1))&255;
      else if(ft===4){const p=a+b-c,pa=Math.abs(p-a),pb=Math.abs(p-b),pc=Math.abs(p-c);const pr=(pa<=pb&&pa<=pc)?a:(pb<=pc?b:c);v=(v+pr)&255;} cur[x]=v; } }
  return {width,height,channels,bpp,stride,data:out}; }
function encode(width,height,data,file){ const channels=3; const stride=width*channels; const raw=Buffer.alloc(height*(stride+1));
  for(let y=0;y<height;y++){ raw[y*(stride+1)]=0; data.copy(raw,y*(stride+1)+1,y*stride,(y+1)*stride); }
  const comp=zlib.deflateSync(raw); const sig=Buffer.from([137,80,78,71,13,10,26,10]);
  function chunk(type,payload){ const len=Buffer.alloc(4); len.writeUInt32BE(payload.length,0); const t=Buffer.from(type,'ascii'); const crc=Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([t,payload]))>>>0,0); return Buffer.concat([len,t,payload,crc]); }
  const ihdr=Buffer.alloc(13); ihdr.writeUInt32BE(width,0); ihdr.writeUInt32BE(height,4); ihdr[8]=8; ihdr[9]=2;
  fs.writeFileSync(file, Buffer.concat([sig,chunk('IHDR',ihdr),chunk('IDAT',comp),chunk('IEND',Buffer.alloc(0))])); }
const a=process.argv.slice(2); const cmd=a[0];
if(cmd==='crop'){ const file=a[1],x=+a[2],y=+a[3],w=+a[4],h=+a[5],out=a[6]; const img=decode(file); const buf=Buffer.alloc(w*h*3);
  for(let j=0;j<h;j++)for(let i=0;i<w;i++){const si=(y+j)*img.stride+(x+i)*img.bpp; buf[(j*w+i)*3]=img.data[si]; buf[(j*w+i)*3+1]=img.data[si+1]; buf[(j*w+i)*3+2]=img.data[si+2];}
  encode(w,h,buf,out); console.log('->',out,w,h); }
if(cmd==='colprofile'){ const file=a[1],y0=+a[2],y1=+a[3]; const img=decode(file); const runs=[]; let s=-1;
  for(let x=0;x<img.width;x++){ let nw=0; for(let y=y0;y<y1;y++){const si=y*img.stride+x*img.bpp; if(img.data[si]<245||img.data[si+1]<245||img.data[si+2]<245)nw++;} if(nw>0&&s<0)s=x; if((nw===0||x===img.width-1)&&s>=0){runs.push([s,x-1]);s=-1;} } console.log(JSON.stringify(runs)); }
