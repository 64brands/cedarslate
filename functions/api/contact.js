const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{"content-type":"application/json; charset=utf-8","cache-control":"no-store"}});
const clean=(value,max)=>String(value||"").trim().slice(0,max);
const escapeHtml=value=>value.replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[char]));

export async function onRequestPost({request,env}){
  try{
    const type=request.headers.get("content-type")||"";
    if(!type.includes("application/json"))return json({error:"Invalid request."},415);
    const body=await request.json();
    if(body.company)return json({ok:true});
    const name=clean(body.name,80),email=clean(body.email,160),message=clean(body.message,3000),token=clean(body.token,2048);
    if(name.length<2||message.length<10||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||!token)return json({error:"Please complete every field."},400);
    const verifyBody=new URLSearchParams({secret:env.TURNSTILE_SECRET_KEY,response:token,remoteip:request.headers.get("CF-Connecting-IP")||""});
    const verify=await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify",{method:"POST",body:verifyBody});
    const result=await verify.json();
    if(!result.success)return json({error:"Verification failed. Please try again."},403);
    const safeName=escapeHtml(name),safeEmail=escapeHtml(email),safeMessage=escapeHtml(message).replace(/\n/g,"<br>");
    const sent=await fetch("https://api.resend.com/emails",{method:"POST",headers:{Authorization:`Bearer `+env.RESEND_API_KEY,"Content-Type":"application/json"},body:JSON.stringify({from:"Cedar+Slate Website <website@cedarslate.com.au>",to:["hello@cedarslate.com.au"],reply_to:email,subject:`Website enquiry from `+name,text:`Name: `+name+`\nEmail: `+email+`\n\n`+message,html:`<p><strong>Name:</strong> `+safeName+`</p><p><strong>Email:</strong> `+safeEmail+`</p><p>`+safeMessage+`</p>`})});
    if(!sent.ok){console.error("Resend delivery failed",sent.status);return json({error:"Unable to send right now. Please try again shortly."},502)}
    return json({ok:true});
  }catch(error){console.error("Contact form error",error);return json({error:"Unable to send right now. Please try again shortly."},500)}
}

export function onRequest(){return json({error:"Method not allowed."},405)};
