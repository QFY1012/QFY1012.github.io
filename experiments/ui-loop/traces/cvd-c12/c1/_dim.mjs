import fs from 'fs';
for(const f of fs.readdirSync('assets')){
  const buf=fs.readFileSync('assets/'+f);
  console.log(f, buf.readUInt32BE(16), buf.readUInt32BE(20));
}
