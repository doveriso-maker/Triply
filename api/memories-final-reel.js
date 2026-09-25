import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import sharp from 'sharp';
import ffmpegPath from 'ffmpeg-static';
import { createClient } from '@supabase/supabase-js';

export const config = { maxDuration: 60 };

const SUPABASE_URL='https://asnnvwoersrhrgdantll.supabase.co';
const SUPABASE_PUBLISHABLE='sb_publishable_dZFP2IUafSBsNpsnc4e4Mw_rU0FQFJh';
const FINALIZE_URL=SUPABASE_URL+'/functions/v1/triply-memories-finalize';
const supabase=createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE,{auth:{persistSession:false,autoRefreshToken:false}});

function xml(s=''){return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[m]));}
function allowedHttps(value,hosts){
  try{const u=new URL(String(value));return u.protocol==='https:'&&hosts.some(h=>u.hostname===h||u.hostname.endsWith('.'+h))?u:null}catch{return null}
}
async function fetchBuffer(url,maxBytes=12*1024*1024){
  const u=allowedHttps(url,['supabase.co','navigam.com','www.navigam.com']);
  if(!u)throw new Error('url_not_allowed');
  const r=await fetch(u,{redirect:'follow'});
  if(!r.ok)throw new Error('fetch_'+r.status);
  const len=Number(r.headers.get('content-length')||0);
  if(len&&len>maxBytes)throw new Error('file_too_large');
  const ab=await r.arrayBuffer();
  if(ab.byteLength>maxBytes)throw new Error('file_too_large');
  return Buffer.from(ab);
}
async function run(cmd,args,cwd){
  await new Promise((resolve,reject)=>{
    const child=spawn(cmd,args,{cwd,stdio:['ignore','ignore','pipe']});
    let err='';
    child.stderr.on('data',d=>{err+=d.toString().slice(-8000)});
    child.on('error',reject);
    child.on('close',code=>code===0?resolve():reject(new Error('ffmpeg_'+code+':'+err.slice(-1600))));
  });
}
async function logoAssets(){
  const raw=await fetchBuffer('https://www.navigam.com/preview/assets/header-logo.png',3*1024*1024);
  const logo=await sharp(raw).resize({width:170,withoutEnlargement:true}).png().toBuffer();
  const pill=Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="250" height="96"><rect x="0" y="0" width="250" height="96" rx="30" fill="white" fill-opacity=".9"/></svg>');
  return {logo,pill};
}
async function composeFrame(input,logo,pill,out){
  const bg=await sharp(input).rotate().resize(1080,1920,{fit:'cover',position:'centre'}).jpeg({quality:90}).toBuffer();
  const lm=await sharp(logo).metadata();
  const left=Math.round((1080-(lm.width||170))/2);
  await sharp(bg).composite([
    {input:pill,left:415,top:36},
    {input:logo,left,top:50}
  ]).jpeg({quality:90}).toFile(out);
}
async function composeOutro(logo,message,next,out){
  const bg=Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#062f45"/><stop offset="1" stop-color="#07889d"/></linearGradient></defs>
  <rect width="1080" height="1920" fill="url(#g)"/>
  <text x="540" y="1215" text-anchor="middle" fill="white" font-family="Arial,DejaVu Sans,sans-serif" font-size="62" font-weight="700" direction="rtl">${xml(message)}</text>
  <text x="540" y="1310" text-anchor="middle" fill="white" fill-opacity=".92" font-family="Arial,DejaVu Sans,sans-serif" font-size="48" font-weight="500" direction="rtl">${xml(next)}</text>
  </svg>`);
  const large=await sharp(logo).resize({width:460,withoutEnlargement:true}).png().toBuffer();
  const lm=await sharp(large).metadata();
  await sharp(bg).composite([{input:large,left:Math.round((1080-(lm.width||460))/2),top:420}]).png().toFile(out);
}
function filters(count,seg,outro,total){
  const parts=[];
  for(let i=0;i<count;i++){
    const d=i===count-1?outro:seg;
    const fadeOut=Math.max(.25,d-.3);
    parts.push(`[${i}:v]fps=30,scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:black,format=yuv420p,fade=t=in:st=0:d=.25,fade=t=out:st=${fadeOut.toFixed(2)}:d=.25,setpts=PTS-STARTPTS[v${i}]`);
  }
  parts.push(Array.from({length:count},(_,i)=>`[v${i}]`).join('')+`concat=n=${count}:v=1:a=0[vout]`);
  parts.push(`sine=frequency=196:sample_rate=44100:duration=${total.toFixed(2)}[a0];sine=frequency=246.94:sample_rate=44100:duration=${total.toFixed(2)}[a1];sine=frequency=293.66:sample_rate=44100:duration=${total.toFixed(2)}[a2];[a0][a1][a2]amix=inputs=3:normalize=0,volume=.035,afade=t=in:st=0:d=1.2,afade=t=out:st=${Math.max(0,total-1.5).toFixed(2)}:d=1.5[aout]`);
  return parts.join(';');
}

export default async function handler(req,res){
  if(req.method!=='POST')return res.status(405).json({ok:false,error:'method_not_allowed'});
  const {job_id,token}=req.body||{};
  if(typeof job_id!=='string'||typeof token!=='string'||token.length<24)return res.status(400).json({ok:false,error:'invalid_job'});
  let tmp='';
  try{
    const vr=await fetch(FINALIZE_URL+'?action=job',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({job_id,token})});
    const job=await vr.json();
    if(!vr.ok||job.ok!==true) return res.status(vr.status||401).json({ok:false,error:job.error||'job_not_authorized'});
    const images=Array.isArray(job.images)?job.images.slice(0,12):[];
    if(!images.length)throw new Error('no_images');
    tmp=await fs.mkdtemp(path.join(os.tmpdir(),'navigam-reel-'));
    const {logo,pill}=await logoAssets();
    const frames=[];
    for(let i=0;i<images.length;i++){
      const raw=await fetchBuffer(images[i].url);
      const out=path.join(tmp,`frame-${String(i).padStart(2,'0')}.jpg`);
      await composeFrame(raw,logo,pill,out);frames.push(out);
    }
    const outro=path.join(tmp,'outro.png');
    await composeOutro(logo,job.outro_message||'שמחנו להיות חלק מהטיול שלכם ❤️',job.outro_next||'ניפגש בטיול הבא.',outro);
    const contentDuration=Math.min(27,Math.max(7,images.length*2));
    const seg=contentDuration/images.length;
    const outroDuration=3;
    const total=contentDuration+outroDuration;
    const output=path.join(tmp,'final-reel.mp4');
    const args=[];
    for(const f of frames){args.push('-loop','1','-t',seg.toFixed(3),'-i',f);}
    args.push('-loop','1','-t',outroDuration.toFixed(3),'-i',outro);
    const count=frames.length+1;
    args.push('-filter_complex',filters(count,seg,outroDuration,total),'-map','[vout]','-map','[aout]','-c:v','libx264','-preset','veryfast','-crf','23','-pix_fmt','yuv420p','-c:a','aac','-b:a','96k','-shortest','-movflags','+faststart','-y',output);
    if(!ffmpegPath)throw new Error('ffmpeg_missing');
    await run(ffmpegPath,args,tmp);
    const video=await fs.readFile(output);
    if(video.length>35*1024*1024)throw new Error('render_too_large');
    const upload=await supabase.storage.from(job.bucket).uploadToSignedUrl(job.upload_path,job.upload_token,new Blob([video],{type:'video/mp4'}),{contentType:'video/mp4'});
    if(upload.error)throw upload.error;
    const cr=await fetch(FINALIZE_URL+'?action=complete',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({job_id,token,duration_seconds:total,photo_count:images.length,size_bytes:video.length,mime_type:'video/mp4'})});
    const complete=await cr.json();
    if(!cr.ok||complete.ok!==true)throw new Error(complete.error||'complete_failed');
    return res.status(200).json({ok:true,job_id,duration_seconds:total,photo_count:images.length});
  }catch(e){
    try{await fetch(FINALIZE_URL+'?action=fail',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({job_id,token,error:String(e).slice(0,400)})});}catch{}
    return res.status(500).json({ok:false,error:'render_failed'});
  }finally{
    if(tmp)try{await fs.rm(tmp,{recursive:true,force:true})}catch{}
  }
}
