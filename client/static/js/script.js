var regx={"ax":0,"bx":0,"cx":0,"dx":0,
      "ah":0,"al":0,"bh":0,"bl":0,
      "ch":0,"cl":0,"dh":0,"dl":0,
      "si":0,"di":0,"sp":0x200,"bp":0,"ip":0x700,
      "ss":0x3000,"ds":0x2000,"cs":0x90,"es":0};
var flb={"cf":0,"pf":0,"af":0,"zf":0,"sf":0,"of":0,"if":0,
      "df":0,"tf":0};
var mer={};


var Sfld='0';
var Vfld='0';
var prog={};
var mkode={};
var optable="";
var xl='x';
var count=0;

function zfill(val,places)
{
  var s=val+'';
  while(s.length<places)
    s='0'+s;
  return s;
}

function regadj()//hakis
{
  for(var i in regx)
  {
    var bits=evbits(regx[i]);
    if(bits==16)
    {
      if(regx[i]>65535)
        regx[i]=65535;
    }
    else if(bits==8)
    {
      if(regx[i]>255)
        regx[i]=255;
    }
  }
  
  for(var i in mer)
  {
    if(mer[i]>255)
      mer[i]=255;
  }
  if(xl=='x')
  {
    var a=regx["ax"].toString(16);
    var b=regx["bx"].toString(16);
    var c=regx["cx"].toString(16);
    var d=regx["dx"].toString(16);
    regx["al"]=parseInt(a.slice(-2),16);
    if(a.length-2>0)
      regx["ah"]=parseInt(a.slice(0,(a.length-2)),16);
    regx["bl"]=parseInt(b.slice(-2),16);
    if(b.length-2>0)
      regx["bh"]=parseInt(b.slice(0,(a.length-2)),16);
    regx["cl"]=parseInt(c.slice(-2),16);
    if(c.length-2>0)
      regx["ch"]=parseInt(c.slice(0,(a.length-2)),16);
    regx["dl"]=parseInt(d.slice(-2),16);
    if(d.length-2>0)
      regx["dh"]=parseInt(d.slice(0,(a.length-2)),16);
  }
  else if(xl=='l')
  {
    regx["ax"]=regx["ah"]*256+regx["al"];
    regx["bx"]=regx["bh"]*256+regx["bl"];
    regx["cx"]=regx["ch"]*256+regx["cl"];
    regx["dx"]=regx["dh"]*256+regx["dl"];
  }
}

function sign(result,bits)
{
  var reslt=zfill(result.toString(2),bits);
  if(reslt[0]=='1')
    flb["sf"]=1;
  else
    flb["sf"]=0;
}

function parity(result)
{
  var l=result.toString(2).replace("0","");
  if(l.length/2==parseInt(l.length/2))
    flb["pf"]=1;
  else
    flb["pf"]=0;
}

function aux(initval1,initval2,result)
{
  if((((initval1&15)+(initval2&15))&16)==1)
    flb["af"]=1;
  else
    flb["af"]=0;
}

function zero(result)
{
  if(result==0)
    flb["zf"]=1;
  else
    flb["zf"]=0;
}

function carry(result,bits)
{
  if(bits==8 && result>255)
    flb["cf"]=1;
  else if(bits==16 && result>65535)
    flb["cf"]=1;
  else
    flb["cf"]=0;
}

function oflow(initval1,initval2,result,bits)
{
  if(initval1<32768 && initval2<32768 &&result>32767&& bits==16)
    flb["of"]=1;
  else if(initval1<128 && initval2<128 && result>127&& bits==8)
    flb["of"]=1;
  else
    flb["of"]=0
}



function frmt(ens)
{
  ens=ens.replace("," , " ");
  var te=ens.split(" ");
  if(te[1]==undefined)
    te[1]='';
  if(te[2]==undefined)
    te[2]='';
  return te;
}

function iter(star,endi)
{
  var pre=['','',''];
  for(var it in prog)
  {
    if(it>=star && it<=endi)
      simulate(prog[it],it,pre);
    if(prog[it][0]=='hlt')
      break;
    pre=prog[it];
  }
}

function simulate(ens,addrs,pre)
{
  count++;
  var dstr=regx[ens[1]];
  var srcr=regx[ens[2]];
  var srci=chkimm(ens[2]);
  var srcmre=ens[2].match(/^\[.*\]$/);
  var dstmre='';
  if(typeof(ens[1])=="number")//temporary sched remv
    ens[1]=ens[1].toString();
  var dstmre=ens[1].match(/^\[.*\]$/);
  var mmri=0;
  mmri=calcmeme(ens[1]);
  if(mmri==false)
    mmri=calcmeme(ens[2]);
    
  var crri=0x00;
  if(ens[0]=='adc')
  {
    ens[0]='add';
    crri=flb["cf"];
  }
  
  var brrw=0x00;
  if(ens[0]=='sbb')
  {
    ens[0]='sub';
    brrw=flb["cf"];
  }
  
  if(ens[1].indexOf('l')>=0 || ens[1].indexOf('h')>=0)
    xl='l';
  else
    xl='x';

  if(ens[0]=='shl'||ens[0]=='sal'||ens[0]=='shr'||ens[0]=='sar'||ens[0]=='rcr'||ens[0]=='rcl'||ens[0]=='ror'||ens[0]=='rol')
  { 
    if(ens[2]=='cl')
      Vfld=1;
    else
      Vfld=0;
    ens[2]='';
  }
  //processor controle enstrukt
  if(ens[1]=='' && ens[2]=='')
  {
    
    if(ens[0]=='aaa')
    {
      var a=parseInt(regx['al'].toString(16)[1],16);
      if(a>9 || flb['af']==1)
      {
        regx['al']+=6;
        regx['ah']+=1;
        flb['af']=1;
        flb['cf']=1;
        regx['ax']=16*regx['ah']+regx['al'];
      }
      else
      {
        flb['af']=0;
        flb['cf']=0;
      }
    }
    
    if(ens[0]=='daa')
    {
      var a=parseInt(regx['al'].toString(16)[1],16);
      if(a>9 || flb['af']==1)
      {
        regx['ax']+=6;
        flb['af']=1;
      }
      if(regx['al']>0x9f || flb['cf']==1)
      {
        regx['al']+=0x60;
        flb['cf']=1;
      }
    }
    
    if(ens[0]=='aas')
    {
      var a=parseInt(regx['al'].toString(16)[1],16);
      if(a>9 || flb['af']==1)
      {
        regx['al']-=6;
        regx['ah']-=1;
        flb['af']=1;
        flb['cf']=1;
      }
      else
      {
        flb['af']=0;
        flb['cf']=0;
      }
    }
    
    if(ens[0]=='das')
    {
      var a=parseInt(regx['al'].toString(16)[1],16);
      if(a>9 || flb['af']==1)
      {
        regx['al']-=6;
        flb['af']=1;
      }
      if(regx['al']>0x9f || flb['cf']==1)
      {
        regx['al']-=0x60;
        flb['cf']=1;
      }
    }
    
    if(ens[0]=='aam')
    {
      regx['ah']=parseInt(regx['al']/10);
    }
    
    if(ens[0]=='aad')
    {
      regx['al']=regx['ah']*10+regx['al'];
      regx['ah']=0;
    }
    
    if(ens[0]=='pushf')
    {
      var a=regx['ax'];
      a=zfill(a.toString(2),16);
      flb['cf']=a[15];
      flb['pf']=a[13];
      flb['zf']=a[9];
      flb['af']=a[11];
      flb['sf']=a[8];
      flb['if']=a[6];
      flb['df']=a[5];
      flb['tf']=a[7];
      flb['of']=a[4];
    }
    
    if(ens[0]=='popf')
    {
      var a='';
      a=zfill(a,16);
      a[15]=flb['cf'];
      a[13]=flb['pf'];
      a[9]=flb['zf'];
      a[11]=flb['af'];
      a[8]=flb['sf'];
      a[6]=flb['if'];
      a[5]=flb['df'];
      a[7]=flb['tf'];
      a[4]=flb['of'];
      regx['ax']=parseInt(a,2);
    }
    
    if(ens[0]=='clc')
      flb["cf"]=0;
    if(ens[0]=='cmc')
      flb["cf"]=1-flb["cf"];
    if(ens[0]=='stc')
      flb["cf"]=1;
    if(ens[0]=='cld')
      flb["df"]=0;
    if(ens[0]=='std')
      flb["df"]=1;
    if(ens[0]=='cli')
      flb["if"]=0;
    if(ens[0]=='sti')
      flb["if"]=1;
    if(ens[0]=='hlt')
      return "";
  }
  else if(ens[2]=='' && ens[1]!='')
  {
    if(dstmre!=null) //memory enstrukt
    {
      
      if(ens[0]=='div')
      {
        var t=memdiv(mmri,'',16);
        var q=0;
        var r=0;
        r=(regx['dx']*65536+regx['ax']);
        q=parseInt(r/t);
        r=r%t;
        regx['ax']=q;
        regx['dx']=r;
      }
      
      if(ens[0]=='idiv')
      {
        var t=memdiv(mmri,'',16);
        var q=0;
        var r=0;
        r=(regx['dx']*65536+regx['ax']);
        if(r>2147483647)
          r=4294967296-r;
        if(t>32767)
          t=65536-t;
        q=adjst(parseInt(r/t),16);
        r=Math.abs(r%t);
        regx['ax']=q;
        regx['dx']=r;
      }
      
      if(ens[0]=='mul')
      {
        var t=memdiv(mmri,'',16);
        var r=regx['ax'];
        r=t*r;
        if(r>65535)
        {
          r=zfill(r.toString(16),8);
          regx['ax']=parseInt(r.slice(-4),16);
          regx['dx']=parseInt(r.substr(0,4),16);
        }
        else
          regx['ax']=r;
      }
      
      if(ens[0]=='imul')
      {
        var bits=evbits(ens[1]);
        var t=regx[ens[1]];
        var r=memdiv(mmri,'',16);
        r=regx['ax'];
        if(t>32767)
          t=-(65536-t);
        if(r>32767)
          r=-(65536-r);
        r=r*t;
        r=adjst(r,32);
        r=zfill(r.toString(16),8);
        regx['ax']=parseInt(r.slice(-4),16);
        regx['dx']=parseInt(r.substr(0,4),16);
      }
      
      if(ens[0]=='push')
      {
        regx['sp']-=2;
        var val=memdiv(mmri[0],"",16);
        var pos=regx['ss']*16+regx['sp'];
        memdiv(pos,val,16);
      }
      if(ens[0]=='pop')
      {
        var pos=regx['ss']*16+regx['sp'];
        var val=memdiv(pos,"",16);
        regx[ens[1]]=val;
        regx['sp']+=2;
      }
      
      if(ens[0]=='inc' || ens[0]=='dec')
      {
        var initval=memdiv(mmri[0],"",16);
        var res=0;
        if(ens[0]=='inc')
          res=initval+1;
        else if(ens[0]=='dec')
          res=initval-1;
        memdiv(mmri[0],res,16);
        zero(res);
        sign(res,16);
        parity(res);
        aux(initval,1,res);
      }
      
      if(ens[0]=='not')
      {
        var res=memdiv(mmri[0],"",16) ^(memdiv(mmri[0],"",16) | 65535);
        memdiv(mmri[0],res,16);
      }
      if(ens[0]=='shl'||ens[0]=='sal'||ens[0]=='shr'||ens[0]=='sar'||ens[0]=='rcr'||ens[0]=='rcl'||ens[0]=='ror'||ens[0]=='rol')
      {
        if(Vfld==0)
          t=1;
        else if(Vfld==1)
          t=regx['cl'];
        var bits=16;
        var res=memdiv(mmri[0],"",bits);
        for(var i=1; i<=t; i++)
        {
          if(ens[0]=='shl' || ens[0]=='sal')
            res=shl(res,bits);
          else if(ens[0]=='shr')
            res=shr(res,bits);
          else if(ens[0]=='sar')
            res=sar(res,bits);
          else if(ens[0]=='rcl')
            res=rcl(res,bits);
          else if(ens[0]=='rcr')
            res=rcr(res,bits);
          else if(ens[0]=='rol')
            res=rol(res,bits);
          else if(ens[0]=='ror')
            res=ror(res,bits);
        }
        memdiv(mmri[0],res,16);
      }
    }
    
    else if(dstr!=undefined) //register enstrukt
    {
      if(ens[0]=='div')
      {
        var bits=evbits(ens[1]);
        var t=regx[ens[1]];
        var q=0;
        var r=0;
        if(bits==8)
        {
          regx['al']=parseInt(regx['ax']/t);
          regx['ah']=regx['ax']%t;
        }
        if(bits==16)
        {
          r=(regx['dx']*65536+regx['ax']);
          q=parseInt(r/t);
          r=r%t;
          regx['ax']=q;
          regx['dx']=r;
        }
      }
      
      if(ens[0]=='idiv')
      {
        var bits=evbits(ens[1]);
        var t=regx[ens[1]];
        var q=0;
        var r=0;
        if(bits==8)
        {
          r=regx['ax'];
          if(regx['ax']>32767)
            r=-(65536-regx['ax']);
          if(t>127)
            t=-(256-t);
          regx['al']=adjst(parseInt(r/t),8);
          regx['ah']=Math.abs(regx['ax']%t);
        }
        if(bits==16)
        {
          r=(regx['dx']*65536+regx['ax']);
          if(r>2147483647)
            r=4294967296-r;
          if(t>32767)
            t=65536-t;
          q=adjst(parseInt(r/t),16);
          r=Math.abs(r%t);
          regx['ax']=q;
          regx['dx']=r;
        }
      }
      
      if(ens[0]=='mul')
      {
        var bits=evbits(ens[1]);
        var t=regx[ens[1]];
        var r='';
        if(bits==8)
        {
          r=t*regx['al'];
          regx['ax']=r;
          r=zfill(r.toString(16),4);
          regx['al']=parseInt(r.slice(-2),16);
          regx['ah']=parseInt(r.substr(0,2),16);
        }
        if(bits==16)
        {
          r=t*regx['ax'];
          r=zfill(r.toString(16),8);
          regx['ax']=parseInt(r.slice(-4),16);
          regx['dx']=parseInt(r.substr(0,4),16);
        }
      }
      
      if(ens[0]=='imul')
      {
        var bits=evbits(ens[1]);
        var t=regx[ens[1]];
        var r='';
        if(bits==8)
        {
          r=regx['al'];
          if(t>127)
            t=-(256-t);
          if(r>127)
            r=-(256-r);
          r=r*t;
          regx['ax']=r;
        }
        if(bits==16)
        {
          r=regx['ax'];
          if(t>32767)
            t=-(65536-t);
          if(r>32767)
            r=-(65536-r);
          r=r*t;
          r=adjst(r,32);
          r=zfill(r.toString(16),8);
          regx['ax']=parseInt(r.slice(-4),16);
          regx['dx']=parseInt(r.substr(0,4),16);
        }
      }
      
      if(ens[0]=='push')
      {
        regx['sp']-=2;
        var bits=evbits(ens[1]);
        var val=regx[ens[1]];
        var pos=16*regx['ss']+regx['sp'];
        memdiv(pos,val,bits);
      }
      
      if(ens[0]=='pop')
      {
        var bits=evbits(ens[1]);
        var pos=16*regx['ss']+regx['sp'];
        regx[ens[1]]=memdiv(pos,"",bits);
        regx['sp']+=2;
      }
      
      if(ens[0]=='inc' || ens[0]=='dec')
      {
        var initval=regx[ens[1]];
        var bits=evbits(ens[1]);
        var res=0;
        if(ens[0]=='inc')
          res=initval+1;
        else if(ens[0]=='dec')
        {
          res=regx[ens[1]]-1;
          res=adjst(res,bits);
        }
        regx[ens[1]]=res;
        zero(res);
        sign(res,bits);
        parity(res);
        aux(initval,1,res);
        oflow(initval,0,res,bits);
      }
      
      
      if(ens[0]=='not')
      {
        var res=0;
        var bits=evbits(ens[1]);
        if(bits==8)
          res=regx[ens[1]]^(regx[ens[1]]|255);
        else
          res=regx[ens[1]]^(regx[ens[1]]|65535);
        regx[ens[1]]=res;
      }
      
      if(ens[0]=='shl'||ens[0]=='sal'||ens[0]=='shr'||ens[0]=='sar'||ens[0]=='rcr'||ens[0]=='rcl'||ens[0]=='ror'||ens[0]=='rol')
      { 
        if(Vfld==0)
          t=1;
        else if(Vfld==1)
          t=regx['cl'];
        var bits=evbits(ens[1]);
        var res=regx[ens[1]];
        for(var i=1; i<=t; i++)
        {
          if(ens[0]=='shl' || ens[0]=='sal')
            res=shl(res,bits);
          else if(ens[0]=='shr')
            res=shr(res,bits);
          else if(ens[0]=='sar')
            res=sar(res,bits);
          else if(ens[0]=='rcl')
            res=rcl(res,bits);
          else if(ens[0]=='rcr')
            res=rcr(res,bits);
          else if(ens[0]=='rol')
            res=rol(res,bits);
          else if(ens[0]=='ror')
            res=ror(res,bits);
        }
        regx[ens[1]]=res;
      }
      
    }
    if(ens[0]=='jnz' || ens[0]=='jne')
    {
      if(flb['zf']==0)
        iter(parseInt(ens[1]),addrs);
    }
    if(ens[0]=='jmp')
      iter(parseInt(ens[1]),addrs);
    if(ens[0]=='jl'||ens[0]=='jnge')
    {
      if((flb['sf']^flb['of'])==1)
        iter(parseInt(ens[1]),addrs);
    }
    if(ens[0]=='jle'||ens[0]=='jng')
    {
      if(((flb['sf']^flb['of'])|flb['zf'])==1)
        iter(parseInt(ens[1]),addrs);
    }
    if(ens[0]=='jb'||ens[0]=='jnae')
    {
      if(flb['cf']==1)
        iter(parseInt(ens[1]),addrs);
    }
    if(ens[0]=='jbe'||ens[0]=='jna')
    {
      if(flb['cf']==1 || flb['zf']==1)
        iter(parseInt(ens[1]),addrs);
    }
    if(ens[0]=='jp'||ens[0]=='jpe')
    {
      if(flb['pf']==1)
        iter(parseInt(ens[1]),addrs);
    }
    if(ens[0]=='jo')
    {
      if(flb['of']==1)
        iter(parseInt(ens[1]),addrs);
    }
    if(ens[0]=='js')
    {
      if(flb['sf']==1)
        iter(parseInt(ens[1]),addrs);
    }
    if(ens[0]=='je' ||ens[0]=='jz')
    {
      if(flb['zf']==1)
        iter(parseInt(ens[1]),addrs);
    }
    if(ens[0]=='jnl'||ens[0]=='jge')
    {
      if(flb['sf']==flb['of'])
        iter(parseInt(ens[1]),addrs);
    }
    if(ens[0]=='jnle'||ens[0]=='jg')
    {
      if(flb['sf']==flb['of'] || flb['zf']==0)
        iter(parseInt(ens[1]),addrs);
    }
    if(ens[0]=='jnbe'||ens[0]=='ja')
    {
      if(flb['cf']==0 && flb['zf']==0)
        iter(parseInt(ens[1]),addrs);
    }
    if(ens[0]=='jnb'||ens[0]=='jae')
    {
      if(flb['cf']==0)
        iter(parseInt(ens[1]),addrs);
    }
    if(ens[0]=='jnp' || ens[0]=='jpo')
    {
      if(flb['pf']==0)
        iter(parseInt(ens[1]),addrs);
    }
    if(ens[0]=='jno')
    {
      if(flb['of']==0)
        iter(parseInt(ens[1]),addrs);
    }
    if(ens[0]=='jns')
    {
      if(flb['sf']==0)
        iter(parseInt(ens[1]),addrs);
    }
    if(ens[0]=='loop')
    {
      if(regx['cx']!=0)
      {
        iter(parseInt(ens[1]),addrs);
        regx['cx']-=1;
      }
    }
    if(ens[0]=='loopz'||ens[0]=='loope')
    {
      if(regx['cx']!=0 && flb['zf']==1)
      {
        iter(parseInt(ens[1]),addrs);
        regx['cx']-=1;
      }
    }
    if(ens[0]=='loopnz'||ens[0]=='loopne')
    {
      if(regx['cx']!=0 && flb['zf']==0)
      {
        iter(parseInt(ens[1]),addrs);
        regx['cx']-=1;
      }
    }
    if(ens[0]=='jcxz')
    {
      if(regx['cx']==0)
        iter(parseInt(ens[1]))
    }
  }
  else if(ens[2]!='' && ens[1]!='')
  {
    if(dstr!=undefined && srcr!=undefined)//register to register enstrukt
    {
      
      if(ens[0]=='xchg')
      {
        var t=regx[ens[1]];
        regx[ens[1]]=regx[ens[2]];
        regx[ens[2]]=t;
      }
    
      if(ens[0]=='mov')
        regx[ens[1]]=regx[ens[2]];
          
      if(ens[0]=='add')
      {
        var initval1=regx[ens[1]];
        var initval2=regx[ens[2]];
        var res=initval1+initval2+crri;
        regx[ens[1]]=res;
        var bits=evbits(ens[1]);
        setflg(initval1,initval2,res,bits);
      }  
      if(ens[0]=='sub' || ens[0]=='cmp')
      {
        var initval1=regx[ens[1]];
        var initval2=regx[ens[2]];
        var res=initval1-initval2-brrw;
        var bits=evbits(ens[1]);
        res=adjst(res,bits);
        if(ens[0]=='sub')
          regx[ens[1]]=res;
        setflg(initval1,initval2,res,bits);
      }
      if(ens[0]=='and' || ens[0]=='test')
      {
        var res=regx[ens[1]] & regx[ens[2]];
        var bits=evbits(ens[1]);
        zero(res);
        sign(res,bits);
        parity(res);
        if(ens[0]=='and')
          regx[ens[1]]=res;
      }
      if(ens[0]=='or' || ens[0]=='xor')
      {
        var res=0;
        if(ens[0]=='or')
          res=regx[ens[1]] | regx[ens[2]];
        else if(ens[0]=='xor')
          res=regx[ens[1]] ^ regx[ens[2]];
        var bits=evbits(ens[1]);
        zero(res);
        sign(res,bits);
        parity(res);
        regx[ens[1]]=res;
      }
    }
    
    else if(dstmre!=null && srcr!=undefined)//register to memory enstrukt
    {
      if(ens[0]=='xchg')
      {
        var bits=evbits(regx[ens[2]]);
        var t=memdiv(mmri[0],'',bits);
        memdiv(mmri[0],regx[ens[2]],bits);
        regx[ens[2]]=t;
      }
      
      if(ens[0]=='mov')
        memdiv(mmri[0],regx[ens[2]],16);
      
      if(ens[0]=='add')
      {
        var bits=evbits(ens[2]);
        var initval1=memdiv(mmri[0],'',bits);
        var initval2=regx[ens[2]];
        var res=initval1+initval2+crri;
        memdiv(mmri[0],res,bits);
        setflg(initval1,initval2,res,bits);
      }
      
      if(ens[0]=='sub' || ens[0]=='cmp')
      {
        var bits=evbits(ens[2]);
        var initval1=memdiv(mmri[0],'',bits);
        var initval2=regx[ens[2]];
        var res=initval1-initval2-brrw;
        res=adjst(res,bits);
        if(ens[0]=='sub')
          memdiv(mmri[0],res,bits);
        setflg(initval1,initval2,res,bits);
      }
      
      if(ens[0]=='and' || ens[0]=='test')
      {
        var bits=evbits(ens[2]);
        var res=memdiv(mmri[0],'',bits) & regx[ens[2]];
        zero(res);
        sign(res,bits);
        parity(res);
        if(ens[0]=='and')
          memdiv(mmri[0],res,bits);
      }
      
      if(ens[0]=='or' || ens[0]=='xor')
      {
        var bits=evbits(ens[2]);
        var res=0;
        if(ens[0]=='or')
          res=memdiv(mmri[0],'',bits) | regx[ens[2]];
        else if(ens[0]=='xor')
          res=memdiv(mmri[0],'',bits) ^ regx[ens[2]];
        zero(res);
        sign(res,bits);
        parity(res);
        memdiv(mmri[0],res,bits);
      }
    }
    
    else if(dstr!=undefined && srcmre!=null)//memory to register enstrukt
    {
      if(ens[0]=='xchg')
      {
        var bits=evbits(ens[1]);
        var t=regx[ens[1]];
        regx[ens[1]]=memdiv(mmri[0],'',bits);
        memdiv(mmri[0],t,bits);
      }
      if(ens[0]=='mov')
      {
        bits=evbits(ens[1]);
        if(bits==16)
          regx[ens[1]]=memdiv(mmri[0],'',bits);
        else if(mer[mmri[0]] != undefined)
          regx[ens[1]]=mer[mmri[0]];
      }
      
      if(ens[0]=='add')
      {
        var bits=evbits(ens[1]);
        var initval1=regx[ens[1]];
        var initval2=memdiv(mmri[0],"",bits);
        var res=initval1+initval2+crri;
        memdiv(mmri[0],res,bits);
        setflg(initval1,initval2,res,bits);
      }
      
      if(ens[0]=='sub' || ens[0]=='cmp')
      {
        var bits=evbits(ens[1]);
        var initval1=regx[ens[1]];
        var initval2=memdiv(mmri[0],"",bits);
        var res=initval1-initval2-brrw;
        res=adjst(res,bits);
        if(ens[0]=='sub')
          regx[ens[1]]=res;
        setflg(initval1,initval2,res,bits);
      }
      
      if(ens[0]=='and' || ens[0]=='test')
      {
        var bits=evbits(ens[1]);
        var res=regx[ens[1]] & memdiv(mmri[0],"",bits);
        zero(res);
        sign(res,bits);
        parity(res);
        if(ens[0]=='and')
          regx[ens[1]]=res;
      }
      
      if(ens[0]=='or' || ens[0]=='xor')
      {
        var bits=evbits(ens[1]);
        var res=0;
        if(ens[0]=='or')
          res=regx[ens[1]] | memdiv(mmri[0],"",bits);
        else if(ens[0]=='xor')
          res=regx[ens[1]] ^ memdiv(mmri[0],"",bits);
        zero(res);
        sign(res,bits);
        parity(res);
        regx[ens[1]]=res;
      }
    }
    
    else if(dstr!=undefined && srci!=false) //immediate to regster enstrukt
    {
      if(ens[0]=='mov')
        regx[ens[1]]=srci[2];
      
      if(ens[0]=='add')
      {
        var initval=regx[ens[1]];
        var res=initval+srci[2]+crri;
        var bits=evbits(ens[1]);
        if(srci[1]=='' && bits==16)
          Sfld=1;
        else
          Sfld=0;
        regx[ens[1]]=res;
        setflg(initval,srci[2],res,bits);    
      }
      
      if(ens[0]=='sub' || ens[0]=='cmp')
      {
        var initval=regx[ens[1]];
        var res=initval-srci[2]-brrw;
        var bits=evbits(ens[1]);
        res=adjst(res,bits);
        if(srci[1]=='' && bits==16)
          Sfld=1;
        else
          Sfld=0;
        if(ens[0]=='sub')
          regx[ens[1]]=res;
        setflg(initval,srci[2],res,bits);
      }
      
      if(ens[0]=='and' || ens[0]=='test')
      {
        res=regx[ens[1]] & srci[2];
        var bits=evbits(regx[ens[1]]);
        parity(res);
        zero(res);
        sign(res,bits);
        if(ens[0]=='and')
          regx[ens[1]]=res;
      }
      
      if(ens[0]=='or' || ens[0]=='xor')
      {
        var res=0;
        if(ens[0]=='or')
          res=regx[ens[1]] | srci[2];
        else if(ens[0]=='xor')
          res=regx[ens[1]] ^ srci[2]
        var bits=evbits(ens[1]);
        zero(res);
        sign(res,bits);
        parity(res);
        regx[ens[1]]=res;
      }
    }
    
    else if(dstmre!=null && srci!=false)//immediate to memri
    {
      if(ens[0]=='mov')
        memdiv(mmri[0],srci[2],16);
      
      if(ens[0]=='add')
      {
        var initval=memdiv(mmri[0],"",16);
        var res=initval+srci[2]+crri;
        var bits=16;
        if(srci[1]=='')
          Sfld=1;
        else
          Sfld=0;
        memdiv(mmri[0],res,16);
        setflg(initval,srci[2],res,bits);
      }
      
      if(ens[0]=='sub' || ens[0]=='cmp')
      {
        var initval=memdiv(mmri[0],"",16);
        var res=initval-srci[2]-brrw;
        var bits=16;
        res=adjst(res,bits);
        if(srci[1]=='')
          Sfld=1;
        else
          Sfld=0;
        if(ens[0]=='sub')
          memdiv(mmri[0],res,16);
        setflg(initval,srci[2],res,bits);
      }
      
      if(ens[0]=='and' || ens[0]=='test')
      {
        var res=memdiv(mmri[0],"",16) & srci[2];
        var bits=16;
        zero(res);
        sign(res,16);
        parity(res);
        if(ens[0]=='and')
          memdiv(mmri[0],res,16);
      }
      
      if(ens[0]=='or' || ens[0]=='xor')
      {
        var res=0;
        if(ens[0]=='or')
          res=memdiv(mmri[0],"",16) | srci[2];
        else if(ens[0]=='xor')
          res=memdiv(mmri[0],"",16) ^ srci[2];
        var bits=16;
        zero(res);
        sign(res,16);
        parity(res);
        memdiv(mmri[0],res,16);
      }
    }
  }
  regadj();
}

function shl(valu,bits)
{
  var res=parseInt((valu<<1).toString(2).slice(-bits),2);
  flb["cf"]=parseInt(valu.toString(2)[0]);
  if(valu.toString(2)[0]==res.toString(2)[0])
    flb["of"]=0;
  else
    flb["of"]=1;
  return res;
}

function shr(valu,bits)
{
  var res=valu>>1;
  flb["cf"]=parseInt(valu.toString(2)[valu.toString(2).length-1]);
  if(valu.toString(2)[0]==res.toString(2)[0])
    flb["of"]=0;
  else
    flb["of"]=1;
  return res;
}

function sar(valu,bits)
{
  var t=parseInt(valu.toString(2)[0]);
  var res=(valu>>1).toString(2);
  flb["cf"]=parseInt(valu.toString(2)[valu.toString(2).length-1]);
  res=parseInt((t+res),2);
  if(valu.toString(2)[0]==res.toString(2)[0])
    flb["of"]=0;
  else
    flb["of"]=1;
  return res;
}

function rol(valu,bits)
{
  res=shl(valu,bits);
  res=res.toString(2);
  res=res.substr(0,bits-1);
  res=res+flb["cf"];
  res=parseInt(res,2);
  if(valu.toString(2)[0]==res.toString(2)[0])
    flb["of"]=0;
  else
    flb["of"]=1;
  return res;
}

function ror(valu,bits)
{
  res=shr(valu,bits);
  res=res.toString(2);
  res=flb["cf"]+res;
  res=parseInt(res,2);
  if(valu.toString(2)[0]==res.toString(2)[0])
    flb["of"]=0;
  else
    flb["of"]=1;
  return res;
}

function rcl(valu,bits)
{
  var t=flb["cf"];
  res=shl(valu,bits);
  res=res.toString(2);
  res[bits-1]=t;
  res=parseInt(res,2);
  if(valu.toString(2)[0]==res.toString(2)[0])
    flb["of"]=0;
  else
    flb["of"]=1;
  return res;
}

function rcr(valu,bits)
{
  var t=flb["cf"];
  res=shr(valu,bits);
  res=t+res.toString(2);
  res=parseInt(res,2);
  if(valu.toString(2)[0]==res.toString(2)[0])
    flb["of"]=0;
  else
    flb["of"]=1;
  return res;
}

function evbits(kwrd)
{
  if(kwrd[1]=='h' || kwrd[1]=='l')
    return 8;
  else
    return 16;
}

function setflg(initval1,initval2,d,bits)
{
  sign(d,bits);
  parity(d);
  aux(initval1,initval2,d);
  zero(d);
  oflow(initval1,initval2,d,bits);
  carry(d,bits);
}

function adjst(res,bits)//adjust for negative numvber
{
  if(bits==32 && res<0)
  {
    var fin=4294967296+res;
    if(fin<0)
      fin=0;
    return fin;
  }
  else if(bits==16 && res<0)
  {
    var fin=65536+res;
    if(fin<0)
      fin=0;
    return fin;
  }
  else if(bits==8 && res<0)
  {
    var fin=256+res;
    if(fin<0)
      fin=0;
    return fin;
  }
  else
    return res;
}

function memdiv(mmr,val,bits)
{
  if(val!='')
  {
    mmr=parseInt(mmr);
    var valh='0000'+val.toString(16);
    var valh=valh.slice(-4);
    var lm=valh.slice(-2);
    var um=valh.slice(0,2);
    lm=parseInt(lm,16);
    um =parseInt(um,16);
    mer[mmr]=lm;
    mer[mmr+1]=um;
  }
  if(val=='')
  {
    var reval='';
    if(mer[mmr+1]!=undefined && mer[mmr]!=undefined && bits==16)
      reval=zfill(mer[mmr+1].toString(16))+zfill(mer[mmr].toString(16),2);
    else if(bits==8 ||(mer[mmr]!=undefined && mer[mmr+1]==undefined))
      reval=zfill(mer[mmr].toString(16),2);
    else if(mer[mmr+1]!=undefined && mer[mmr]==undefined)
      reval=zfill(mer[mmr+1],2);
    else
      reval=0;
    reval=parseInt(reval,16);
    return reval;
  }
}

function opmem(opmr,value,byts)
{
  opmr=parseInt(opmr);
  for(var cn=0;cn<byts;cn++)
  {
    var byt=parseInt(value.slice(-8),2);
    mer[opmr+cn]=byt;
    var tm=(byts-cn-1)*8;
    value=value.slice(0,tm)
  }
}

function chkimm(imm)
{
  if(imm.indexOf("]")>0 || imm.indexOf("h")<0)
    return false;
  var l='';
  var u='';
  imm=parseInt(imm,16);
  u=imm.toString(2);
  if(imm<=255)
  {  l=zfill(u,8);
      u='';
  }
  if(imm>255)
  {
    u=zfill(u,16);
    l=u.slice(-8);
    u=u.substr(0,8);
  }
  var im=[l,u,imm];
  return im;
}

function calcmeme(modt)
{
  if(modt.indexOf("]")<0)
    {return false;}
  modt=modt.split("][");
  var m1=modt[0].replace("[","").replace("]","");
  var m2='';
  var ld='';
  var ud='';
  try
  {
    m2=modt[1].replace("[","").replace("]","");
  }
  catch(e)
  {
    m2='';
  }
  var mmri=0;
  if(m2!='')
    mmri=calmem(m2)+parseInt(m1,16);
  else
    mmri=calmem(m1);
  var ret=new Array();
  ret[0]=mmri
  if(parseInt(m1) && parseInt(m1,16)<=255 && m2!='')
    {
      ret[1]="[d8]"+"["+m2+"]";
      ld=zfill(parseInt(m1,16).toString(2),8);
    }
  else if(parseInt(m1) && parseInt(m1,16)>255 && m2!='')
    {
      ret[1]="[d16]"+"["+m2+"]";
      ud=zfill(parseInt(m1,16).toString(2),16);
      ld=ud.slice(-8);
      ud=ud.substr(0,8);
    }
  else if(parseInt(m1) && parseInt(m1,16)<=255 && m2=='')
  {
    ret[1]="[d8]";
    ld=zfill(parseInt(m1,16).toString(2),8);
  }
  else
  {
    ret[1]="[d16]";
    ud=zfill(parseInt(m1,16).toString(2),16);
    ld=ud.slice(-8);
    ud=ud.substr(0,8);
  }
  ret[2]=ld;
  ret[3]=ud;
  return ret;
}
function calmem(m)
{
  var off=parseInt(m);
  if(!off)
  {
    if(m.indexOf('+')>=0)
    {
      m=m.split("+");
      if(m[0]=="bp")
        {off=16*regx["ss"]+regx["bp"]+regx[m[1]];}
      else
        {off=16*regx["ds"]+regx["bx"]+regx[m[1]];}
    }
    else
    {
      if(m=="bp")
        {off=regx["ss"]*16+regx["bp"];}
      else
        {off=regx["ds"]*16+regx[m];}
    }
  }
  else
  {
    off=16*regx["ds"]+parseInt(off,16);  
  }
  return off;
}

//jsun speciefik

window.onload=function()
{
  var txtarea=document.getElementById("assm");
  var regsts=document.getElementById("regs");
  var flgs=document.getElementById("flg");
  var opkod=document.getElementById("opkd");
  var memri=document.getElementById("memro");
  var stake=document.getElementById("stk");
  var onres=document.getElementById("sno");
  var ongop=document.getElementById("gno");
  var enst='';
  var kkd='';
  var pre=['','',''];

  
  
  function reset()
  {
    regx={"ax":0,"bx":0,"cx":0,"dx":0,
        "ah":0,"al":0,"bh":0,"bl":0,
        "ch":0,"cl":0,"dh":0,"dl":0,
        "si":0,"di":0,"sp":0x200,"bp":0,"ip":0x700,
        "ss":0x3000,"ds":0x2000,"cs":0x90,"es":0};
    flb={"cf":0,"pf":0,"af":0,"zf":0,"sf":0,"of":0,"if":0,
        "df":0,"tf":0};
    mer={};
  }
  
  //xhr objex retreve jsun
  var req=null;
  try{var req=new XMLHttpRequest();}
  catch(e){req=new ActiveXObject("Microsoft.XMLHTTP");}
  if(req==null){alert("no support for ajax");}
  var path="/funson600.json";
  req.open("GET",path);
  req.send('');
  req.onreadystatechange=function()
  {
    if (req.readyState == 4)
    {
      if (req.status == 200)
      {
        optable=JSON.parse(req.responseText);
      }
    }
  };
  //reset
  onres.onclick=function()
  {
    reset();
    txtarea.value='';
    display();
  }
  //get opcode
  ongop.onclick=function()
  {
    reset();
    process(txtarea.value);
    display();
  };
  //event on keyter
  
  txtarea.onkeypress=function(e)
  { 
    var xhr=null;
    var KeyID = (window.event) ? event.keyCode : e.keyCode;
    if(KeyID===13)
    {
      enst=txtarea.value;
      process(enst);
      display();
    }
  };
  
  //processing
  function process(code)
  {
    code=code.split("\n");
    var le=code.length;
    var lp=0x1000;
    var label={};
    var inc=0;
    for(var i=0;i<le;i++)
    {
      var con=frmt(code[i]);
      if(optable.chrckinst.indexOf(con[0])>=0)
      {
        mkode[lp]=convert(con);
        var instsiz=parseInt((mkode[lp].length+7)/8); //legt of instruksion to location pointer
        prog[lp]=con;
        mkode[lp]=mkode[lp].replace(/q/g,"");
        lp+=instsiz;
      }
      else
      {
        label[con[0]]=lp;
      }
    }
    
    for(var e in prog)
    {
      inc=0;
      if(Object.keys(label).indexOf(prog[e][1])>=0)
      {
        inc=label[prog[e][1]]-e+2;
        prog[e][1]=label[prog[e][1]];
      }
      simulate(prog[e],e,pre);
      mkode[e]=convert(prog[e]);
      mkode[e]=mkode[e].replace(/q/g,'');
      if(inc>0)
        mkode[e]+=mkode[e]+inc.toString(2);
      else if(inc<0)
        mkode[e]+=mkode[e]+(255-inc).toString(2);
      mle=(mkode[e].length)/8;
      opmem(e,mkode[e],mle);
      pre=prog[e];
    }
    //return mkode;
  }
  
  
  
  function convert(con)
  {
    
    var rm='',reg='',w='',sr='',d='',mod='',ud='',ld='',um='',lm='';
    var imm=false;
    var imp=[];
    var troy=['','','',''];
    var britta=['','',''];
    var opkode='';
    var s=Sfld;
    var v=Vfld;
    var z=flb["zf"];
    
    mem=con[1].replace("[").replace("h]");
    //chasing con 1
    if((optable.iterinst.indexOf(con[0]))<0)
    {  
      if(con[1] in optable.regfld && !(con[2] in optable.segfld))
      {  
        d='1';
        reg=optable.regfld[con[1]][0];
        w=optable.regfld[con[1]][1];
      }
      else if(con[1] in optable.rmfld)
      {
        d='0';
        rm=optable.rmfld[con[1]][0];
        w=optable.rmfld[con[1]][1];
        mod=optable.rmfld[con[1]][2];
      }
      else if(con[1] in optable.segfld)
      {
        sr=optable.segfld[con[1]];
        d='1';
      }
      else if(con[1]!='')
      { 
        troy=calcmeme(con[1]);
        rm=optable.rmfld[troy[1]][0];
        w=optable.rmfld[troy[1]][1];
        mod=optable.rmfld[troy[1]][2];
        d='0';
      }
    
      //chasing con 2
      if(con[2]!='')
      {
        if(con[2] in optable.rmfld && rm=='')
        {
          d='1';
          rm=optable.rmfld[con[2]][0];
          w=optable.rmfld[con[2]][1];
          mod=optable.rmfld[con[2]][2];
        }
        else if(con[2] in optable.regfld && reg=='')
        {
          d='0';
          reg=optable.regfld[con[2]][0];
          w=optable.regfld[con[2]][1];
        }
        else if(con[2] in optable.segfld && sr=='' && con[2]!='')
        {
          sr=optable.segfld[con[2]];
          d='0';
        }
        else if(con[2]!='' && chkimm(con[2])==false)
        {
          troy=calcmeme(con[2]);
          rm=optable.rmfld[troy[1]][0];
          w=optable.rmfld[troy[1]][1];
          mod=optable.rmfld[troy[1]][2];
        }
        else if(chkimm(con[2])!=false)
        {
          britta=chkimm(con[2]);
          imm=true;
        }
      }
      
      
      if(reg!='' && rm!='')
        imp.push('rmr');
        
      if(con[2]=='')
      {
        if(reg!='')
          imp.push('reg');
        
        else if(sr!='')
          imp.push('sreg');
          
        else if(rm!='')
          imp.push('rm');    
      }
      
      if(imm==true)
      {
        if(reg=='000' || (rm=='000' && mod=='11'))
          imp.push('aci');
        
        if(reg!='')
          imp.push('ir');
        else if(rm!='')
          imp.push('irm');
      }
      
      if(reg=='000' && rm=='110' && mod=='00')
      {
        if(d==1)
          imp.push('ma');
        else
          imp.push('am');
      }
      
      if(sr!='' && rm!='' && mod!='')
      {
        if(d==1)
          imp.push('rmsr');
        else if(d=='0')
          imp.push('srrm');
      }
      
      if(reg=='000' || (rm=='000' && mod=='11'))
        imp.push('rwa');
      
      if(con[1]=='' && con[2]=='')
        imp.push('none');
      
      if(rm=='' && con[1]!='')
      {
        rm=optable.rmfld[con[1]][0];
        w=optable.rmfld[con[1]][1];
        mod=optable.rmfld[con[1]][2];
      }
      
      if(con[0]=='shl'||con[0]=='sal'||con[0]=='shr'||con[0]=='sar'||con[0]=='rcr'||con[0]=='rcl'||con[0]=='ror'||con[0]=='rol')
      {
        imp.push('dbr');
        britta[0]='';
        britta[1]='';
        w=optable.rmfld[con[1]][1];
      }
    }
    
    for(var i=0; i<=imp.length; i++ )
    {
      opkode=optable.inst[con[0]+"_"+imp[i]];
      if(opkode != undefined)
        break;
      else{
        opkode=optable.insctr[con[0]+"_label"];
      }
      if(opkode!= undefined)
        break;
    }
    opkode=opkode.replace('d',d);
    opkode=opkode.replace('w',w);
    opkode=opkode.replace('reg',reg);
    opkode=opkode.replace('sr',sr);
    opkode=opkode.replace('mo',mod);
    opkode=opkode.replace('rm',rm);
    opkode=opkode.replace('s',s);
    opkode=opkode.replace('v',v);
    opkode=opkode.replace('z',z);
    op=opkode+troy[2]+troy[3]+britta[0]+britta[1];
    return op;
  }
  
  function display()
  {
    var kd='';
    var mm='';
    var st='';
    var fg='';
    var regs='';
    for(var i in regx)
    {
      var tmp=regx[i].toString();
      regs+=i.toUpperCase()+"   : "+tmp+"</br>";
    }
    for(var i in flb)
    {
      var tmp=flb[i];
      fg+=i.toUpperCase()+"   : "+tmp+"</br>";
    }
    for(var i in mer)
    {
      var tmp=mer[i].toString();
      if(i>=196608 && i<=262143)
        st+=i.toUpperCase()+"   : "+tmp+"</br>";
      else
        mm+=i.toUpperCase()+"   : "+tmp+"</br>";
    }
    regsts.innerHTML=regs;
    flgs.innerHTML=fg;
    stake.innerHTML=st;
    memri.innerHTML=mm;
    for(var i in mkode)
    {
      var tmp=parseInt(mkode[i],2).toString(16);
      kd+=tmp+"</br>";
    }
    opkod.innerHTML=kd;
    //var kd=JSON.stringify(mkode);
    //kd=kd.replace(/,/g,"</br>");
    //kd=kd.replace("{","").replace("}","");
    //opkod.innerHTML=kd;
  }
};
