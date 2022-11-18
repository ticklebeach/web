/*
 * ATTENTION: The "eval" devtool has been used (maybe by default in mode: "development").
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ "./src/octree/glslloader.js":
/*!**********************************!*\
  !*** ./src/octree/glslloader.js ***!
  \**********************************/
/***/ (() => {

eval("// MODIFY THE TEMPLATE VERSION OF THIS FILE. or #.glsl\n// THEN RUN GULP TO GENERATE SOURCE FILES.\n\nwindow.shaders = {\"octreeVertex\":\"#version 300 es\\nprecision highp float;precision highp int;uniform int iFrame;uniform int uDepth;uniform sampler2D uTreeTex;uniform sampler2D uStrokesTex;uniform vec3 uBoundsSize;uniform int uMaxDepth;uniform int uDoubleMaxDepth;in float iNodeIndex;\\n\\nflat out vec4 oNode;\\nflat out vec4 oResult;\\nflat out vec4 oCoord;\\nflat out vec4 oNormal;\\n\\n#define PI 3.1415925359;\\n#define MAX_STEPS 100;\\n#define MAX_DIST 200.\\n#define SURF_DIST .001\\n#define ZERO (min(iFrame,0))\\nstruct Result{float d;float m1;float m2;float b;float k;};float sdEllipsoid(in vec3 p,in vec3 r){float k0=length(p/r);float k1=length(p/(r*r));return (k0*(k0-1.0))/k1;}float sdSphere(vec3 p,float s){return length(p)-s;}float sdCapsule(vec3 p,vec3 a,vec3 b,float r){vec3 pa=p-a,ba=b-a;float h=clamp(dot(pa,ba)/dot(ba,ba),0.0,1.0);return length(pa-(ba*h))-r;}float sdVerticalCapsule(vec3 p,float h,float r){p.z-=clamp(p.z,-h,h);return length(p)-r;}float sdRoundBox(vec3 p,vec3 b,float r){vec3 q=abs(p)-b;return (length(max(q,0.))+min(max(q.x,max(q.y,q.z)),0.))-r;}float sdPlane(vec3 p,vec4 n){return dot(p,n.xyz)+n.w;}float sdLink(vec3 p,float le,float r1,float r2){vec3 q=vec3(p.x,max(abs(p.y)-le,0.),p.z);return length(vec2(length(q.xy)-r1,q.z))-r2;}float sdOctahedron(vec3 p,float s){p=abs(p);float m=((p.x+p.y)+p.z)-s;vec3 q;if((3.*p.x)<m)q=p.xyz;else if((3.*p.y)<m)q=p.yzx;else if((3.*p.z)<m)q=p.zxy;else return m*.57735027;float k=clamp(.5*((q.z-q.y)+s),0.,s);return length(vec3(q.x,(q.y-s)+k,q.z-k));}float sdEllipse(in vec2 p,in vec2 ab){if(abs(ab.x-ab.y)<1e-6)return length(p)-ab.x;p=abs(p);if(p.x>p.y){p=p.yx;ab=ab.yx;}float l=(ab.y*ab.y)-(ab.x*ab.x);float m=(ab.x*p.x)/l;float m2=m*m;float n=(ab.y*p.y)/l;float n2=n*n;float c=((m2+n2)-1.0)/3.0;float c3=(c*c)*c;float q=c3+((m2*n2)*2.0);float d=c3+(m2*n2);float g=m+(m*n2);float co;if(d<0.0){float h=acos(q/c3)/3.0;float s=cos(h);float t=sin(h)*sqrt(3.0);float rx=sqrt((-c*((s+t)+2.0))+m2);float ry=sqrt((-c*((s-t)+2.0))+m2);co=(((ry+(sign(l)*rx))+(abs(g)/(rx*ry)))-m)/2.0;}else{float h=((2.0*m)*n)*sqrt(d);float s=sign(q+h)*pow(abs(q+h),1.0/3.0);float u=sign(q-h)*pow(abs(q-h),1.0/3.0);float rx=((-s-u)-(c*4.0))+(2.0*m2);float ry=(s-u)*sqrt(3.0);float rm=sqrt((rx*rx)+(ry*ry));co=(((ry/sqrt(rm-rx))+((2.0*g)/rm))-m)/2.0;}vec2 r=ab*vec2(co,sqrt(1.0-(co*co)));return length(r-p)*sign(p.y-r.y);}float sdCircle(vec2 p,float r){return length(p)-r;}float sdBox(in vec2 p,in vec2 b){vec2 d=abs(p)-b;return length(max(d,0.0))+min(max(d.x,d.y),0.0);}float sdBox(vec3 p,vec3 b){vec3 q=abs(p)-b;return length(max(q,0.0))+min(max(q.x,max(q.y,q.z)),0.0);}float sdRoundBox(in vec2 p,in vec2 b,in float r){vec2 q=(abs(p)-b)+r;return (min(max(q.x,q.y),0.0)+length(max(q,0.0)))-r;}float sdEquilateralTriangle(in vec2 p,float s){p/=s;p.y+=0.5;const float k=sqrt(3.0);p.x=abs(p.x)-1.0;p.y=p.y+(1.0/k);if((p.x+(k*p.y))>0.0)p=vec2(p.x-(k*p.y),(-k*p.x)-p.y)/2.0;p.x-=clamp(p.x,-2.0,0.0);return (-length(p)*sign(p.y))*s;}float sdRoundTri(in vec2 p,float s,float r){s=s-r;p/=s;const float k=sqrt(3.0);p.x=abs(p.x)-1.0;p.y=p.y+(1.0/k);if((p.x+(k*p.y))>0.0)p=vec2(p.x-(k*p.y),(-k*p.x)-p.y)/2.0;p.x-=clamp(p.x,-2.0,0.0);return ((-length(p)*sign(p.y))*s)-r;}float dot2(in vec2 v){return dot(v,v);}float sdBezier(in vec2 pos,in vec2 A,in vec2 B,in vec2 C){vec2 a=B-A;vec2 b=(A-(2.0*B))+C;vec2 c=a*2.0;vec2 d=A-pos;float kk=1.0/dot(b,b);float kx=kk*dot(a,b);float ky=(kk*((2.0*dot(a,a))+dot(d,b)))/3.0;float kz=kk*dot(d,a);float res=0.0;float p=ky-(kx*kx);float p3=(p*p)*p;float q=(kx*(((2.0*kx)*kx)-(3.0*ky)))+kz;float h=(q*q)+(4.0*p3);if(h>=0.0){h=sqrt(h);vec2 x=(vec2(h,-h)-q)/2.0;vec2 uv=sign(x)*pow(abs(x),vec2(1.0/3.0));float t=clamp((uv.x+uv.y)-kx,0.0,1.0);res=dot2(d+((c+(b*t))*t));}else{float z=sqrt(-p);float v=acos(q/((p*z)*2.0))/3.0;float m=cos(v);float n=sin(v)*1.732050808;vec3 t=clamp((vec3(m+m,-n-m,n-m)*z)-kx,0.0,1.0);res=min(dot2(d+((c+(b*t.x))*t.x)),dot2(d+((c+(b*t.y))*t.y)));}return sqrt(res);}float sdTriPrism(vec3 p,float h,float r,float r2){vec3 q=abs(p);return max(q.z-h,max((q.x*r2)+(p.y*0.5),-p.y)-(r*0.5));}vec3 opConify(vec3 p,float zh){float s=mix(.5,1.5,clamp(p.z/zh,0.,1.));return vec3(p.x*s,p.y*s,p.z);}float opExtrussion(in vec3 p,in float sdf,in float h){vec2 w=vec2(sdf,abs(p.z)-h);return min(max(w.x,w.y),0.0)+length(max(w,0.0));}Result opIntersect(Result a,Result b){return Result(max(b.d,a.d),b.m1,b.m2,b.b,b.k);}Result opUnion(Result a,Result b){if(a.d<b.d)return a;else return b;}Result opSubtract(Result b,Result a){if(a.d>-b.d)return a;else return Result(-b.d,a.m1,a.m2,a.b,0.);}\\n#define BLEND_SIZE 3.\\nfloat getBlend(float d1,float d2,float blendSize){float diff=-abs(d1-d2);float blend=diff/blendSize;blend=clamp((blend+1.0)*0.5,0.,1.);return blend;}float smin(float a,float b,float k){float h=max(k-abs(a-b),0.0);float t=min(a,b)-(((h*h)*0.25)/k);return t;}Result opSmoothUnion(Result f1,Result f2,float k){k=k/2.;Result closest=f1;Result furthest=f2;float diff=float(f1.d>f2.d);closest.d=mix(f1.d,f2.d,diff);closest.m1=mix(f1.m1,f2.m1,diff);closest.m2=mix(f1.m2,f2.m2,diff);closest.b=mix(f1.b,f2.b,diff);furthest.d=mix(f2.d,f1.d,diff);furthest.m1=mix(f2.m1,f1.m1,diff);furthest.m2=mix(f2.m2,f1.m2,diff);furthest.b=mix(f2.b,f1.b,diff);float mf1=mix(closest.m2,closest.m1,float(closest.b<0.5));float mf2=mix(furthest.m2,furthest.m1,float(furthest.b<0.5));float t=smin(f1.d,f2.d,k);float bnew=getBlend(f1.d,f2.d,k);float b=max(closest.b,bnew);float bhigher=float(b>bnew);float m1=mix(mf1,closest.m1,bhigher);float m2=mix(mf2,closest.m2,bhigher);return Result(t,m1,m2,b,0.);}Result opSmoothUnion(Result a,Result b){return opSmoothUnion(a,b,5.);}Result opReplace(Result a,Result b){Result r=opSmoothUnion(a,b,a.k);return Result(b.d,r.m1,r.m2,r.b,r.k);}Result opSmoothSubtraction(Result a,Result b,float k){float h=max(k-abs(-a.d-b.d),0.0);float t=max(-a.d,b.d)+(((h*h)*0.25)/k);return Result(t,b.m1,b.m2,b.b,0.);}Result opSmoothSubtraction(Result a,Result b){return opSmoothSubtraction(a,b,2.5);}vec3 opSymX(vec3 p){return vec3(abs(p.x),p.yz);}vec4 opElongate(vec3 p,vec3 h){vec3 q=abs(p)-h;return vec4(max(q,0.0),min(max(q.x,max(q.y,q.z)),0.0));}float opRound(float d,float rad){return d-rad;}float sdCappedCylinder(vec3 p,float h,float r){vec2 d=abs(vec2(length(p.xy),p.z))-vec2(h,r);return min(max(d.x,d.y),0.0)+length(max(d,0.0));}float sdExtrudedCylinder(vec3 p,float h,vec2 r){return opExtrussion(p,sdEllipse(p.xy,r),h);}float sdExtrudedCircle(vec3 p,float h,vec2 r){return opExtrussion(p,sdCircle(p.xy,r.x),h);}float sdfModCube(vec3 _p,vec3 size,float round,float hole,float bevel,float cone){float _d;vec3 p1=_p;round=min(0.99,round);float rDim=round*min(size.x,min(size.y,size.z));if(hole>0.){if(bevel>0.){float holeRadius=max(0.,(1.-hole)*min(size.x,size.y));round=round*max(2.,min(holeRadius,size.z));float bevel=bevel*min(size.x-round,size.y-round);float coneScalar=cone>0.?((cone*((p1.z+size.z)-round))/(size.z-round))*2.:0.;float boxW=mix(size.z-round,round,coneScalar);float boxH=mix(size.y-round,round,coneScalar);float aBevel=mix(bevel,0.,coneScalar);_d=sdRoundBox(p1.xy,vec2(boxW,boxH),aBevel);_d=opExtrussion(p1,_d,size.z-round);}else{float r2=1.;_d=opExtrussion(p1,abs(sdBox(p1.xy,size.xy))-r2,size.z);}}else{if(((bevel>0.)||(round>0.))||(cone>0.)){round=round*max(2.,min(min(size.x,size.y),size.z));bevel=bevel*min(size.x-round,size.y-round);float coneScalar=cone>0.?abs(size.z-round)>1e-6?cone*clamp(((p1.z+size.z)-round)/((size.z-round)*2.),0.,1.):0.:0.;float minW=max(0.,size.x-size.y);float minH=max(0.,size.y-size.x);float boxW=mix(size.x-round,minW,coneScalar);float boxH=mix(size.y-round,minH,coneScalar);float aBevel=mix(bevel,0.,coneScalar);_d=sdRoundBox(p1.xy,vec2(boxW,boxH),aBevel);_d=opExtrussion(p1,_d,size.z-round);}else{_d=sdRoundBox(p1,size-rDim,rDim);}}_d=opRound(_d,round);return _d;}float sdfModCylinder(vec3 _p,vec3 size,float hole,float cone,float round){float _d;vec3 p1=_p;float radius0=abs(size.z)>1e-6?size.x-(((cone*size.x)*(p1.z+(size.z/2.)))/size.z):size.x;float radius1=abs(size.z)>1e-6?size.y-(((cone*size.y)*(p1.z+(size.z/2.)))/size.z):size.y;bool hasRound=round>0.1;round=hasRound?min(0.99,round):0.;round=round*min(size.x,min(size.y,size.z));if(hole>0.){float holeRadius=max(0.,(1.-hole)*min(size.x,min(size.y,size.z)));float rDepth=max(2.,size.z-round);if((abs(cone)<1e-6)&&(abs(size.x-size.y)<1e-6)){_d=sdCircle(p1.xy,max(2.,radius0-round));}else{_d=sdEllipse(p1.xy,vec2(max(2.,radius0-round),max(2.,radius1-round)));}_d=abs(_d-holeRadius);_d=opExtrussion(p1,_d,rDepth);}else{float rDepth=max(2.,size.z-round);if((abs(cone)<1e-6)&&(abs(size.x-size.y)<1e-6)){_d=sdExtrudedCircle(p1,rDepth,vec2(max(2.,radius0-round),max(2.,radius1-round)));}else{_d=sdExtrudedCylinder(p1,rDepth,vec2(max(2.,radius0-round),max(2.,radius1-round)));}}if(hasRound){_d=opRound(_d,round);}return _d;}float sdfModBezier(vec3 _p,vec3 size,int mode,float round,float lineWidth,float torus){vec3 p1=_p;float _d;float f=1.5;vec2 p0_=vec2(-size.x,size.y*-1.);vec2 p1_=vec2(0.,(size.y*2.)*f);vec2 p2_=vec2(size.x,size.y*-1.);round=min(0.99,round)*min(lineWidth,size.z);_d=sdBezier(p1.xy,p0_,p1_,p2_)-(lineWidth-round);if(mode==1){float ext=max(0.,torus>0.?0.:size.z-lineWidth);_d=opExtrussion(p1,_d,ext)-lineWidth;}else if(torus>0.){float r1=max(0.,lineWidth-2.);float ext=max(0.,size.z-lineWidth);_d=opExtrussion(p1,abs(_d-r1),ext)-size.z;}else{float ext=size.z-round;_d=opExtrussion(p1,_d,ext);bool hasRound=round>0.1;if(hasRound){_d=opRound(_d,round);}}return _d;}float sdfModJoint(vec3 _p,vec3 size,float cone,float round){vec3 p1=_p;float _d;float radius=cone>0.?size.x-(((cone*size.x)*(p1.z+(size.x*2.)))/(size.z+(size.x*2.))):size.x;_d=sdVerticalCapsule(p1,size.z,radius);if(round>0.1){_d=opRound(_d,round);}return _d;}float sdfStroke(int prim,vec3 _p,vec3 size,int mode,float round,float hole,float bevel,float cone,float lineWidth,float torus){if(prim==1){return sdfModCube(_p,size,round,hole,bevel,cone);}else if(prim==2){return sdfModCylinder(_p,size,hole,cone,round);}else if(prim==3){return sdfModBezier(_p,size,mode,round,lineWidth,torus);}else if(prim==4){return sdfModJoint(_p,size,cone,round);}else if(prim==5){return sdEllipsoid(_p,size);}else{return sdEllipsoid(_p,size);}}mat3 rotationMatrixFromEulers(vec3 v){vec3 s=vec3(sin(v.x),sin(v.y),sin(v.z));vec3 c=vec3(cos(v.x),cos(v.y),cos(v.z));return mat3(c.y*c.z,(c.x*s.z)+((c.z*s.x)*s.y),(s.x*s.z)-((c.x*c.z)*s.y),-c.y*s.z,(c.x*c.z)-((s.x*s.y)*s.z),(c.z*s.x)+((c.x*s.y)*s.z),s.y,-c.y*s.x,c.x*c.y);}ivec2 texturePos(int entryIndex,int stride){int width=2048;int perRow=width/stride;int x=int(mod(float(entryIndex),float(perRow)))*stride;int y=entryIndex/perRow;return ivec2(x,y);}Result evalScene(vec3 p){p=p*150.;p=mat3(1,0,0,0,0,1,0,-1,0)*p;p=p+vec3(0,0,256-150);Result res=Result(9999.,0.,0.,0.,0.);vec4 header=texelFetch(uStrokesTex,ivec2(0,0),0);int strokeCount=int(header.x);int stride=8;int layerCount=0;Result layerRes;int i=1;while(true){ivec2 texPos=texturePos(i,stride);vec4 a=texelFetch(uStrokesTex,texPos+ivec2(0,0),0);vec4 b=texelFetch(uStrokesTex,texPos+ivec2(1,0),0);vec4 c=texelFetch(uStrokesTex,texPos+ivec2(2,0),0);vec4 d=texelFetch(uStrokesTex,texPos+ivec2(3,0),0);vec4 e=texelFetch(uStrokesTex,texPos+ivec2(4,0),0);vec4 f=texelFetch(uStrokesTex,texPos+ivec2(5,0),0);vec4 g=texelFetch(uStrokesTex,texPos+ivec2(6,0),0);vec4 h=texelFetch(uStrokesTex,texPos+ivec2(7,0),0);int prim=int(a.x);int mode=int(a.y);vec3 pos=vec3(a.z,a.w,b.x);mat3 rot=inverse(rotationMatrixFromEulers(vec3(b.y,b.z,b.w)));vec3 size=vec3(c.x,c.y,c.z);float blend=c.w;float hole=d.y;float bevel=d.z;float round=d.w;float cone=e.x;float lineWidth=e.y;float torus=e.w;float mirror=f.x;float material=f.y;float offsX=g.y;Result r;float _d;vec3 _p;if(mirror==1.){_p=vec3(abs(p.x-(pos.x-offsX))-abs(offsX),p.yz-pos.yz);}else{_p=p-pos;}_p=rot*_p;_d=sdfStroke(prim,_p,size,mode,round,hole,bevel,cone,lineWidth,torus);r=Result(_d,material,0.,0.,blend);if(layerCount==0){layerRes=Result(9999.,0.,0.,0.,0.);}layerCount+=1;if(mode==0){if(r.k>0.){layerRes=opSmoothUnion(r,layerRes,r.k);}else{layerRes=opUnion(r,layerRes);}}else if(mode==1){if(r.k>0.){layerRes=opSmoothSubtraction(r,layerRes,r.k);}else{layerRes=opSubtract(r,layerRes);}}else if(mode==2){layerRes=opIntersect(r,layerRes);}else if(mode==3){layerRes=opReplace(r,layerRes);}if(g.z==1.){if(layerCount>1){int layerMode=int(g.w);float layerBlend=h.x;if(layerMode==0){if(layerBlend>0.){res=opSmoothUnion(layerRes,res,layerBlend);}else{res=opUnion(layerRes,res);}}else if(mode==1){if(r.k>0.){res=opSmoothSubtraction(layerRes,res,layerBlend);}else{res=opSubtract(layerRes,res);}}else if(mode==3){res=opReplace(layerRes,res);}}layerCount=0;}i++;if(i>strokeCount)break;}res.d*=(1./150.);return res;}vec3 GetNormal(vec3 p){vec3 n=vec3(0.0);for(int i=ZERO;i<4;i++){vec3 e=0.5773*((2.0*vec3(((i+3)>>1)&1,(i>>1)&1,i&1))-1.0);n+=(e*evalScene(p+(e*0.001)).d);}return normalize(n);}float map2(in vec3 pos,vec3 dir){return min(pos.y+1.0,evalScene(pos).d);}float calcAO(in vec3 pos,in vec3 nor){float ao=0.0;for(int i=ZERO;i<8;i++){float h=0.02+((0.5*float(i))/7.0);float d=map2(pos+(h*nor),nor);ao+=(h-d);}return clamp(1.5-(ao*0.6),0.0,1.0);}float mapScale(float v,float inMin,float inMax,float outMin,float outMax){return (((v-inMin)*(outMax-outMin))/(inMax-inMin))+outMin;}void main(){int treeIndex=int(iNodeIndex/8.);int octant=int(iNodeIndex)&7;ivec2 texPos=texturePos(treeIndex,1);vec3 center=texelFetch(uTreeTex,texPos,0).xyz;vec3 halfSize;if(uDoubleMaxDepth==1){halfSize=uBoundsSize/float(1<<((uDepth+1)+(uDepth==uMaxDepth?0:1)));}else{halfSize=uBoundsSize/float(1<<((uDepth+1)+1));}int i=octant;vec3 pos=vec3(bvec3((i&1)>0,(i&2)>0,(i&4)>0));vec3 offs=halfSize*((pos*2.)-1.);vec3 coord=center+offs;Result res=evalScene(coord);oResult=vec4(res.d,res.m1,res.m2,res.b);oCoord=vec4(coord,0.);float distToCorner=length(halfSize);if(abs(res.d)<distToCorner){if(uDepth<uMaxDepth){oNode.x=1.;}else{oNode.x=0.;vec3 normal=GetNormal(coord);oNormal=vec4(normal,calcAO(coord,normal));}}else{oNode.x=-1.;if((uDoubleMaxDepth==1)&&(uDepth==uMaxDepth)){vec3 normal=GetNormal(coord);oNormal=vec4(normal,calcAO(coord,normal));}}}\",\"raymarcherFragment\":\"#version 300 es\\nprecision highp float;precision highp int;uniform float iTime,iDate,iTimeDelta;uniform int iFrame;out lowp vec4 fragColor;\\nuniform vec2 iResolution;\\nuniform vec4 iMouse,iLastClick;\\nin vec2 fragCoord;\\nuniform sampler2D iTreeTex;uniform sampler2D uResultTex;uniform sampler2D uNormalTex;uniform vec3 uColors[75];uniform vec4 uMaterials[10];uniform vec3 uBoundsMin;uniform vec3 uBoundsMax;uniform vec3 uCameraPos;uniform vec3 uCameraLookAt;uniform float uCameraZoom;uniform vec3 uBackgroundColor1;uniform vec3 uBackgroundColor2;\\n#define PI 3.1415925359\\n#define MAX_STEPS 100\\n#define MAX_DIST 65.\\n#define SURF_DIST .01\\n#define ZERO (min(iFrame,0))\\n#define BOX_OFFS .02\\nstruct Result{float d;float m1;float m2;float b;float k;vec3 normal;float ao;float d2;};float sdBox(vec3 p,vec3 b){vec3 q=abs(p)-b;return length(max(q,0.0))+min(max(q.x,max(q.y,q.z)),0.0);}float aabb_ray_cast(vec3 boxMin,vec3 boxMax,vec3 from,vec3 dir){float tMin;float tMax;vec3 invD=1.0f/dir;vec3 t1=(boxMin.xyz-from)*invD;vec3 t2=(boxMax.xyz-from)*invD;vec3 minComps=min(t1,t2);vec3 maxComps=max(t1,t2);tMin=max(minComps.x,max(minComps.y,minComps.z));tMax=min(maxComps.x,min(maxComps.y,maxComps.z));return max(tMin,tMax);}ivec2 texturePos(int entryIndex,int stride){int width=2048;int perRow=width/stride;int x=int(mod(float(entryIndex),float(perRow)))*stride;int y=entryIndex/perRow;return ivec2(x,y);}Result evalDistanceBounds(vec3 p,out bool hits){vec3 halfSize=(uBoundsMax-uBoundsMin)/2.;vec3 boxPos=uBoundsMin+halfSize;float boxD=sdBox(p-boxPos,halfSize);hits=boxD<SURF_DIST;return Result(boxD+BOX_OFFS,81.,0.,0.,0.,vec3(0),0.,boxD+BOX_OFFS);}Result evalDistance(vec3 p,vec3 dir){vec3 fullSize=uBoundsMax-uBoundsMin;vec3 halfSize=fullSize/2.;vec3 center=uBoundsMin+halfSize;int treeIndex=0;ivec2 texPos;vec4 node;int depth=0;while(true){halfSize=fullSize/float(1<<(depth+1));texPos=texturePos(treeIndex,1);node=texelFetch(iTreeTex,texPos,0);bool recurse=node.x>0.5;if(recurse){ivec3 pos=ivec3(greaterThanEqual(p,center));int octant=(pos.x+(2*pos.y))+(4*pos.z);treeIndex=int(node.x)+octant;center+=((halfSize/2.)*((vec3(pos)*2.)-1.));}else{break;}depth++;if(depth==10)break;}vec4 result=texelFetch(uResultTex,texPos,0);float dist=result.x;if(depth==10){return Result(dist,0.,0.,0.,0.,vec3(0),0.,dist);}else{bool deadEnd=node.x<-0.01;if(deadEnd){vec3 minPos=center-halfSize;vec3 maxPos=center+halfSize;float t=aabb_ray_cast(minPos,maxPos,p,dir);float d=t<0.?dist:min(t+BOX_OFFS,dist);return Result(d,0.,result.z,result.w,0.,vec3(0),0.,dist);}else{vec4 normalAO=texelFetch(uNormalTex,texPos,0);vec3 normal=normalAO.xyz;float ao=normalAO.w;return Result(-.1,result.y,result.z,result.w,0.,normal,ao,dist);}}}void evalMaterial(float m,vec3 p,out vec3 col,out vec4 mat){m-=1.;int colorIndex=int(mod(abs(m),10000.))/10;int materialTypeIndex=int(mod(abs(m),10.));col=uColors[colorIndex]/255.;col=pow(col,vec3(2.2));mat=uMaterials[materialTypeIndex];}void XformP(inout vec3 p){p*=900.;p=(mat3(1,0,0,0,0,1,0,-1,0)*mat3(0,0,1,0,1,0,-1,0,0))*p;p+=vec3(0,0,280);}Result GetDistIgnoreBox(vec3 p,vec3 dir){return evalDistance(p,dir);}Result GetDist(vec3 p,vec3 dir,out bool hits){Result r=evalDistanceBounds(p,hits);if(hits){return evalDistance(p,dir);}else{return r;}}Result RayMarch(vec3 ro,vec3 rd,out int steps){float dO=0.;Result r=Result(dO,0.,0.,0.,0.,vec3(0),0.,dO);int i;for(i=ZERO;i<MAX_STEPS;i++){if(dO>MAX_DIST){break;}vec3 p=ro+(rd*dO);bool hits;Result ds=GetDist(p,rd,hits);if(ds.d<SURF_DIST){dO+=ds.d;r=Result(dO,ds.m1,ds.m2,ds.b,0.,ds.normal,ds.ao,dO);break;}dO+=ds.d;steps=i;}return r;}float shadows(in vec3 ro,in vec3 rd,float mint,float k){float res=1.0;float t=mint;float h=1.0;float maxt=3.;for(;t<maxt;){h=GetDistIgnoreBox(ro+(rd*t),rd).d2;if(h<(SURF_DIST*2.))return 0.;res=min(res,(k*h)/t);t+=h;}return clamp(res,0.0,1.0);}float mapScale(float v,float inMin,float inMax,float outMin,float outMax){return (((v-inMin)*(outMax-outMin))/(inMax-inMin))+outMin;}vec3 GetLight(vec3 pos,vec3 col,vec3 rd,vec4 mat,vec3 nor,float occ){vec3 view=-rd;float angle=1.;vec3 lightPos=vec3(5.*sin(angle),5.,6.+(5.*cos(angle)));vec3 lig=normalize(vec3(0.96,0.8,-0.7));float spow=5.;vec3 ref=reflect(rd,nor);float dif=mapScale(dot(nor,lig),-1.,1.,0.,1.);float amb=clamp(1.5+(0.5*nor.y),0.0,1.0);float spe=pow(clamp(dot(ref,lig),0.0,1.0),spow);float fre=pow(clamp(1.0+dot(nor,rd),0.0,1.0),2.0);float dom=0.;float shadow=shadows(pos+((nor*SURF_DIST)*2.),lig,0.05,3.);dif*=mapScale(smoothstep(0.,1.,shadow),0.,1.,0.5,1.);vec3 lin=vec3(0.0);lin+=dif;lin+=((amb*0.5)*occ);col=col*lin;return col;}struct ray{vec3 pos;vec3 dir;};ray cameraRay(vec2 uv,vec3 camPos,vec3 lookAt,float zoom){vec3 f=normalize(lookAt-camPos);vec3 r=normalize(cross(vec3(0.0,1.0,0.0),f));vec3 u=normalize(cross(f,r));vec3 c=camPos+(f*zoom);vec3 i=(c+(uv.x*r))+(uv.y*u);vec3 dir=i-camPos;return ray(camPos,normalize(dir));}struct cam{vec3 pos;vec3 lookAt;float zoom;};\\n#define AA 1\\nvoid main(){vec3 tot=vec3(0.0);for(int m=0;m<AA;m++)for(int n=0;n<AA;n++){vec2 o=(vec2(float(m),float(n))/float(AA))-0.5;vec2 uv=fragCoord+(o/iResolution.x);uv.x*=(iResolution.x/iResolution.y);ray camRay=cameraRay(uv,uCameraPos,uCameraLookAt,uCameraZoom);vec3 ro=camRay.pos;vec3 rd=camRay.dir;int steps;Result d=RayMarch(ro,rd,steps);vec3 color=pow(mix(uBackgroundColor1,uBackgroundColor2,uv.y),vec3(2.2));if((d.d<MAX_DIST)&&(d.m1>0.)){vec3 diffuse=vec3(1,1,1);vec4 mat;vec3 pp=ro+(rd*d.d);evalMaterial(d.m1,pp,diffuse,mat);vec3 diffuse2=vec3(1,1,1);vec4 mat2_;evalMaterial(d.m2,pp,diffuse2,mat2_);diffuse=d.m2==0.?diffuse:mix(diffuse,diffuse2,d.b);mat=d.m2==0.?mat:mix(mat,mat2_,d.b);color=GetLight(pp,diffuse,rd,mat,d.normal,d.ao);}tot+=color;}tot/=float(AA*AA);tot=pow(tot,vec3(1./2.2));fragColor=vec4(tot,1.);}\"};\n\n\n//# sourceURL=webpack://webpack-demo/./src/octree/glslloader.js?");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module can't be inlined because the eval devtool is used.
/******/ 	var __webpack_exports__ = {};
/******/ 	__webpack_modules__["./src/octree/glslloader.js"]();
/******/ 	
/******/ })()
;